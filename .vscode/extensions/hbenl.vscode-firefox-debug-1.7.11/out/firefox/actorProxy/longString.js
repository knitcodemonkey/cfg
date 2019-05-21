"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../../util/log");
const pendingRequests_1 = require("../../util/pendingRequests");
let log = log_1.Log.create('LongStringGripActorProxy');
class LongStringGripActorProxy {
    constructor(grip, connection) {
        this.grip = grip;
        this.connection = connection;
        this.pendingSubstringRequests = new pendingRequests_1.PendingRequests();
        this.connection.register(this);
    }
    get name() {
        return this.grip.actor;
    }
    extendLifetime() {
        this.connection.sendRequest({ to: this.name, type: 'threadGrip' });
    }
    fetchContent() {
        log.debug(`Fetching content from long string ${this.name}`);
        return new Promise((resolve, reject) => {
            this.pendingSubstringRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type: 'substring', start: 0, end: this.grip.length });
        });
    }
    receiveResponse(response) {
        if (response['substring'] !== undefined) {
            log.debug(`Content fetched from ${this.name}`);
            this.pendingSubstringRequests.resolveOne(response['substring']);
        }
        else if (response['error'] === 'noSuchActor') {
            log.warn(`No such actor ${this.grip.actor} - you will not be able to inspect this value; this is probably due to Firefox bug #1249962`);
            this.pendingSubstringRequests.rejectAll('No such actor');
        }
        else if (Object.keys(response).length === 1) {
            log.debug('Received response to threadGrip or release request');
        }
        else {
            log.warn("Unknown message from LongStringActor: " + JSON.stringify(response));
        }
    }
}
exports.LongStringGripActorProxy = LongStringGripActorProxy;
//# sourceMappingURL=longString.js.map