"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../../util/log");
const events_1 = require("events");
const pendingRequests_1 = require("../../util/pendingRequests");
const tab_1 = require("./tab");
const console_1 = require("./console");
const preference_1 = require("./preference");
const addons_1 = require("./addons");
let log = log_1.Log.create('RootActorProxy');
class RootActorProxy extends events_1.EventEmitter {
    constructor(sourceMaps, connection) {
        super();
        this.sourceMaps = sourceMaps;
        this.connection = connection;
        this.tabs = new Map();
        this.pendingProcessRequests = new pendingRequests_1.PendingRequests();
        this.pendingTabsRequests = new pendingRequests_1.PendingRequests();
        this.pendingAddonsRequests = new pendingRequests_1.PendingRequests();
        this.connection.register(this);
    }
    get name() {
        return 'root';
    }
    fetchProcess() {
        log.debug('Fetching process');
        return new Promise((resolve, reject) => {
            this.pendingProcessRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type: 'getProcess' });
        });
    }
    fetchTabs() {
        log.debug('Fetching tabs');
        return new Promise((resolve, reject) => {
            this.pendingTabsRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type: 'listTabs' });
        });
    }
    fetchAddons() {
        log.debug('Fetching addons');
        return new Promise((resolve, reject) => {
            this.pendingAddonsRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type: 'listAddons' });
        });
    }
    receiveResponse(response) {
        if (response['applicationType']) {
            this.emit('init', response);
        }
        else if (response['tabs']) {
            let tabsResponse = response;
            let currentTabs = new Map();
            if (tabsResponse.tabs.length === 0) {
                log.info('Received 0 tabs - will retry in 100ms');
                setTimeout(() => {
                    this.connection.sendRequest({ to: this.name, type: 'listTabs' });
                }, 100);
                return;
            }
            log.debug(`Received ${tabsResponse.tabs.length} tabs`);
            tabsResponse.tabs.forEach((tab) => {
                let actorsForTab;
                if (this.tabs.has(tab.actor)) {
                    actorsForTab = this.tabs.get(tab.actor);
                }
                else {
                    log.debug(`Tab ${tab.actor} opened`);
                    actorsForTab = [
                        new tab_1.TabActorProxy(tab.actor, tab.title, tab.url, this.sourceMaps, this.connection),
                        new console_1.ConsoleActorProxy(tab.consoleActor, this.connection)
                    ];
                    this.emit('tabOpened', actorsForTab);
                }
                currentTabs.set(tab.actor, actorsForTab);
            });
            this.tabs.forEach((actorsForTab) => {
                if (!currentTabs.has(actorsForTab[0].name)) {
                    log.debug(`Tab ${actorsForTab[0].name} closed`);
                    this.emit('tabClosed', actorsForTab);
                }
            });
            this.tabs = currentTabs;
            let preferenceActor = this.connection.getOrCreate(tabsResponse.preferenceActor, () => new preference_1.PreferenceActorProxy(tabsResponse.preferenceActor, this.connection));
            let addonsActor;
            const addonsActorName = tabsResponse.addonsActor;
            if (addonsActorName) {
                addonsActor = this.connection.getOrCreate(addonsActorName, () => new addons_1.AddonsActorProxy(addonsActorName, this.connection));
            }
            this.pendingTabsRequests.resolveOne({
                tabs: currentTabs,
                preference: preferenceActor,
                addons: addonsActor
            });
        }
        else if (response['type'] === 'tabListChanged') {
            log.debug('Received tabListChanged event');
            this.emit('tabListChanged');
        }
        else if (response['addons']) {
            let addonsResponse = response;
            log.debug(`Received ${addonsResponse.addons.length} addons`);
            this.pendingAddonsRequests.resolveOne(addonsResponse.addons);
        }
        else if (response['type'] === 'addonListChanged') {
            log.debug('Received addonListChanged event');
            this.emit('addonListChanged');
        }
        else if (response['form']) {
            let processResponse = response;
            log.debug('Received getProcess response');
            this.pendingProcessRequests.resolveOne([
                new tab_1.TabActorProxy(processResponse.form.actor, 'Browser', processResponse.form.url, this.sourceMaps, this.connection),
                new console_1.ConsoleActorProxy(processResponse.form.consoleActor, this.connection)
            ]);
        }
        else {
            if (response['type'] === 'forwardingCancelled') {
                log.debug(`Received forwardingCancelled event from ${this.name} (ignoring)`);
            }
            else {
                log.warn("Unknown message from RootActor: " + JSON.stringify(response));
            }
        }
    }
    onInit(cb) {
        this.on('init', cb);
    }
    onTabOpened(cb) {
        this.on('tabOpened', cb);
    }
    onTabClosed(cb) {
        this.on('tabClosed', cb);
    }
    onTabListChanged(cb) {
        this.on('tabListChanged', cb);
    }
    onAddonListChanged(cb) {
        this.on('addonListChanged', cb);
    }
}
exports.RootActorProxy = RootActorProxy;
//# sourceMappingURL=root.js.map