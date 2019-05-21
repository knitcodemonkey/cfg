"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../util/log");
const misc_1 = require("../util/misc");
const index_1 = require("./index");
const vscode_debugadapter_1 = require("vscode-debugadapter");
let log = log_1.Log.create('BreakpointsManager');
const isWindowsPlatform = misc_1.isWindowsPlatform();
const windowsAbsolutePathRegEx = /^[a-zA-Z]:\\/;
class BreakpointsManager {
    constructor(threads, sendEvent) {
        this.threads = threads;
        this.sendEvent = sendEvent;
        this.nextBreakpointId = 1;
        this.breakpointsBySourcePathOrUrl = new Map();
    }
    setBreakpoints(breakpoints, sourcePathOrUrl) {
        log.debug(`Setting ${breakpoints.length} breakpoints for ${sourcePathOrUrl}`);
        const key = this.createBreakpointInfoKey(sourcePathOrUrl);
        const oldBreakpointInfos = this.breakpointsBySourcePathOrUrl.get(key);
        const breakpointInfos = breakpoints.map(breakpoint => this.getOrCreateBreakpointInfo(breakpoint, oldBreakpointInfos));
        this.breakpointsBySourcePathOrUrl.set(key, breakpointInfos);
        for (const [, threadAdapter] of this.threads) {
            const sourceAdapters = threadAdapter.findSourceAdaptersForPathOrUrl(sourcePathOrUrl);
            for (const sourceAdapter of sourceAdapters) {
                sourceAdapter.updateBreakpoints(breakpointInfos);
            }
        }
        return breakpointInfos;
    }
    verifyBreakpoint(breakpointInfo, actualLine, actualColumn) {
        if ((breakpointInfo.actualLine !== actualLine) ||
            (breakpointInfo.actualColumn !== actualColumn) ||
            !breakpointInfo.verified) {
            let breakpoint = new vscode_debugadapter_1.Breakpoint(true, actualLine, actualColumn);
            breakpoint.id = breakpointInfo.id;
            this.sendEvent(new vscode_debugadapter_1.BreakpointEvent('changed', breakpoint));
            breakpointInfo.actualLine = actualLine;
            breakpointInfo.actualColumn = actualColumn;
            breakpointInfo.verified = true;
        }
    }
    onNewSource(sourceAdapter) {
        const sourcePath = sourceAdapter.sourcePath;
        if (sourcePath !== undefined) {
            const key = this.createBreakpointInfoKey(sourcePath);
            const breakpointInfos = this.breakpointsBySourcePathOrUrl.get(key);
            if (breakpointInfos !== undefined) {
                sourceAdapter.updateBreakpoints(breakpointInfos);
            }
        }
    }
    createBreakpointInfoKey(sourcePathOrUrl) {
        if (isWindowsPlatform && windowsAbsolutePathRegEx.test(sourcePathOrUrl)) {
            return sourcePathOrUrl.toLowerCase();
        }
        else {
            return sourcePathOrUrl;
        }
    }
    getOrCreateBreakpointInfo(requestedBreakpoint, oldBreakpointInfos) {
        if (oldBreakpointInfos) {
            const oldBreakpointInfo = oldBreakpointInfos.find(breakpointInfo => breakpointInfo.isEquivalent(requestedBreakpoint));
            if (oldBreakpointInfo) {
                return oldBreakpointInfo;
            }
        }
        return new index_1.BreakpointInfo(this.nextBreakpointId++, requestedBreakpoint);
    }
}
exports.BreakpointsManager = BreakpointsManager;
//# sourceMappingURL=breakpointsManager.js.map