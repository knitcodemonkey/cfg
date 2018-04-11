"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../util/log");
const transport_1 = require("./transport");
const root_1 = require("./actorProxy/root");
let log = log_1.Log.create('DebugConnection');
class DebugConnection {
    constructor(sourceMaps, socket) {
        this.actors = new Map();
        this.rootActor = new root_1.RootActorProxy(sourceMaps, this);
        this.transport = new transport_1.DebugProtocolTransport(socket);
        this.transport.on('message', (response) => {
            if (this.actors.has(response.from)) {
                if (log.isDebugEnabled()) {
                    log.debug(`Received response/event ${JSON.stringify(response)}`);
                }
                this.actors.get(response.from).receiveResponse(response);
            }
            else {
                log.error('Unknown actor: ' + JSON.stringify(response));
            }
        });
    }
    sendRequest(request) {
        if (log.isDebugEnabled()) {
            log.debug(`Sending request ${JSON.stringify(request)}`);
        }
        this.transport.sendMessage(request);
    }
    register(actor) {
        this.actors.set(actor.name, actor);
    }
    unregister(actor) {
        this.actors.delete(actor.name);
    }
    getOrCreate(actorName, createActor) {
        if (this.actors.has(actorName)) {
            return this.actors.get(actorName);
        }
        else {
            return createActor();
        }
    }
    disconnect() {
        return this.transport.disconnect();
    }
}
exports.DebugConnection = DebugConnection;
//# sourceMappingURL=connection.js.map