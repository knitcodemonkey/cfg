"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const events_1 = require("events");
const index_1 = require("../firefox/index");
const index_2 = require("./index");
const log_1 = require("../util/log");
const misc_1 = require("../util/misc");
let log = log_1.Log.create('ThreadAdapter');
class ThreadAdapter extends events_1.EventEmitter {
    constructor(actor, consoleActor, pauseCoordinator, name, debugSession) {
        super();
        this.actor = actor;
        this.consoleActor = consoleActor;
        this.pauseCoordinator = pauseCoordinator;
        this.name = name;
        this.debugSession = debugSession;
        this.sources = [];
        this.framesPromise = undefined;
        this.scopes = [];
        this.pauseLifetimeObjects = [];
        this.threadLifetimeObjects = [];
        this.id = debugSession.threads.register(this);
        this.coordinator = new index_2.ThreadCoordinator(this.id, this.name, this.actor, this.consoleActor, this.pauseCoordinator, () => this.disposePauseLifetimeAdapters());
        this.coordinator.onPaused((event) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const distrustSourceInPausedEvent = ((event.why.type === 'exception') &&
                (debugSession.config.sourceMaps === 'server'));
            let sourceLocation;
            if (!distrustSourceInPausedEvent) {
                sourceLocation = event.frame.where;
            }
            else {
                let frames = yield this.fetchAllStackFrames();
                sourceLocation = frames[0].frame.where;
            }
            const sourceActor = sourceLocation.actor || sourceLocation.source.actor;
            const sourceAdapter = this.findSourceAdapterForActorName(sourceActor);
            if (sourceAdapter) {
                if (sourceAdapter.actor.source.isBlackBoxed) {
                    this.resume();
                    return;
                }
                if ((event.why.type === 'breakpoint') &&
                    event.why.actors && (event.why.actors.length > 0)) {
                    let breakpointAdapter;
                    if (this.debugSession.newBreakpointProtocol) {
                        breakpointAdapter = sourceAdapter.findBreakpointAdapterForLocation(sourceLocation);
                    }
                    else {
                        breakpointAdapter = sourceAdapter.findBreakpointAdapterForActorName(event.why.actors[0]);
                    }
                    if (breakpointAdapter) {
                        if (breakpointAdapter.breakpointInfo.hitCount) {
                            breakpointAdapter.hitCount++;
                            if (breakpointAdapter.hitCount < breakpointAdapter.breakpointInfo.hitCount) {
                                this.resume();
                                return;
                            }
                        }
                        const logMessage = breakpointAdapter.breakpointInfo.requestedBreakpoint.logMessage;
                        if (logMessage && !this.debugSession.newBreakpointProtocol) {
                            const frames = yield this.fetchAllStackFrames();
                            const frameActor = (frames.length > 0) ? frames[0].frame.actor : undefined;
                            this.evaluate(`console.log(\`${logMessage.replace('{', '${')}\`)`, false, frameActor);
                            this.resume();
                            return;
                        }
                    }
                }
            }
            if (event.why.type === 'exception') {
                let frames = yield this.fetchAllStackFrames();
                let startFrame = (frames.length > 0) ? frames[frames.length - 1] : undefined;
                if (startFrame) {
                    let source = startFrame.frame.where.source;
                    if (!source) {
                        const sourceAdapter = this.findSourceAdapterForActorName(startFrame.frame.where.actor);
                        if (sourceAdapter) {
                            source = sourceAdapter.actor.source;
                        }
                        else {
                            log.warn(`Couldn't find SourceAdapter for ${startFrame.frame.where.actor}`);
                        }
                    }
                    if (source && source.introductionType === 'debugger eval') {
                        this.resume();
                        return;
                    }
                }
            }
            this.emit('paused', event.why);
            this.fetchAllStackFrames();
        }));
    }
    get actorName() {
        return this.actor.name;
    }
    init(exceptionBreakpoints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const attachOptions = {};
            if (this.debugSession.config.sourceMaps === 'server') {
                attachOptions.useSourceMaps = true;
            }
            if (this.debugSession.newBreakpointProtocol) {
                attachOptions.pauseOnExceptions = (exceptionBreakpoints !== index_1.ExceptionBreakpoints.None);
                attachOptions.ignoreCaughtExceptions = (exceptionBreakpoints !== index_1.ExceptionBreakpoints.All);
            }
            else {
                this.coordinator.setExceptionBreakpoints(exceptionBreakpoints);
            }
            yield this.pauseCoordinator.requestInterrupt(this.id, this.name, 'auto');
            try {
                yield this.actor.attach(attachOptions);
                this.pauseCoordinator.notifyInterrupted(this.id, this.name, 'auto');
            }
            catch (e) {
                this.pauseCoordinator.notifyInterruptFailed(this.id, this.name);
                throw e;
            }
            yield this.actor.fetchSources();
            yield this.coordinator.resume();
        });
    }
    createSourceAdapter(actor, path, newBreakpointProtocol) {
        let adapter = new index_2.SourceAdapter(this.debugSession.sources, actor, path, this, newBreakpointProtocol);
        this.sources.push(adapter);
        return adapter;
    }
    registerScopeAdapter(scopeAdapter) {
        this.scopes.push(scopeAdapter);
    }
    registerObjectGripAdapter(objectGripAdapter) {
        if (objectGripAdapter.threadLifetime) {
            this.threadLifetimeObjects.push(objectGripAdapter);
        }
        else {
            this.pauseLifetimeObjects.push(objectGripAdapter);
        }
    }
    findCorrespondingSourceAdapter(url) {
        if (!url)
            return undefined;
        for (let sourceAdapter of this.sources) {
            if (sourceAdapter.actor.source.url === url) {
                return sourceAdapter;
            }
        }
        return undefined;
    }
    findSourceAdaptersForPathOrUrl(pathOrUrl) {
        if (!pathOrUrl)
            return [];
        return this.sources.filter((sourceAdapter) => misc_1.pathsAreEqual(pathOrUrl, sourceAdapter.sourcePath) || (sourceAdapter.actor.url === pathOrUrl));
    }
    findSourceAdaptersForUrlWithoutQuery(url) {
        return this.sources.filter((sourceAdapter) => {
            let sourceUrl = sourceAdapter.actor.url;
            if (!sourceUrl)
                return false;
            let queryStringIndex = sourceUrl.indexOf('?');
            if (queryStringIndex >= 0) {
                sourceUrl = sourceUrl.substr(0, queryStringIndex);
            }
            return url === sourceUrl;
        });
    }
    findSourceAdapterForActorName(actorName) {
        for (let i = 0; i < this.sources.length; i++) {
            if (this.sources[i].actor.name === actorName) {
                return this.sources[i];
            }
        }
        return undefined;
    }
    findOriginalSourceLocation(generatedUrl, line, column) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const originalLocation = yield this.actor.findOriginalLocation(generatedUrl, line, column);
            if (originalLocation) {
                const sourceAdapter = this.findCorrespondingSourceAdapter(originalLocation.url);
                if (sourceAdapter) {
                    return {
                        source: sourceAdapter,
                        line: originalLocation.line,
                        column: originalLocation.column
                    };
                }
            }
            return undefined;
        });
    }
    interrupt() {
        return this.coordinator.interrupt();
    }
    resume() {
        return this.coordinator.resume();
    }
    stepOver() {
        return this.coordinator.stepOver();
    }
    stepIn() {
        return this.coordinator.stepIn();
    }
    stepOut() {
        return this.coordinator.stepOut();
    }
    setExceptionBreakpoints(exceptionBreakpoints) {
        if (this.debugSession.newBreakpointProtocol) {
            const pauseOnExceptions = (exceptionBreakpoints !== index_1.ExceptionBreakpoints.None);
            const ignoreCaughtExceptions = (exceptionBreakpoints !== index_1.ExceptionBreakpoints.All);
            this.actor.pauseOnExceptions(pauseOnExceptions, ignoreCaughtExceptions);
        }
        else {
            this.coordinator.setExceptionBreakpoints(exceptionBreakpoints);
        }
    }
    fetchAllStackFrames() {
        if (!this.framesPromise) {
            this.framesPromise = this.coordinator.runOnPausedThread(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                let frames = yield this.actor.fetchStackFrames();
                let frameAdapters = frames.map((frame) => new index_2.FrameAdapter(this.debugSession.frames, frame, this));
                let threadPausedReason = this.coordinator.threadPausedReason;
                if ((threadPausedReason !== undefined) && (frameAdapters.length > 0)) {
                    if (threadPausedReason.frameFinished !== undefined) {
                        if (threadPausedReason.frameFinished.return !== undefined) {
                            frameAdapters[0].scopeAdapters[0].addReturnValue(threadPausedReason.frameFinished.return);
                        }
                        else if (threadPausedReason.frameFinished.throw !== undefined) {
                            frameAdapters[0].scopeAdapters.unshift(index_2.ScopeAdapter.fromGrip('Exception', threadPausedReason.frameFinished.throw, frameAdapters[0]));
                        }
                    }
                    else if (threadPausedReason.exception !== undefined) {
                        frameAdapters[0].scopeAdapters.unshift(index_2.ScopeAdapter.fromGrip('Exception', threadPausedReason.exception, frameAdapters[0]));
                    }
                }
                return frameAdapters;
            }));
        }
        return this.framesPromise;
    }
    fetchStackFrames(start, count) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let frameAdapters = yield this.fetchAllStackFrames();
            let requestedFrames = (count > 0) ? frameAdapters.slice(start, start + count) : frameAdapters.slice(start);
            return [requestedFrames, frameAdapters.length];
        });
    }
    triggerStackframeRefresh() {
        if (this.coordinator.threadTarget === 'paused') {
            this.debugSession.sendStoppedEvent(this, this.coordinator.threadPausedReason);
        }
    }
    fetchVariables(variablesProvider) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let variableAdapters = yield variablesProvider.getVariables();
            return variableAdapters.map((variableAdapter) => variableAdapter.getVariable());
        });
    }
    evaluate(expr, skipBreakpoints, frameActorName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (skipBreakpoints) {
                let grip = yield this.coordinator.evaluate(expr, frameActorName);
                let variableAdapter = this.variableFromGrip(grip, (frameActorName === undefined));
                return variableAdapter.getVariable();
            }
            else {
                let grip = yield this.consoleActor.evaluate(expr, frameActorName);
                let variableAdapter = this.variableFromGrip(grip, true);
                return variableAdapter.getVariable();
            }
        });
    }
    autoComplete(text, column, frameActorName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.consoleActor.autoComplete(text, column, frameActorName);
        });
    }
    detach() {
        return this.actor.detach();
    }
    variableFromGrip(grip, threadLifetime) {
        if (grip !== undefined) {
            return index_2.VariableAdapter.fromGrip('', undefined, undefined, grip, threadLifetime, this);
        }
        else {
            return new index_2.VariableAdapter('', undefined, undefined, 'undefined', this);
        }
    }
    disposePauseLifetimeAdapters() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.framesPromise) {
                let frames = yield this.framesPromise;
                frames.forEach((frameAdapter) => {
                    frameAdapter.dispose();
                });
                this.framesPromise = undefined;
            }
            this.scopes.forEach((scopeAdapter) => {
                scopeAdapter.dispose();
            });
            this.scopes = [];
            this.pauseLifetimeObjects.forEach((objectGripAdapter) => {
                objectGripAdapter.dispose();
            });
            this.pauseLifetimeObjects = [];
        });
    }
    dispose() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.disposePauseLifetimeAdapters();
            this.threadLifetimeObjects.forEach((objectGripAdapter) => {
                objectGripAdapter.dispose();
            });
            this.sources.forEach((source) => {
                source.dispose();
            });
            this.actor.dispose();
            this.consoleActor.dispose();
        });
    }
    onPaused(cb) {
        this.on('paused', cb);
    }
    onResumed(cb) {
        this.actor.onResumed(cb);
    }
    onExited(cb) {
        this.actor.onExited(cb);
    }
    onWrongState(cb) {
        this.actor.onWrongState(cb);
    }
    onNewSource(cb) {
        this.actor.onNewSource(cb);
    }
}
exports.ThreadAdapter = ThreadAdapter;
//# sourceMappingURL=thread.js.map