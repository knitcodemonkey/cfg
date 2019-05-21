"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BreakpointInfo {
    constructor(id, requestedBreakpoint) {
        this.id = id;
        this.requestedBreakpoint = requestedBreakpoint;
        this.verified = false;
        this.hitCount = parseInt(requestedBreakpoint.hitCondition || '') || 0;
    }
    isEquivalent(other) {
        const bp1 = this.requestedBreakpoint;
        const bp2 = (other instanceof BreakpointInfo) ? other.requestedBreakpoint : other;
        return (bp1.line === bp2.line) && (bp1.column === bp2.column) &&
            (bp1.condition === bp2.condition) && (bp1.logMessage === bp2.logMessage);
    }
}
exports.BreakpointInfo = BreakpointInfo;
class OldProtocolBreakpointAdapter {
    constructor(breakpointInfo, actor) {
        this.breakpointInfo = breakpointInfo;
        this.actor = actor;
        this.hitCount = 0;
    }
    get actorName() {
        return this.actor.name;
    }
    delete() {
        return this.actor.delete();
    }
}
exports.OldProtocolBreakpointAdapter = OldProtocolBreakpointAdapter;
class NewProtocolBreakpointAdapter {
    constructor(breakpointInfo, sourceAdapter) {
        this.breakpointInfo = breakpointInfo;
        this.sourceAdapter = sourceAdapter;
        this.hitCount = 0;
    }
    get actorName() {
        return undefined;
    }
    delete() {
        return this.sourceAdapter.threadAdapter.actor.removeBreakpoint(this.breakpointInfo.actualLine, this.breakpointInfo.actualColumn, this.sourceAdapter.actor.url);
    }
}
exports.NewProtocolBreakpointAdapter = NewProtocolBreakpointAdapter;
class ConsoleAPICallAdapter {
    constructor(variables, threadAdapter) {
        this.variables = variables;
        this.threadAdapter = threadAdapter;
        this.referenceExpression = undefined;
        this.referenceFrame = undefined;
        this.variablesProviderId = threadAdapter.debugSession.variablesProviders.register(this);
    }
    getVariables() {
        return Promise.resolve(this.variables);
    }
}
exports.ConsoleAPICallAdapter = ConsoleAPICallAdapter;
//# sourceMappingURL=misc.js.map