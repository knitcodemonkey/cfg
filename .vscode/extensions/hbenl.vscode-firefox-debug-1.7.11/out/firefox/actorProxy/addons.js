"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../../util/log");
const pendingRequests_1 = require("../../util/pendingRequests");
let log = log_1.Log.create('AddonsActorProxy');
class AddonsActorProxy {
    constructor(name, connection) {
        this.name = name;
        this.connection = connection;
        this.pendingInstallRequests = new pendingRequests_1.PendingRequests();
        this.connection.register(this);
    }
    installAddon(addonPath) {
        log.debug(`Installing addon from ${addonPath}`);
        return new Promise((resolve, reject) => {
            this.pendingInstallRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({
                to: this.name,
                type: 'installTemporaryAddon',
                addonPath
            });
        });
    }
    receiveResponse(response) {
        if (response['addon']) {
            let installAddonResponse = response;
            this.pendingInstallRequests.resolveOne(installAddonResponse);
        }
        else if (response['error']) {
            log.warn("Error from AddonsActor: " + JSON.stringify(response));
            this.pendingInstallRequests.rejectOne(response['message'] || response['error']);
        }
        else {
            log.warn("Unknown message from AddonsActor: " + JSON.stringify(response));
        }
    }
}
exports.AddonsActorProxy = AddonsActorProxy;
//# sourceMappingURL=addons.js.map