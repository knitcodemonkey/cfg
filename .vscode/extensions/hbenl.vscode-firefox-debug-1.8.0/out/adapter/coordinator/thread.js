"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const log_1 = require("../../util/log");
const events_1 = require("events");
const index_1 = require("../../firefox/index");
const delayedTask_1 = require("../../util/delayedTask");
let log = log_1.Log.create('ThreadCoordinator');
class ThreadCoordinator extends events_1.EventEmitter {
    constructor(threadId, threadName, threadActor, consoleActor, pauseCoordinator, prepareResume) {
        super();
        this.threadId = threadId;
        this.threadName = threadName;
        this.threadActor = threadActor;
        this.consoleActor = consoleActor;
        this.pauseCoordinator = pauseCoordinator;
        this.prepareResume = prepareResume;
        this.threadState = 'paused';
        this._threadTarget = 'paused';
        this.queuedTasksToRunOnPausedThread = [];
        this.tasksRunningOnPausedThread = 0;
        this.queuedEvaluateTasks = [];
        threadActor.onPaused((event) => {
            if (this.threadState === 'evaluating') {
                threadActor.resume(this.exceptionBreakpoints);
            }
            else if ((event.why.type === 'exception') &&
                (this.exceptionBreakpoints === index_1.ExceptionBreakpoints.None)) {
                threadActor.resume(this.exceptionBreakpoints);
            }
            else {
                this._threadTarget = 'paused';
                this._threadPausedReason = event.why;
                this.threadPaused('user');
                this.emit('paused', event);
            }
        });
        threadActor.onResumed(() => {
            this._threadTarget = 'running';
            this._threadPausedReason = undefined;
            this.threadResumed();
            if (this.tasksRunningOnPausedThread > 0) {
                log.warn('Thread resumed unexpectedly while tasks that need the thread to be paused were running');
            }
        });
    }
    get threadTarget() {
        return this._threadTarget;
    }
    get threadPausedReason() {
        return this._threadPausedReason;
    }
    setExceptionBreakpoints(exceptionBreakpoints) {
        this.exceptionBreakpoints = exceptionBreakpoints;
        if ((this.threadState === 'resuming') || (this.threadState === 'running')) {
            this.runOnPausedThread(() => tslib_1.__awaiter(this, void 0, void 0, function* () { return undefined; }));
        }
    }
    interrupt() {
        if (this.threadState === 'paused') {
            return Promise.resolve();
        }
        else if (this.interruptPromise !== undefined) {
            return this.interruptPromise;
        }
        else {
            this._threadTarget = 'paused';
            this._threadPausedReason = undefined;
            this.interruptPromise = new Promise((resolve, reject) => {
                this.pendingInterruptRequest = { resolve, reject };
            });
            this.doNext();
            return this.interruptPromise;
        }
    }
    resume() {
        return this.resumeTo('running');
    }
    stepOver() {
        return this.resumeTo('stepOver');
    }
    stepIn() {
        return this.resumeTo('stepIn');
    }
    stepOut() {
        return this.resumeTo('stepOut');
    }
    resumeTo(target) {
        if (this.threadState === 'running') {
            if (target !== 'running') {
                log.warn(`Can't ${target} because the thread is already running`);
            }
            return Promise.resolve();
        }
        else if (this.resumePromise !== undefined) {
            if (target !== 'running') {
                log.warn(`Can't ${target} because the thread is already resuming`);
            }
            return this.resumePromise;
        }
        else {
            this._threadTarget = target;
            this._threadPausedReason = undefined;
            this.resumePromise = new Promise((resolve, reject) => {
                this.pendingResumeRequest = { resolve, reject };
            });
            this.doNext();
            return this.resumePromise;
        }
    }
    runOnPausedThread(task) {
        let delayedTask = new delayedTask_1.DelayedTask(task);
        this.queuedTasksToRunOnPausedThread.push(delayedTask);
        this.doNext();
        return delayedTask.promise;
    }
    evaluate(expr, frameActorName) {
        let delayedTask = new delayedTask_1.DelayedTask(() => this.consoleActor.evaluate(expr, frameActorName));
        this.queuedEvaluateTasks.push(delayedTask);
        this.doNext();
        return delayedTask.promise;
    }
    onPaused(cb) {
        this.on('paused', cb);
    }
    doNext() {
        if (log.isDebugEnabled()) {
            log.debug(`state: ${this.threadState}, target: ${this.threadTarget}, tasks: ${this.tasksRunningOnPausedThread}/${this.queuedTasksToRunOnPausedThread.length}, eval: ${this.queuedEvaluateTasks.length}`);
        }
        if ((this.threadState === 'interrupting') ||
            (this.threadState === 'resuming') ||
            (this.threadState === 'evaluating')) {
            return;
        }
        if (this.threadState === 'running') {
            if ((this.queuedTasksToRunOnPausedThread.length > 0) || (this.queuedEvaluateTasks.length > 0)) {
                this.executeInterrupt('auto');
                return;
            }
            if (this.threadTarget === 'paused') {
                this.executeInterrupt('user');
                return;
            }
        }
        else {
            if (this.queuedTasksToRunOnPausedThread.length > 0) {
                for (let task of this.queuedTasksToRunOnPausedThread) {
                    this.executeOnPausedThread(task);
                }
                this.queuedTasksToRunOnPausedThread = [];
                return;
            }
            if (this.tasksRunningOnPausedThread > 0) {
                return;
            }
            if (this.queuedEvaluateTasks.length > 0) {
                let task = this.queuedEvaluateTasks.shift();
                this.executeEvaluateTask(task);
                return;
            }
        }
        if ((this.threadState === 'paused') && (this.threadTarget !== 'paused')) {
            this.executeResume();
            return;
        }
    }
    executeInterrupt(pauseType) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.threadState = 'interrupting';
            try {
                yield this.pauseCoordinator.requestInterrupt(this.threadId, this.threadName, pauseType);
                yield this.threadActor.interrupt(pauseType === 'auto');
                this.threadPaused(pauseType);
            }
            catch (e) {
                log.error(`interrupt failed: ${e}`);
                this.threadState = 'running';
                this.pauseCoordinator.notifyInterruptFailed(this.threadId, this.threadName);
            }
            this.interruptPromise = undefined;
            this.doNext();
        });
    }
    executeResume() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.pauseCoordinator.requestResume(this.threadId, this.threadName);
            }
            catch (e) {
                log.error(`resume denied: ${e}`);
                if (this.pendingResumeRequest !== undefined) {
                    this.pendingResumeRequest.reject(e);
                    this.pendingResumeRequest = undefined;
                }
                this.resumePromise = undefined;
            }
            let resumeLimit = this.getResumeLimit();
            this.threadState = 'resuming';
            try {
                yield this.prepareResume();
                yield this.threadActor.resume(this.exceptionBreakpoints, resumeLimit);
                this.threadResumed();
            }
            catch (e) {
                log.error(`resume failed: ${e}`);
                this.threadState = 'paused';
                this.pauseCoordinator.notifyResumeFailed(this.threadId, this.threadName);
            }
            this.doNext();
        });
    }
    executeOnPausedThread(task) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.threadState !== 'paused') {
                log.error(`executeOnPausedThread called but threadState is ${this.threadState}`);
                return;
            }
            this.tasksRunningOnPausedThread++;
            try {
                yield task.execute();
            }
            catch (e) {
                log.warn(`task running on paused thread failed: ${e}`);
            }
            this.tasksRunningOnPausedThread--;
            if (this.tasksRunningOnPausedThread === 0) {
                this.doNext();
            }
        });
    }
    executeEvaluateTask(task) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.threadState !== 'paused') {
                log.error(`executeEvaluateTask called but threadState is ${this.threadState}`);
                return;
            }
            if (this.tasksRunningOnPausedThread > 0) {
                log.error(`executeEvaluateTask called but tasksRunningOnPausedThread is ${this.tasksRunningOnPausedThread}`);
                return;
            }
            this.threadState = 'evaluating';
            try {
                yield task.execute();
            }
            catch (e) {
            }
            this.threadState = 'paused';
            this.doNext();
        });
    }
    threadPaused(pauseType) {
        this.threadState = 'paused';
        if (this.pendingInterruptRequest !== undefined) {
            this.pendingInterruptRequest.resolve(undefined);
            this.pendingInterruptRequest = undefined;
        }
        this.interruptPromise = undefined;
        if (this.threadTarget === 'paused') {
            if (this.pendingResumeRequest !== undefined) {
                this.pendingResumeRequest.reject(undefined);
                this.pendingResumeRequest = undefined;
            }
            this.resumePromise = undefined;
        }
        this.pauseCoordinator.notifyInterrupted(this.threadId, this.threadName, pauseType);
    }
    threadResumed() {
        this.threadState = 'running';
        if (this.pendingResumeRequest !== undefined) {
            this.pendingResumeRequest.resolve(undefined);
            this.pendingResumeRequest = undefined;
        }
        this.resumePromise = undefined;
        if (this.threadTarget !== 'paused') {
            if (this.pendingInterruptRequest !== undefined) {
                this.pendingInterruptRequest.reject(undefined);
                this.pendingInterruptRequest = undefined;
            }
            this.interruptPromise = undefined;
        }
        this.pauseCoordinator.notifyResumed(this.threadId, this.threadName);
    }
    getResumeLimit() {
        switch (this.threadTarget) {
            case 'stepOver':
                return 'next';
            case 'stepIn':
                return 'step';
            case 'stepOut':
                return 'finish';
            default:
                return undefined;
        }
    }
}
exports.ThreadCoordinator = ThreadCoordinator;
//# sourceMappingURL=thread.js.map