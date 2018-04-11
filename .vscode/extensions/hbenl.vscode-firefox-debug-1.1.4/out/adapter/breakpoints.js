"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../util/log");
const index_1 = require("../adapter/index");
const vscode_debugadapter_1 = require("vscode-debugadapter");
let log = log_1.Log.create('BreakpointsAdapter');
class BreakpointsAdapter {
    constructor(threads, sendEvent) {
        this.threads = threads;
        this.sendEvent = sendEvent;
        this.nextBreakpointId = 1;
        this.breakpointsBySourcePathOrUrl = new Map();
        this.verifiedBreakpointSources = [];
    }
    setBreakpoints(args) {
        let breakpoints = args.breakpoints || [];
        log.debug(`Setting ${breakpoints.length} breakpoints for ${args.source.path}`);
        const pathOrUrl = args.source.path;
        if (pathOrUrl === undefined) {
            throw 'Couldn\'t set breakpoint: unknown source path';
        }
        let breakpointInfos = breakpoints.map((breakpoint) => ({
            id: this.nextBreakpointId++,
            requestedLine: breakpoint.line,
            requestedColumn: breakpoint.column,
            condition: breakpoint.condition
        }));
        this.breakpointsBySourcePathOrUrl.set(pathOrUrl, breakpointInfos);
        this.verifiedBreakpointSources = this.verifiedBreakpointSources.filter((verifiedSourcePath) => (verifiedSourcePath !== pathOrUrl));
        return new Promise((resolve, reject) => {
            for (let [, threadAdapter] of this.threads) {
                let sourceAdapters = threadAdapter.findSourceAdaptersForPathOrUrl(pathOrUrl);
                for (let sourceAdapter of sourceAdapters) {
                    log.debug(`Found source ${pathOrUrl} on tab ${threadAdapter.actorName}`);
                    let setBreakpointsPromise = this.setBreakpointsOnSourceActor(breakpointInfos, sourceAdapter, threadAdapter.coordinator);
                    if (this.verifiedBreakpointSources.indexOf(pathOrUrl) < 0) {
                        setBreakpointsPromise.then((breakpointAdapters) => {
                            log.debug('Replying to setBreakpointsRequest with actual breakpoints from the first thread with this source');
                            resolve({
                                breakpoints: breakpointAdapters.map((breakpointAdapter) => {
                                    let breakpoint = new vscode_debugadapter_1.Breakpoint(true, breakpointAdapter.breakpointInfo.actualLine, breakpointAdapter.breakpointInfo.actualColumn);
                                    breakpoint.id = breakpointAdapter.breakpointInfo.id;
                                    return breakpoint;
                                })
                            });
                        });
                        this.verifiedBreakpointSources.push(pathOrUrl);
                    }
                }
            }
            if (this.verifiedBreakpointSources.indexOf(pathOrUrl) < 0) {
                log.debug(`Replying to setBreakpointsRequest (Source ${pathOrUrl} not seen yet)`);
                resolve({
                    breakpoints: breakpointInfos.map((breakpointInfo) => {
                        let breakpoint = new vscode_debugadapter_1.Breakpoint(false, breakpointInfo.requestedLine, breakpointInfo.requestedColumn);
                        breakpoint.id = breakpointInfo.id;
                        return breakpoint;
                    })
                });
            }
        });
    }
    setBreakpointsOnNewSource(sourceAdapter, threadAdapter) {
        const sourcePath = sourceAdapter.sourcePath;
        if (sourcePath && this.breakpointsBySourcePathOrUrl.has(sourcePath)) {
            let breakpointInfos = this.breakpointsBySourcePathOrUrl.get(sourcePath) || [];
            if (sourceAdapter !== undefined) {
                let setBreakpointsPromise = this.setBreakpointsOnSourceActor(breakpointInfos, sourceAdapter, threadAdapter.coordinator);
                if (this.verifiedBreakpointSources.indexOf(sourcePath) < 0) {
                    setBreakpointsPromise.then((breakpointAdapters) => {
                        log.debug('Updating breakpoints');
                        breakpointAdapters.forEach((breakpointAdapter) => {
                            let breakpoint = new vscode_debugadapter_1.Breakpoint(true, breakpointAdapter.breakpointInfo.actualLine);
                            breakpoint.id = breakpointAdapter.breakpointInfo.id;
                            this.sendEvent(new vscode_debugadapter_1.BreakpointEvent('changed', breakpoint));
                        });
                        this.verifiedBreakpointSources.push(sourcePath);
                    });
                }
            }
            ;
        }
    }
    setBreakpointsOnSourceActor(breakpointsToSet, sourceAdapter, threadCoordinator) {
        if (sourceAdapter.hasCurrentBreakpoints()) {
            let currentBreakpoints = sourceAdapter.getCurrentBreakpoints();
            if (this.breakpointsAreEqual(breakpointsToSet, currentBreakpoints)) {
                return Promise.resolve(currentBreakpoints);
            }
        }
        return threadCoordinator.runOnPausedThread(() => this.setBreakpointsOnPausedSourceActor(breakpointsToSet, sourceAdapter));
    }
    setBreakpointsOnPausedSourceActor(origBreakpointsToSet, sourceAdapter) {
        let breakpointsToSet = origBreakpointsToSet.slice();
        log.debug(`Setting ${breakpointsToSet.length} breakpoints for ${sourceAdapter.actor.url}`);
        let result = new Promise((resolve, reject) => {
            sourceAdapter.getBreakpointsPromise().then((oldBreakpoints) => {
                log.debug(`${oldBreakpoints.length} breakpoints were previously set for ${sourceAdapter.actor.url}`);
                let newBreakpoints = [];
                let breakpointsBeingRemoved = [];
                let breakpointsBeingSet = [];
                oldBreakpoints.forEach((breakpointAdapter) => {
                    let breakpointIndex = -1;
                    for (let i = 0; i < breakpointsToSet.length; i++) {
                        let breakpointToSet = breakpointsToSet[i];
                        if (breakpointToSet &&
                            (breakpointToSet.requestedLine === breakpointAdapter.breakpointInfo.requestedLine) &&
                            (breakpointToSet.requestedColumn === breakpointAdapter.breakpointInfo.requestedColumn)) {
                            breakpointIndex = i;
                            break;
                        }
                    }
                    if (breakpointIndex >= 0) {
                        newBreakpoints[breakpointIndex] = breakpointAdapter;
                        breakpointsToSet[breakpointIndex] = undefined;
                    }
                    else {
                        breakpointsBeingRemoved.push(breakpointAdapter.actor.delete().catch((err) => {
                            log.error(`Failed removing breakpoint: ${err}`);
                        }));
                    }
                });
                breakpointsToSet.map((requestedBreakpoint, index) => {
                    if (requestedBreakpoint !== undefined) {
                        breakpointsBeingSet.push(sourceAdapter.actor.setBreakpoint({
                            line: requestedBreakpoint.requestedLine,
                            column: requestedBreakpoint.requestedColumn,
                        }, requestedBreakpoint.condition).then((setBreakpointResult) => {
                            requestedBreakpoint.actualLine =
                                (setBreakpointResult.actualLocation === undefined) ?
                                    requestedBreakpoint.requestedLine :
                                    setBreakpointResult.actualLocation.line;
                            requestedBreakpoint.actualColumn =
                                (setBreakpointResult.actualLocation === undefined) ?
                                    requestedBreakpoint.requestedColumn :
                                    setBreakpointResult.actualLocation.column;
                            newBreakpoints[index] = new index_1.BreakpointAdapter(requestedBreakpoint, setBreakpointResult.breakpointActor);
                        }, (err) => {
                            log.error(`Failed setting breakpoint: ${err}`);
                        }));
                    }
                });
                log.debug(`Adding ${breakpointsBeingSet.length} and removing ${breakpointsBeingRemoved.length} breakpoints`);
                Promise.all(breakpointsBeingRemoved).then(() => Promise.all(breakpointsBeingSet)).then(() => {
                    resolve(newBreakpoints);
                });
            });
        });
        sourceAdapter.setBreakpointsPromise(result);
        return result;
    }
    breakpointsAreEqual(breakpointsToSet, currentBreakpoints) {
        let breakpointsToSetLines = new Set(breakpointsToSet.map((breakpointInfo) => breakpointInfo.requestedLine));
        let currentBreakpointsLines = new Set(currentBreakpoints.map((breakpointAdapter) => breakpointAdapter.breakpointInfo.requestedLine));
        if (breakpointsToSetLines.size !== currentBreakpointsLines.size) {
            return false;
        }
        for (let line of breakpointsToSetLines.keys()) {
            if (!currentBreakpointsLines.has(line)) {
                return false;
            }
        }
        return true;
    }
}
exports.BreakpointsAdapter = BreakpointsAdapter;
class BreakpointInfo {
}
exports.BreakpointInfo = BreakpointInfo;
//# sourceMappingURL=breakpoints.js.map