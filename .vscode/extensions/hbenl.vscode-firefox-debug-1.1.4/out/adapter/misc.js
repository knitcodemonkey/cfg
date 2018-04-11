"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_debugadapter_1 = require("vscode-debugadapter");
let actorIdRegex = /[0-9]+$/;
class SourceAdapter {
    constructor(sourceRegistry, actor, sourcePath) {
        this.actor = actor;
        this.sourcePath = sourcePath;
        this.id = sourceRegistry.register(this);
        this.breakpointsPromise = Promise.resolve([]);
        this.currentBreakpoints = [];
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
    getBreakpointsPromise() {
        return this.breakpointsPromise;
    }
    hasCurrentBreakpoints() {
        return this.currentBreakpoints !== undefined;
    }
    getCurrentBreakpoints() {
        return this.currentBreakpoints;
    }
    setBreakpointsPromise(promise) {
        this.breakpointsPromise = promise;
        this.currentBreakpoints = undefined;
        this.breakpointsPromise.then((breakpoints) => this.currentBreakpoints = breakpoints);
    }
    dispose() {
        this.actor.dispose();
    }
}
exports.SourceAdapter = SourceAdapter;
class BreakpointAdapter {
    constructor(requestedBreakpoint, actor) {
        this.breakpointInfo = requestedBreakpoint;
        this.actor = actor;
    }
}
exports.BreakpointAdapter = BreakpointAdapter;
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