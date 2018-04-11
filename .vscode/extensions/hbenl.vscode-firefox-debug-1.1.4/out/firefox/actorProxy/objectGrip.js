"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../../util/log");
const pendingRequests_1 = require("../../util/pendingRequests");
let log = log_1.Log.create('ObjectGripActorProxy');
class ObjectGripActorProxy {
    constructor(grip, connection) {
        this.grip = grip;
        this.connection = connection;
        this._refCount = 0;
        this.pendingPrototypeAndPropertiesRequests = new pendingRequests_1.PendingRequests();
        this.connection.register(this);
    }
    get name() {
        return this.grip.actor;
    }
    get refCount() {
        return this._refCount;
    }
    increaseRefCount() {
        this._refCount++;
    }
    decreaseRefCount() {
        this._refCount--;
        if (this._refCount === 0) {
            this.connection.unregister(this);
        }
    }
    fetchPrototypeAndProperties() {
        if (log.isDebugEnabled()) {
            log.debug(`Fetching prototype and properties from ${this.name}`);
        }
        return new Promise((resolve, reject) => {
            this.pendingPrototypeAndPropertiesRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type: 'prototypeAndProperties' });
        });
    }
    receiveResponse(response) {
        if ((response['prototype'] !== undefined) && (response['ownProperties'] !== undefined)) {
            if (log.isDebugEnabled()) {
                log.debug(`Prototype and properties fetched from ${this.name}`);
            }
            this.pendingPrototypeAndPropertiesRequests.resolveOne(response);
        }
        else if (response['error'] === 'noSuchActor') {
            log.warn(`No such actor ${this.grip.actor} - you will not be able to inspect this value; this is probably due to Firefox bug #1249962`);
            this.pendingPrototypeAndPropertiesRequests.rejectAll('No such actor');
        }
        else {
            log.warn("Unknown message from ObjectGripActor: " + JSON.stringify(response));
        }
    }
}
exports.ObjectGripActorProxy = ObjectGripActorProxy;
//# sourceMappingURL=objectGrip.js.map