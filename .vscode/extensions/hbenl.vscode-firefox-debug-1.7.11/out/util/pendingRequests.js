"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("./log");
let log = log_1.Log.create('PendingRequests');
class PendingRequest {
}
exports.PendingRequest = PendingRequest;
class PendingRequests {
    constructor() {
        this.pendingRequests = [];
    }
    enqueue(req) {
        this.pendingRequests.push(req);
    }
    resolveOne(t) {
        if (this.pendingRequests.length > 0) {
            let request = this.pendingRequests.shift();
            request.resolve(t);
        }
        else {
            log.error("Received response without corresponding request!?");
        }
    }
    rejectOne(err) {
        if (this.pendingRequests.length > 0) {
            let request = this.pendingRequests.shift();
            request.reject(err);
        }
        else {
            log.error("Received error response without corresponding request!?");
        }
    }
    resolveAll(t) {
        this.pendingRequests.forEach((req) => req.resolve(t));
        this.pendingRequests = [];
    }
    rejectAll(err) {
        this.pendingRequests.forEach((req) => req.reject(err));
        this.pendingRequests = [];
    }
}
exports.PendingRequests = PendingRequests;
//# sourceMappingURL=pendingRequests.js.map