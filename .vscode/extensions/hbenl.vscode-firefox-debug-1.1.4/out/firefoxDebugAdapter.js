"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const vscode_debugadapter_1 = require("vscode-debugadapter");
const log_1 = require("./util/log");
const misc_1 = require("./util/misc");
const debugAdapterBase_1 = require("./debugAdapterBase");
const index_1 = require("./firefox/index");
const configuration_1 = require("./configuration");
const firefoxDebugSession_1 = require("./firefoxDebugSession");
let log = log_1.Log.create('FirefoxDebugAdapter');
class FirefoxDebugAdapter extends debugAdapterBase_1.DebugAdapterBase {
    constructor(debuggerLinesStartAt1, isServer = false) {
        super(debuggerLinesStartAt1, isServer);
        if (!isServer) {
            log_1.Log.consoleLog = (msg) => {
                this.sendEvent(new vscode_debugadapter_1.OutputEvent(msg + '\n'));
            };
        }
    }
    initialize(args) {
        return {
            supportsConfigurationDoneRequest: false,
            supportsEvaluateForHovers: false,
            supportsFunctionBreakpoints: false,
            supportsConditionalBreakpoints: true,
            supportsSetVariable: true,
            supportsCompletionsRequest: true,
            supportsDelayedStackTraceLoading: true,
            exceptionBreakpointFilters: [
                {
                    filter: 'all',
                    label: 'All Exceptions',
                    default: false
                },
                {
                    filter: 'uncaught',
                    label: 'Uncaught Exceptions',
                    default: true
                }
            ]
        };
    }
    launch(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.startSession(args);
        });
    }
    attach(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.startSession(args);
        });
    }
    startSession(config) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (config.log) {
                log_1.Log.setConfig(config.log);
            }
            let parsedConfig = yield configuration_1.parseConfiguration(config);
            this.session = new firefoxDebugSession_1.FirefoxDebugSession(parsedConfig, (ev) => this.sendEvent(ev));
            yield this.session.start();
        });
    }
    setBreakpoints(args) {
        return this.session.breakpointsAdapter.setBreakpoints(args);
    }
    setExceptionBreakpoints(args) {
        log.debug(`Setting exception filters: ${JSON.stringify(args.filters)}`);
        let exceptionBreakpoints = index_1.ExceptionBreakpoints.None;
        if (args.filters.indexOf('all') >= 0) {
            exceptionBreakpoints = index_1.ExceptionBreakpoints.All;
        }
        else if (args.filters.indexOf('uncaught') >= 0) {
            exceptionBreakpoints = index_1.ExceptionBreakpoints.Uncaught;
        }
        this.session.setExceptionBreakpoints(exceptionBreakpoints);
    }
    pause(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let threadAdapter = this.getThreadAdapter(args.threadId);
            this.session.setActiveThread(threadAdapter);
            yield threadAdapter.interrupt();
            let stoppedEvent = new vscode_debugadapter_1.StoppedEvent('interrupt', threadAdapter.id);
            stoppedEvent.body.allThreadsStopped = false;
            this.sendEvent(stoppedEvent);
        });
    }
    next(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let threadAdapter = this.getThreadAdapter(args.threadId);
            this.session.setActiveThread(threadAdapter);
            yield threadAdapter.stepOver();
        });
    }
    stepIn(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let threadAdapter = this.getThreadAdapter(args.threadId);
            this.session.setActiveThread(threadAdapter);
            yield threadAdapter.stepIn();
        });
    }
    stepOut(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let threadAdapter = this.getThreadAdapter(args.threadId);
            this.session.setActiveThread(threadAdapter);
            yield threadAdapter.stepOut();
        });
    }
    continue(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let threadAdapter = this.getThreadAdapter(args.threadId);
            this.session.setActiveThread(threadAdapter);
            yield threadAdapter.resume();
            return { allThreadsContinued: false };
        });
    }
    getSource(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let sourceAdapter;
            if (args.sourceReference !== undefined) {
                let sourceReference = args.sourceReference;
                sourceAdapter = this.session.sources.find(sourceReference);
            }
            else if (args.source && args.source.path) {
                sourceAdapter = this.session.findSourceAdapter(args.source.path, true);
            }
            if (!sourceAdapter) {
                throw new Error('Failed sourceRequest: the requested source can\'t be found');
            }
            let sourceGrip = yield sourceAdapter.actor.fetchSource();
            if (typeof sourceGrip === 'string') {
                return { content: sourceGrip, mimeType: 'text/javascript' };
            }
            else {
                let longStringGrip = sourceGrip;
                let longStringActor = this.session.getOrCreateLongStringGripActorProxy(longStringGrip);
                let content = yield longStringActor.fetchContent();
                return { content, mimeType: 'text/javascript' };
            }
        });
    }
    getThreads() {
        log.debug(`${this.session.threads.count} threads`);
        let threads = this.session.threads.map((threadAdapter) => new vscode_debugadapter_1.Thread(threadAdapter.id, threadAdapter.name));
        return { threads };
    }
    getStackTrace(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let threadAdapter = this.getThreadAdapter(args.threadId);
            this.session.setActiveThread(threadAdapter);
            let [frameAdapters, totalFrames] = yield threadAdapter.fetchStackFrames(args.startFrame || 0, args.levels || 0);
            let stackFrames = frameAdapters.map((frameAdapter) => frameAdapter.getStackframe());
            return { stackFrames, totalFrames };
        });
    }
    getScopes(args) {
        let frameAdapter = this.session.frames.find(args.frameId);
        if (!frameAdapter) {
            throw new Error('Failed scopesRequest: the requested frame can\'t be found');
        }
        this.session.setActiveThread(frameAdapter.threadAdapter);
        let scopes = frameAdapter.scopeAdapters.map((scopeAdapter) => scopeAdapter.getScope());
        return { scopes };
    }
    getVariables(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let variablesProvider = this.session.variablesProviders.find(args.variablesReference);
            if (!variablesProvider) {
                throw new Error('Failed variablesRequest: the requested object reference can\'t be found');
            }
            this.session.setActiveThread(variablesProvider.threadAdapter);
            try {
                let variables = yield variablesProvider.threadAdapter.fetchVariables(variablesProvider);
                return { variables };
            }
            catch (err) {
                let msg;
                if (err === 'No such actor') {
                    msg = 'Value can\'t be inspected - this is probably due to Firefox bug #1249962';
                }
                else {
                    msg = String(err);
                }
                return { variables: [new vscode_debugadapter_1.Variable('Error from debugger', msg)] };
            }
        });
    }
    setVariable(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let variablesProvider = this.session.variablesProviders.find(args.variablesReference);
            if (variablesProvider === undefined) {
                throw new Error('Failed setVariableRequest: the requested context can\'t be found');
            }
            if (variablesProvider.referenceFrame === undefined) {
                throw new Error('Failed setVariableRequest: the requested context has no associated stack frame');
            }
            let referenceExpression = misc_1.accessorExpression(variablesProvider.referenceExpression, args.name);
            let setterExpression = `${referenceExpression} = ${args.value}`;
            let frameActorName = variablesProvider.referenceFrame.frame.actor;
            let result = yield variablesProvider.threadAdapter.evaluate(setterExpression, false, frameActorName);
            return { value: result.value, variablesReference: result.variablesReference };
        });
    }
    evaluate(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let variable = undefined;
            if (args.context === 'watch') {
                if (args.frameId !== undefined) {
                    let frameAdapter = this.session.frames.find(args.frameId);
                    if (frameAdapter !== undefined) {
                        this.session.setActiveThread(frameAdapter.threadAdapter);
                        let threadAdapter = frameAdapter.threadAdapter;
                        let frameActorName = frameAdapter.frame.actor;
                        variable = yield threadAdapter.evaluate(args.expression, true, frameActorName);
                    }
                    else {
                        log.warn(`Couldn\'t find specified frame for evaluating ${args.expression}`);
                        throw 'not available';
                    }
                }
                else {
                    let threadAdapter = this.session.getActiveThread();
                    if (threadAdapter !== undefined) {
                        variable = yield threadAdapter.evaluate(args.expression, true);
                    }
                    else {
                        log.info(`Couldn't find a thread for evaluating watch ${args.expression}`);
                        throw 'not available';
                    }
                }
            }
            else {
                let threadAdapter = this.session.getActiveThread();
                if (threadAdapter !== undefined) {
                    let frameActorName = undefined;
                    if (args.frameId !== undefined) {
                        let frameAdapter = this.session.frames.find(args.frameId);
                        if (frameAdapter !== undefined) {
                            frameActorName = frameAdapter.frame.actor;
                        }
                    }
                    variable = yield threadAdapter.evaluate(args.expression, false, frameActorName);
                }
                else {
                    log.info(`Couldn't find a thread for evaluating ${args.expression}`);
                    throw 'not available';
                }
            }
            return {
                result: variable.value,
                variablesReference: variable.variablesReference
            };
        });
    }
    getCompletions(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let matches;
            if (args.frameId !== undefined) {
                let frameAdapter = this.session.frames.find(args.frameId);
                if (frameAdapter === undefined) {
                    log.warn(`Couldn\'t find specified frame for auto-completing ${args.text}`);
                    throw 'not available';
                }
                this.session.setActiveThread(frameAdapter.threadAdapter);
                let threadAdapter = frameAdapter.threadAdapter;
                let frameActorName = frameAdapter.frame.actor;
                matches = yield threadAdapter.autoComplete(args.text, args.column - 1, frameActorName);
            }
            else {
                let threadAdapter = this.session.getActiveThread();
                if (threadAdapter === undefined) {
                    log.warn(`Couldn't find a thread for auto-completing ${args.text}`);
                    throw 'not available';
                }
                matches = yield threadAdapter.autoComplete(args.text, args.column - 1);
            }
            return {
                targets: matches.map((match) => ({ label: match }))
            };
        });
    }
    reloadAddon() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.session.addonManager) {
                throw 'This command is only available when debugging an addon';
            }
            yield this.session.addonManager.reloadAddon();
        });
    }
    rebuildAddon() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.session.addonManager) {
                throw 'This command is only available when debugging an addon of type "addonSdk"';
            }
            yield this.session.addonManager.rebuildAddon();
        });
    }
    toggleSkippingFile(url) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (url.startsWith('file://')) {
                let path;
                if (this.session.isWindowsPlatform) {
                    path = url.substr(8).replace(/\//g, '\\').replace('%3A', ':');
                }
                else {
                    path = url.substr(7);
                }
                yield this.session.skipFilesManager.toggleSkippingPath(path);
            }
            else {
                yield this.session.skipFilesManager.toggleSkippingUrl(url);
            }
        });
    }
    disconnect(args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.session.stop();
        });
    }
    getThreadAdapter(threadId) {
        let threadAdapter = this.session.threads.find(threadId);
        if (!threadAdapter) {
            throw new Error(`Unknown threadId ${threadId}`);
        }
        return threadAdapter;
    }
}
exports.FirefoxDebugAdapter = FirefoxDebugAdapter;
vscode_debugadapter_1.DebugSession.run(FirefoxDebugAdapter);
//# sourceMappingURL=firefoxDebugAdapter.js.map