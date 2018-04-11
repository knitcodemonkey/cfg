"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../../util/log");
const events_1 = require("events");
const index_1 = require("../index");
const pendingRequests_1 = require("../../util/pendingRequests");
let log = log_1.Log.create('TabActorProxy');
class TabActorProxy extends events_1.EventEmitter {
    constructor(name, _title, _url, sourceMaps, connection) {
        super();
        this.name = name;
        this._title = _title;
        this._url = _url;
        this.sourceMaps = sourceMaps;
        this.connection = connection;
        this.pendingAttachRequests = new pendingRequests_1.PendingRequests();
        this.pendingDetachRequests = new pendingRequests_1.PendingRequests();
        this.pendingWorkersRequests = new pendingRequests_1.PendingRequests();
        this.pendingReloadRequests = new pendingRequests_1.PendingRequests();
        this.workers = new Map();
        this.connection.register(this);
    }
    get title() {
        return this._title;
    }
    get url() {
        return this._url;
    }
    attach() {
        log.debug(`Attaching to tab ${this.name}`);
        return new Promise((resolve, reject) => {
            this.pendingAttachRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type: 'attach' });
        });
    }
    detach() {
        log.debug(`Detaching from tab ${this.name}`);
        return new Promise((resolve, reject) => {
            this.pendingDetachRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type: 'detach' });
        });
    }
    fetchWorkers() {
        log.debug('Fetching workers');
        return new Promise((resolve, reject) => {
            this.pendingWorkersRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type: 'listWorkers' });
        });
    }
    reload() {
        log.debug(`Reloading ${this.name}`);
        return new Promise((resolve, reject) => {
            this.pendingReloadRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type: 'reload' });
        });
    }
    dispose() {
        this.connection.unregister(this);
    }
    receiveResponse(response) {
        if (response['type'] === 'tabAttached') {
            log.debug(`Attached to tab ${this.name}`);
            let tabAttachedResponse = response;
            let threadActor = this.connection.getOrCreate(tabAttachedResponse.threadActor, () => new index_1.ThreadActorProxy(tabAttachedResponse.threadActor, this.connection));
            if (this.sourceMaps === 'client') {
                threadActor = new index_1.SourceMappingThreadActorProxy(threadActor, this.connection);
            }
            this.emit('attached', threadActor);
            this.pendingAttachRequests.resolveOne(threadActor);
        }
        else if (response['type'] === 'exited') {
            log.debug(`Tab ${this.name} exited`);
            this.pendingAttachRequests.rejectOne("exited");
        }
        else if (response['type'] === 'detached') {
            log.debug(`Detached from tab ${this.name} as requested`);
            this.pendingDetachRequests.resolveOne(undefined);
        }
        else if (response['error'] === 'wrongState') {
            log.warn(`Tab ${this.name} was in the wrong state for the last request`);
            this.pendingDetachRequests.rejectOne("exited");
        }
        else if (response['type'] === 'tabDetached') {
            log.debug(`Detached from tab ${this.name} because it was closed`);
            this.emit('detached');
        }
        else if (response['type'] === 'tabNavigated') {
            if (response['state'] === 'start') {
                this._url = response.url;
                log.debug(`Tab ${this.name} will navigate to ${this._url}`);
                this.emit('willNavigate');
            }
            else if (response['state'] === 'stop') {
                let didNavigateResponse = response;
                this._url = didNavigateResponse.url;
                this._title = didNavigateResponse.title;
                log.debug(`Tab ${this.name} did navigate to ${this._url}`);
                this.emit('didNavigate');
            }
        }
        else if (response['type'] === 'frameUpdate') {
            if (response['destroyAll']) {
                this.emit('framesDestroyed');
            }
        }
        else if (response['type'] === 'workerListChanged') {
            log.debug('Received workerListChanged event');
            this.emit('workerListChanged');
        }
        else if (response['workers']) {
            let workersResponse = response;
            let currentWorkers = new Map();
            log.debug(`Received ${workersResponse.workers.length} workers`);
            workersResponse.workers.forEach((worker) => {
                let workerActor;
                if (this.workers.has(worker.actor)) {
                    workerActor = this.workers.get(worker.actor);
                }
                else {
                    log.debug(`Worker ${worker.actor} started`);
                    workerActor = new index_1.WorkerActorProxy(worker.actor, worker.url, this.sourceMaps, this.connection);
                    this.emit('workerStarted', workerActor);
                }
                currentWorkers.set(worker.actor, workerActor);
            });
            this.workers.forEach((workerActor) => {
                if (!currentWorkers.has(workerActor.name)) {
                    log.debug(`Worker ${workerActor.name} stopped`);
                    this.emit('workerStopped', workerActor);
                    workerActor.dispose();
                }
            });
            this.workers = currentWorkers;
            this.pendingWorkersRequests.resolveOne(currentWorkers);
        }
        else if (response['error'] === 'noSuchActor') {
            log.error(`No such actor ${JSON.stringify(this.name)}`);
            this.pendingAttachRequests.rejectAll('No such actor');
            this.pendingDetachRequests.rejectAll('No such actor');
        }
        else if (Object.keys(response).length === 1) {
            log.debug('Received response to reload request');
            this.pendingReloadRequests.resolveOne(undefined);
        }
        else {
            if (response['type'] === 'frameUpdate') {
                log.debug(`Ignored frameUpdate event from tab ${this.name}`);
            }
            else if (response['type'] === 'newSource') {
                log.debug(`Ignored newSource event from tab ${this.name}`);
            }
            else {
                log.warn("Unknown message from TabActor: " + JSON.stringify(response));
            }
        }
    }
    onAttached(cb) {
        this.on('attached', cb);
    }
    onDetached(cb) {
        this.on('detached', cb);
    }
    onWillNavigate(cb) {
        this.on('willNavigate', cb);
    }
    onDidNavigate(cb) {
        this.on('didNavigate', cb);
    }
    onFramesDestroyed(cb) {
        this.on('framesDestroyed', cb);
    }
    onWorkerListChanged(cb) {
        this.on('workerListChanged', cb);
    }
    onWorkerStarted(cb) {
        this.on('workerStarted', cb);
    }
    onWorkerStopped(cb) {
        this.on('workerStopped', cb);
    }
}
exports.TabActorProxy = TabActorProxy;
//# sourceMappingURL=tab.js.map