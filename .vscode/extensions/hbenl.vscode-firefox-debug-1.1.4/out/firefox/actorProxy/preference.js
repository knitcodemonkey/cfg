"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const log_1 = require("../../util/log");
const pendingRequests_1 = require("../../util/pendingRequests");
let log = log_1.Log.create('PreferenceActorProxy');
class PreferenceActorProxy {
    constructor(name, connection) {
        this.name = name;
        this.connection = connection;
        this.pendingGetPrefRequests = new pendingRequests_1.PendingRequests();
        this.pendingSetPrefRequests = new pendingRequests_1.PendingRequests();
        this.connection.register(this);
    }
    getBoolPref(pref) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let prefString = yield this.getPref(pref, 'Bool');
            return (prefString === 'true');
        });
    }
    getCharPref(pref) {
        return this.getPref(pref, 'Char');
    }
    getIntPref(pref) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let prefString = yield this.getPref(pref, 'Bool');
            return parseInt(prefString, 10);
        });
    }
    setBoolPref(pref, val) {
        return this.setPref(pref, val, 'Bool');
    }
    setCharPref(pref, val) {
        return this.setPref(pref, val, 'Char');
    }
    setIntPref(pref, val) {
        return this.setPref(pref, val, 'Int');
    }
    getPref(pref, type) {
        log.debug(`Getting preference value for ${pref}`);
        return new Promise((resolve, reject) => {
            this.pendingGetPrefRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({
                to: this.name,
                type: `get${type}Pref`,
                value: pref
            });
        });
    }
    setPref(pref, val, type) {
        log.debug(`Setting preference value for ${pref} to ${val}`);
        return new Promise((resolve, reject) => {
            this.pendingSetPrefRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({
                to: this.name,
                type: `set${type}Pref`,
                name: pref,
                value: val
            });
        });
    }
    receiveResponse(response) {
        if (response['value']) {
            this.pendingGetPrefRequests.resolveOne(response['value']);
        }
        else if (Object.keys(response).length === 1) {
            this.pendingSetPrefRequests.resolveOne(undefined);
        }
        else if (response['error']) {
            log.warn("Error from PreferenceActor: " + JSON.stringify(response));
            this.pendingGetPrefRequests.rejectOne(response['message'] || response['error']);
        }
        else {
            log.warn("Unknown message from PreferenceActor: " + JSON.stringify(response));
        }
    }
}
exports.PreferenceActorProxy = PreferenceActorProxy;
//# sourceMappingURL=preference.js.map