"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../../util/log");
const events_1 = require("events");
const pendingRequests_1 = require("../../util/pendingRequests");
const misc_1 = require("../../util/misc");
let log = log_1.Log.create('ConsoleActorProxy');
class ConsoleActorProxy extends events_1.EventEmitter {
    constructor(name, connection) {
        super();
        this.name = name;
        this.connection = connection;
        this.pendingStartListenersRequests = new pendingRequests_1.PendingRequests();
        this.pendingStopListenersRequests = new pendingRequests_1.PendingRequests();
        this.pendingResultIDRequests = new pendingRequests_1.PendingRequests();
        this.pendingEvaluateRequests = new Map();
        this.pendingAutoCompleteRequests = new pendingRequests_1.PendingRequests();
        this.connection.register(this);
    }
    startListeners() {
        log.debug('Starting console listeners');
        return new Promise((resolve, reject) => {
            this.pendingStartListenersRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({
                to: this.name, type: 'startListeners',
                listeners: ConsoleActorProxy.listenFor
            });
        });
    }
    stopListeners() {
        log.debug('Stopping console listeners');
        return new Promise((resolve, reject) => {
            this.pendingStopListenersRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({
                to: this.name, type: 'stopListeners',
                listeners: ConsoleActorProxy.listenFor
            });
        });
    }
    getCachedMessages() {
        log.debug('Getting cached messages');
        this.connection.sendRequest({
            to: this.name, type: 'getCachedMessages',
            messageTypes: ConsoleActorProxy.listenFor
        });
    }
    evaluate(expr, frameActorName) {
        log.debug(`Evaluating '${expr}' on console ${this.name}`);
        return new Promise((resolveEvaluate, rejectEvaluate) => {
            this.pendingResultIDRequests.enqueue({
                resolve: (resultID) => {
                    this.pendingEvaluateRequests.set(resultID, {
                        resolve: resolveEvaluate, reject: rejectEvaluate
                    });
                },
                reject: () => { }
            });
            this.connection.sendRequest({
                to: this.name, type: 'evaluateJSAsync',
                text: expr, frameActor: frameActorName
            });
        });
    }
    autoComplete(text, column, frameActor) {
        log.debug(`Getting completions for ${text} at position ${column}`);
        return new Promise((resolve, reject) => {
            this.pendingAutoCompleteRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({
                to: this.name, type: 'autocomplete', text, cursor: column, frameActor
            });
        });
    }
    dispose() {
        this.connection.unregister(this);
    }
    receiveResponse(response) {
        if (response['startedListeners']) {
            log.debug('Listeners started');
            this.pendingStartListenersRequests.resolveOne(undefined);
        }
        else if (response['stoppedListeners']) {
            log.debug('Listeners stopped');
            this.pendingStartListenersRequests.resolveOne(undefined);
        }
        else if (response['messages']) {
            log.debug('Received cached messages');
            for (let message of response.messages) {
                if (message._type === 'ConsoleAPI') {
                    this.emit('consoleAPI', message);
                }
                else if (message._type === 'PageError') {
                    this.emit('pageError', message);
                }
            }
        }
        else if (response['type'] === 'consoleAPICall') {
            log.debug(`Received ConsoleAPI message`);
            this.emit('consoleAPI', response.message);
        }
        else if (response['type'] === 'pageError') {
            log.debug(`Received PageError message`);
            this.emit('pageError', response.pageError);
        }
        else if (response['type'] === 'logMessage') {
            log.debug(`Received LogMessage message`);
            this.emit('logMessage', response.message);
        }
        else if (response['type'] === 'evaluationResult') {
            log.debug(`Received EvaluationResult message`);
            let resultResponse = response;
            if (!this.pendingEvaluateRequests.has(resultResponse.resultID)) {
                log.error('Received evaluationResult with unknown resultID');
            }
            else {
                let evaluateRequest = this.pendingEvaluateRequests.get(resultResponse.resultID);
                if (resultResponse.exceptionMessage === undefined) {
                    evaluateRequest.resolve(resultResponse.result);
                }
                else {
                    evaluateRequest.reject(misc_1.exceptionGripToString(resultResponse.exception));
                }
            }
        }
        else if (response['resultID']) {
            log.debug(`Received ResultID message`);
            this.pendingResultIDRequests.resolveOne(response['resultID']);
        }
        else if (response['matches']) {
            log.debug(`Received autoComplete response`);
            this.pendingAutoCompleteRequests.resolveOne(response.matches);
        }
        else {
            log.warn("Unknown message from ConsoleActor: " + JSON.stringify(response));
        }
    }
    onConsoleAPICall(cb) {
        this.on('consoleAPI', cb);
    }
    onPageErrorCall(cb) {
        this.on('pageError', cb);
    }
    onLogMessageCall(cb) {
        this.on('logMessage', cb);
    }
}
ConsoleActorProxy.listenFor = ['PageError', 'ConsoleAPI'];
exports.ConsoleActorProxy = ConsoleActorProxy;
//# sourceMappingURL=console.js.map