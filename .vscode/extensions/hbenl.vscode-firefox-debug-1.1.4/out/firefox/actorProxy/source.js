"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../../util/log");
const pendingRequests_1 = require("../../util/pendingRequests");
const breakpoint_1 = require("./breakpoint");
let log = log_1.Log.create('SourceActorProxy');
class SetBreakpointResult {
    constructor(breakpointActor, actualLocation) {
        this.breakpointActor = breakpointActor;
        this.actualLocation = actualLocation;
    }
}
exports.SetBreakpointResult = SetBreakpointResult;
class SourceActorProxy {
    constructor(source, connection) {
        this.source = source;
        this.connection = connection;
        this.pendingSetBreakpointRequests = new pendingRequests_1.PendingRequests();
        this.pendingFetchSourceRequests = new pendingRequests_1.PendingRequests();
        this.pendingBlackboxRequests = new pendingRequests_1.PendingRequests();
        this.connection.register(this);
    }
    get name() {
        return this.source.actor;
    }
    get url() {
        return this.source.url;
    }
    setBreakpoint(location, condition) {
        log.debug(`Setting breakpoint at line ${location.line} and column ${location.column} in ${this.url}`);
        return new Promise((resolve, reject) => {
            this.pendingSetBreakpointRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type: 'setBreakpoint', location, condition });
        });
    }
    fetchSource() {
        log.debug(`Fetching source of ${this.url}`);
        return new Promise((resolve, reject) => {
            this.pendingFetchSourceRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type: 'source' });
        });
    }
    setBlackbox(blackbox) {
        log.debug(`Setting blackboxing of ${this.url} to ${blackbox}`);
        this.source.isBlackBoxed = blackbox;
        return new Promise((resolve, reject) => {
            let type = blackbox ? 'blackbox' : 'unblackbox';
            this.pendingBlackboxRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type });
        });
    }
    dispose() {
        this.connection.unregister(this);
    }
    receiveResponse(response) {
        if (response['isPending'] !== undefined) {
            let setBreakpointResponse = response;
            let actualLocation = setBreakpointResponse.actualLocation;
            log.debug(`Breakpoint has been set at ${JSON.stringify(actualLocation)} in ${this.url}`);
            let breakpointActor = this.connection.getOrCreate(setBreakpointResponse.actor, () => new breakpoint_1.BreakpointActorProxy(setBreakpointResponse.actor, this.connection));
            this.pendingSetBreakpointRequests.resolveOne(new SetBreakpointResult(breakpointActor, actualLocation));
        }
        else if (response['source'] !== undefined) {
            log.debug('Received fetchSource response');
            let grip = response['source'];
            this.pendingFetchSourceRequests.resolveOne(grip);
        }
        else if (response['error'] === 'noSuchActor') {
            log.error(`No such actor ${JSON.stringify(this.name)}`);
            this.pendingFetchSourceRequests.rejectAll('No such actor');
            this.pendingSetBreakpointRequests.rejectAll('No such actor');
        }
        else {
            let propertyCount = Object.keys(response).length;
            if ((propertyCount === 1) || ((propertyCount === 2) && (response['pausedInSource'] !== undefined))) {
                log.debug('Received (un)blackbox response');
                this.pendingBlackboxRequests.resolveOne(undefined);
            }
            else {
                log.warn("Unknown message from SourceActor: " + JSON.stringify(response));
            }
        }
    }
}
exports.SourceActorProxy = SourceActorProxy;
//# sourceMappingURL=source.js.map