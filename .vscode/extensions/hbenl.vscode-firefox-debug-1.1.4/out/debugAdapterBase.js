"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const vscode_debugadapter_1 = require("vscode-debugadapter");
class DebugAdapterBase extends vscode_debugadapter_1.DebugSession {
    constructor(debuggerLinesStartAt1, isServer = false) {
        super(debuggerLinesStartAt1, isServer);
    }
    initializeRequest(response, args) {
        this.handleRequest(response, () => this.initialize(args));
    }
    disconnectRequest(response, args) {
        this.handleRequestAsync(response, () => this.disconnect(args));
    }
    launchRequest(response, args) {
        this.handleRequestAsync(response, () => this.launch(args));
    }
    attachRequest(response, args) {
        this.handleRequestAsync(response, () => this.attach(args));
    }
    setBreakPointsRequest(response, args) {
        this.handleRequestAsync(response, () => this.setBreakpoints(args));
    }
    setExceptionBreakPointsRequest(response, args) {
        this.handleRequest(response, () => this.setExceptionBreakpoints(args));
    }
    pauseRequest(response, args) {
        this.handleRequestAsync(response, () => this.pause(args));
    }
    nextRequest(response, args) {
        this.handleRequestAsync(response, () => this.next(args));
    }
    stepInRequest(response, args) {
        this.handleRequestAsync(response, () => this.stepIn(args));
    }
    stepOutRequest(response, args) {
        this.handleRequestAsync(response, () => this.stepOut(args));
    }
    continueRequest(response, args) {
        this.handleRequestAsync(response, () => this.continue(args));
    }
    sourceRequest(response, args) {
        this.handleRequestAsync(response, () => this.getSource(args));
    }
    threadsRequest(response) {
        this.handleRequest(response, () => this.getThreads());
    }
    stackTraceRequest(response, args) {
        this.handleRequestAsync(response, () => this.getStackTrace(args));
    }
    scopesRequest(response, args) {
        this.handleRequest(response, () => this.getScopes(args));
    }
    variablesRequest(response, args) {
        this.handleRequestAsync(response, () => this.getVariables(args));
    }
    setVariableRequest(response, args) {
        this.handleRequestAsync(response, () => this.setVariable(args));
    }
    evaluateRequest(response, args) {
        this.handleRequestAsync(response, () => this.evaluate(args));
    }
    completionsRequest(response, args) {
        this.handleRequestAsync(response, () => this.getCompletions(args));
    }
    customRequest(command, response, args) {
        this.handleRequestAsync(response, () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            switch (command) {
                case 'reloadAddon':
                    return yield this.reloadAddon();
                case 'rebuildAndReloadAddon':
                    yield this.rebuildAddon();
                    return yield this.reloadAddon();
                case 'toggleSkippingFile':
                    return yield this.toggleSkippingFile(args);
            }
        }));
    }
    handleRequest(response, executeRequest) {
        try {
            response.body = executeRequest();
        }
        catch (err) {
            response.success = false;
            response.message = this.errorString(err);
        }
        this.sendResponse(response);
    }
    handleRequestAsync(response, executeRequest) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                response.body = yield executeRequest();
            }
            catch (err) {
                response.success = false;
                response.message = this.errorString(err);
            }
            this.sendResponse(response);
        });
    }
    errorString(err) {
        if ((typeof err === 'object') && (err !== null) && (typeof err.message === 'string')) {
            return err.message;
        }
        else {
            return String(err);
        }
    }
}
exports.DebugAdapterBase = DebugAdapterBase;
//# sourceMappingURL=debugAdapterBase.js.map