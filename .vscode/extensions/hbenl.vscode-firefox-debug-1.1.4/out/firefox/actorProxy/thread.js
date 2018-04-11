"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../../util/log");
const events_1 = require("events");
const pendingRequests_1 = require("../../util/pendingRequests");
const source_1 = require("./source");
let log = log_1.Log.create('ThreadActorProxy');
var ExceptionBreakpoints;
(function (ExceptionBreakpoints) {
    ExceptionBreakpoints[ExceptionBreakpoints["All"] = 0] = "All";
    ExceptionBreakpoints[ExceptionBreakpoints["Uncaught"] = 1] = "Uncaught";
    ExceptionBreakpoints[ExceptionBreakpoints["None"] = 2] = "None";
})(ExceptionBreakpoints = exports.ExceptionBreakpoints || (exports.ExceptionBreakpoints = {}));
class ThreadActorProxy extends events_1.EventEmitter {
    constructor(name, connection) {
        super();
        this.name = name;
        this.connection = connection;
        this.pendingSourcesRequests = new pendingRequests_1.PendingRequests();
        this.pendingStackFramesRequests = new pendingRequests_1.PendingRequests();
        this.connection.register(this);
        log.debug(`Created thread ${this.name}`);
    }
    attach(useSourceMaps = true) {
        if (!this.attachPromise) {
            log.debug(`Attaching thread ${this.name}`);
            this.attachPromise = new Promise((resolve, reject) => {
                this.pendingAttachRequest = { resolve, reject };
                this.connection.sendRequest({
                    to: this.name, type: 'attach',
                    options: { useSourceMaps }
                });
            });
            this.detachPromise = undefined;
        }
        else {
            log.warn('Attaching this thread has already been requested!');
        }
        return this.attachPromise;
    }
    resume(exceptionBreakpoints, resumeLimitType) {
        if (!this.resumePromise) {
            log.debug(`Resuming thread ${this.name}`);
            let resumeLimit = resumeLimitType ? { type: resumeLimitType } : undefined;
            let pauseOnExceptions = undefined;
            let ignoreCaughtExceptions = undefined;
            switch (exceptionBreakpoints) {
                case ExceptionBreakpoints.All:
                    pauseOnExceptions = true;
                    break;
                case ExceptionBreakpoints.Uncaught:
                    pauseOnExceptions = true;
                    ignoreCaughtExceptions = true;
                    break;
            }
            this.resumePromise = new Promise((resolve, reject) => {
                this.pendingResumeRequest = { resolve, reject };
                this.connection.sendRequest({
                    to: this.name, type: 'resume',
                    resumeLimit, pauseOnExceptions, ignoreCaughtExceptions
                });
            });
            this.interruptPromise = undefined;
        }
        return this.resumePromise;
    }
    interrupt(immediately = true) {
        if (!this.interruptPromise) {
            log.debug(`Interrupting thread ${this.name}`);
            this.interruptPromise = new Promise((resolve, reject) => {
                this.pendingInterruptRequest = { resolve, reject };
                this.connection.sendRequest({
                    to: this.name, type: 'interrupt',
                    when: immediately ? undefined : 'onNext'
                });
            });
            this.resumePromise = undefined;
        }
        return this.interruptPromise;
    }
    detach() {
        if (!this.detachPromise) {
            log.debug(`Detaching thread ${this.name}`);
            this.detachPromise = new Promise((resolve, reject) => {
                this.pendingDetachRequest = { resolve, reject };
                this.connection.sendRequest({ to: this.name, type: 'detach' });
            });
            this.attachPromise = undefined;
        }
        else {
            log.warn('Detaching this thread has already been requested!');
        }
        return this.detachPromise;
    }
    fetchSources() {
        log.debug(`Fetching sources from thread ${this.name}`);
        return new Promise((resolve, reject) => {
            this.pendingSourcesRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type: 'sources' });
        });
    }
    fetchStackFrames(start, count) {
        log.debug(`Fetching stackframes from thread ${this.name}`);
        return new Promise((resolve, reject) => {
            this.pendingStackFramesRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({
                to: this.name, type: 'frames',
                start, count
            });
        });
    }
    dispose() {
        this.connection.unregister(this);
    }
    receiveResponse(response) {
        if (response['type'] === 'paused') {
            let pausedResponse = response;
            log.debug(`Received paused message of type ${pausedResponse.why.type}`);
            switch (pausedResponse.why.type) {
                case 'attached':
                    if (this.pendingAttachRequest) {
                        this.pendingAttachRequest.resolve(undefined);
                        this.pendingAttachRequest = undefined;
                        this.interruptPromise = Promise.resolve(undefined);
                    }
                    else {
                        log.warn('Received attached message without pending request');
                    }
                    break;
                case 'interrupted':
                case 'alreadyPaused':
                    if (this.pendingInterruptRequest) {
                        this.pendingInterruptRequest.resolve(undefined);
                        this.pendingInterruptRequest = undefined;
                    }
                    else if (pausedResponse.why.type !== 'alreadyPaused') {
                        log.warn(`Received ${pausedResponse.why.type} message without pending request`);
                    }
                    break;
                case 'resumeLimit':
                case 'breakpoint':
                case 'exception':
                case 'debuggerStatement':
                    if (this.pendingInterruptRequest) {
                        this.pendingInterruptRequest.resolve(undefined);
                        this.pendingInterruptRequest = undefined;
                    }
                    else {
                        this.interruptPromise = Promise.resolve(undefined);
                    }
                    if (this.pendingResumeRequest) {
                        this.pendingResumeRequest.reject(`Hit ${pausedResponse.why.type}`);
                        this.pendingResumeRequest = undefined;
                    }
                    this.resumePromise = undefined;
                    this.emit('paused', pausedResponse);
                    break;
                case 'clientEvaluated':
                    log.warn('Received clientEvaluated message without a request');
                    break;
                default:
                    log.warn(`Paused event with reason ${pausedResponse.why.type} not handled yet`);
                    this.emit('paused', pausedResponse);
                    break;
            }
        }
        else if (response['type'] === 'resumed') {
            if (this.pendingResumeRequest) {
                log.debug(`Received resumed event from ${this.name}`);
                this.pendingResumeRequest.resolve(undefined);
                this.pendingResumeRequest = undefined;
            }
            else {
                log.debug(`Received unexpected resumed event from ${this.name}`);
                this.interruptPromise = undefined;
                this.resumePromise = Promise.resolve(undefined);
                this.emit('resumed');
            }
        }
        else if (response['type'] === 'detached') {
            log.debug(`Thread ${this.name} detached`);
            if (this.pendingDetachRequest) {
                this.pendingDetachRequest.resolve(undefined);
                this.pendingDetachRequest = undefined;
            }
            else {
                log.warn(`Thread ${this.name} detached without a corresponding request`);
            }
            this.pendingStackFramesRequests.rejectAll('Detached');
        }
        else if (response['sources']) {
            let sources = (response['sources']);
            log.debug(`Received ${sources.length} sources from thread ${this.name}`);
            this.pendingSourcesRequests.resolveOne(sources);
            for (let source of sources) {
                let sourceActor = this.connection.getOrCreate(source.actor, () => new source_1.SourceActorProxy(source, this.connection));
                this.emit('newSource', sourceActor);
            }
        }
        else if (response['type'] === 'newSource') {
            let source = (response['source']);
            log.debug(`New source ${source.url} on thread ${this.name}`);
            let sourceActor = this.connection.getOrCreate(source.actor, () => new source_1.SourceActorProxy(source, this.connection));
            this.emit('newSource', sourceActor);
        }
        else if (response['frames']) {
            let frames = (response['frames']);
            log.debug(`Received ${frames.length} frames from thread ${this.name}`);
            this.pendingStackFramesRequests.resolveOne(frames);
        }
        else if (response['type'] === 'newGlobal') {
            this.emit('newGlobal');
        }
        else if (response['type'] === 'exited') {
            log.debug(`Thread ${this.name} exited`);
            this.emit('exited');
        }
        else if (response['error'] === 'wrongState') {
            log.warn(`Thread ${this.name} was in the wrong state for the last request`);
            this.emit('wrongState');
        }
        else if (response['error'] === 'wrongOrder') {
            log.warn(`got wrongOrder error: ${response['message']}`);
            this.resumePromise = undefined;
            if (this.pendingResumeRequest) {
                this.pendingResumeRequest.reject(`You need to resume ${response['lastPausedUrl']} first`);
            }
        }
        else if (response['error'] === 'noSuchActor') {
            log.error(`No such actor ${JSON.stringify(this.name)}`);
            if (this.pendingAttachRequest) {
                this.pendingAttachRequest.reject('No such actor');
            }
            if (this.pendingDetachRequest) {
                this.pendingDetachRequest.reject('No such actor');
            }
            if (this.pendingInterruptRequest) {
                this.pendingInterruptRequest.reject('No such actor');
            }
            if (this.pendingResumeRequest) {
                this.pendingResumeRequest.reject('No such actor');
            }
            this.pendingSourcesRequests.rejectAll('No such actor');
            this.pendingStackFramesRequests.rejectAll('No such actor');
        }
        else if (response['error'] === 'unknownFrame') {
            let errorMsg = response['message'];
            log.error(`Error evaluating expression: ${errorMsg}`);
        }
        else {
            if (response['type'] === 'willInterrupt') {
                log.debug(`Received willInterrupt event from ${this.name} (ignoring)`);
            }
            else {
                log.warn("Unknown message from ThreadActor: " + JSON.stringify(response));
            }
        }
    }
    onPaused(cb) {
        this.on('paused', cb);
    }
    onResumed(cb) {
        this.on('resumed', cb);
    }
    onExited(cb) {
        this.on('exited', cb);
    }
    onWrongState(cb) {
        this.on('wrongState', cb);
    }
    onNewSource(cb) {
        this.on('newSource', cb);
    }
    onNewGlobal(cb) {
        this.on('newGlobal', cb);
    }
}
exports.ThreadActorProxy = ThreadActorProxy;
//# sourceMappingURL=thread.js.map