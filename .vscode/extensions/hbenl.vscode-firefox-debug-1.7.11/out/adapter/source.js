"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const log_1 = require("../util/log");
const vscode_debugadapter_1 = require("vscode-debugadapter");
const misc_1 = require("./misc");
const log = log_1.Log.create('SourceAdapter');
const actorIdRegex = /[0-9]+$/;
class SourceAdapter {
    constructor(sourceRegistry, actor, sourcePath, threadAdapter, newBreakpointProtocol) {
        this.actor = actor;
        this.sourcePath = sourcePath;
        this.threadAdapter = threadAdapter;
        this.newBreakpointProtocol = newBreakpointProtocol;
        this.currentBreakpoints = [];
        this.desiredBreakpoints = undefined;
        this.isSyncingBreakpoints = false;
        this.id = sourceRegistry.register(this);
        this.source = SourceAdapter.createSource(actor, sourcePath, this.id);
    }
    static createSource(actor, sourcePath, id) {
        let sourceName = '';
        if (actor.url != null) {
            sourceName = actor.url.split('/').pop().split('#')[0];
        }
        else {
            let match = actorIdRegex.exec(actor.name);
            if (match) {
                sourceName = `${actor.source.introductionType || 'Script'} ${match[0]}`;
            }
        }
        let source;
        if (sourcePath !== undefined) {
            source = new vscode_debugadapter_1.Source(sourceName, sourcePath);
        }
        else {
            source = new vscode_debugadapter_1.Source(sourceName, actor.url || undefined, id);
        }
        if (actor.source.isBlackBoxed) {
            source.presentationHint = 'deemphasize';
        }
        return source;
    }
    updateBreakpoints(breakpoints) {
        this.desiredBreakpoints = breakpoints;
        this.checkAndSyncBreakpoints();
    }
    findBreakpointAdapterForActorName(actorName) {
        return this.currentBreakpoints.find(breakpointAdapter => (breakpointAdapter.actorName === actorName));
    }
    findBreakpointAdapterForLocation(location) {
        return this.currentBreakpoints.find(breakpointAdapter => (breakpointAdapter.breakpointInfo.actualLine === location.line) &&
            (breakpointAdapter.breakpointInfo.actualColumn === location.column));
    }
    checkAndSyncBreakpoints() {
        if ((this.desiredBreakpoints !== undefined) && !this.isSyncingBreakpoints) {
            if (this.newBreakpointProtocol) {
                this.syncBreakpoints();
            }
            else {
                this.threadAdapter.coordinator.runOnPausedThread(() => this.syncBreakpoints());
            }
        }
    }
    syncBreakpoints() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.isSyncingBreakpoints = true;
            const desiredBreakpoints = this.desiredBreakpoints;
            this.desiredBreakpoints = undefined;
            const breakpointsToDelete = [];
            const breakpointsToKeep = [];
            for (const currentBreakpoint of this.currentBreakpoints) {
                if (desiredBreakpoints.some(requestedBreakpoint => requestedBreakpoint.isEquivalent(currentBreakpoint.breakpointInfo))) {
                    breakpointsToKeep.push(currentBreakpoint);
                }
                else {
                    breakpointsToDelete.push(currentBreakpoint);
                }
            }
            if (log.isDebugEnabled)
                log.debug(`Going to delete ${breakpointsToDelete.length} breakpoints`);
            const deletionPromises = breakpointsToDelete.map(breakpointAdapter => breakpointAdapter.delete());
            yield Promise.all(deletionPromises);
            const breakpointsToAdd = desiredBreakpoints.filter(desiredBreakpoint => !this.currentBreakpoints.some(currentBreakpoint => desiredBreakpoint.isEquivalent(currentBreakpoint.breakpointInfo)));
            if (log.isDebugEnabled)
                log.debug(`Going to add ${breakpointsToAdd.length} breakpoints`);
            let addedBreakpoints;
            if (this.newBreakpointProtocol) {
                const breakpointPositions = yield this.actor.getBreakpointPositions();
                const additionPromises = breakpointsToAdd.map((breakpointInfo) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const actualLocation = this.findBreakpointPosition(breakpointInfo.requestedBreakpoint.line, breakpointInfo.requestedBreakpoint.column || 0, breakpointPositions);
                    breakpointInfo.actualLine = actualLocation.line;
                    breakpointInfo.actualColumn = actualLocation.column;
                    let logValue;
                    if (breakpointInfo.requestedBreakpoint.logMessage) {
                        logValue = `\`${breakpointInfo.requestedBreakpoint.logMessage.replace('{', '${')}\``;
                    }
                    yield this.threadAdapter.actor.setBreakpoint(breakpointInfo.actualLine, breakpointInfo.actualColumn, this.actor.url, breakpointInfo.requestedBreakpoint.condition, logValue);
                }));
                yield Promise.all(additionPromises);
                const breakpointsManager = this.threadAdapter.debugSession.breakpointsManager;
                addedBreakpoints = breakpointsToAdd.map(breakpointInfo => {
                    breakpointsManager.verifyBreakpoint(breakpointInfo, breakpointInfo.actualLine, breakpointInfo.actualColumn);
                    return new misc_1.NewProtocolBreakpointAdapter(breakpointInfo, this);
                });
            }
            else {
                const additionPromises = breakpointsToAdd.map(breakpointInfo => this.actor.setBreakpoint({
                    line: breakpointInfo.requestedBreakpoint.line,
                    column: breakpointInfo.requestedBreakpoint.column
                }, breakpointInfo.requestedBreakpoint.condition));
                const additionResults = yield Promise.all(additionPromises);
                const breakpointsManager = this.threadAdapter.debugSession.breakpointsManager;
                addedBreakpoints = additionResults.map((setBreakpointResult, index) => {
                    const desiredBreakpoint = breakpointsToAdd[index];
                    const actualLocation = setBreakpointResult.actualLocation;
                    const actualLine = actualLocation ? actualLocation.line : desiredBreakpoint.requestedBreakpoint.line;
                    const actualColumn = actualLocation ? actualLocation.column : desiredBreakpoint.requestedBreakpoint.column;
                    breakpointsManager.verifyBreakpoint(desiredBreakpoint, actualLine, actualColumn);
                    return new misc_1.OldProtocolBreakpointAdapter(desiredBreakpoint, setBreakpointResult.breakpointActor);
                });
            }
            this.currentBreakpoints = breakpointsToKeep.concat(addedBreakpoints);
            this.isSyncingBreakpoints = false;
            this.checkAndSyncBreakpoints();
        });
    }
    findBreakpointPosition(requestedLine, requestedColumn, breakpointPositions) {
        let line = Number.MAX_SAFE_INTEGER;
        let lastLine = 0;
        for (const l in breakpointPositions) {
            const possibleLine = parseInt(l);
            if ((possibleLine >= requestedLine) && (possibleLine < line)) {
                line = possibleLine;
            }
            if (possibleLine > lastLine) {
                lastLine = possibleLine;
            }
        }
        if (line === Number.MAX_SAFE_INTEGER) {
            line = lastLine;
        }
        if (line === requestedLine) {
            for (const column of breakpointPositions[line]) {
                if (column >= requestedColumn) {
                    return { line, column };
                }
            }
        }
        const column = breakpointPositions[line][0];
        return { line, column };
    }
    dispose() {
        this.actor.dispose();
    }
}
exports.SourceAdapter = SourceAdapter;
//# sourceMappingURL=source.js.map