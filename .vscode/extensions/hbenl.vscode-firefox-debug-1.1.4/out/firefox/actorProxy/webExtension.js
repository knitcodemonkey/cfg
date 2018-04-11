"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../../util/log");
const events_1 = require("events");
const pendingRequests_1 = require("../../util/pendingRequests");
const tab_1 = require("./tab");
const console_1 = require("./console");
let log = log_1.Log.create('WebExtensionActorProxy');
class WebExtensionActorProxy extends events_1.EventEmitter {
    constructor(webExtensionInfo, sourceMaps, connection) {
        super();
        this.webExtensionInfo = webExtensionInfo;
        this.sourceMaps = sourceMaps;
        this.connection = connection;
        this.pendingConnectRequests = new pendingRequests_1.PendingRequests();
        this.connection.register(this);
    }
    get name() {
        return this.webExtensionInfo.actor;
    }
    connect() {
        log.debug('Connecting');
        return new Promise((resolve, reject) => {
            this.pendingConnectRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type: 'connect' });
        });
    }
    receiveResponse(response) {
        if (response['form']) {
            let connectResponse = response;
            log.debug('Received connect response');
            this.pendingConnectRequests.resolveOne([
                new tab_1.TabActorProxy(connectResponse.form.actor, this.webExtensionInfo.name, connectResponse.form.url, this.sourceMaps, this.connection),
                new console_1.ConsoleActorProxy(connectResponse.form.consoleActor, this.connection)
            ]);
        }
        else if (response['error']) {
            let msg = response['message'];
            log.warn(`Error message from WebExtensionActor: ${msg}`);
            if (msg && msg.startsWith('Extension not found')) {
                setTimeout(() => {
                    this.connection.sendRequest({ to: this.name, type: 'connect' });
                }, 100);
            }
        }
        else {
            log.warn("Unknown message from WebExtensionActor: " + JSON.stringify(response));
        }
    }
}
exports.WebExtensionActorProxy = WebExtensionActorProxy;
//# sourceMappingURL=webExtension.js.map