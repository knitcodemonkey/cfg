'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const ws = require("ws");
const url = require("url");
const querystring = require("querystring");
const Utils = require("../models/utils");
const Constants = require("../constants/constants");
const Interfaces = require("../models/interfaces");
const http = require("http");
const bodyParser = require('body-parser');
const express = require('express');
const WebSocketServer = ws.Server;
class WebSocketMapping {
    constructor() {
        this.pendingMessages = [];
    }
}
class WebSocketMessage {
}
class LocalWebService {
    constructor(extensionPath) {
        this.app = express();
        this.server = http.createServer();
        this.wss = new WebSocketServer({ server: this.server });
        this.wsMap = new Map();
        // add static content for express web server to serve
        const self = this;
        LocalWebService._vscodeExtensionPath = extensionPath;
        LocalWebService._staticContentPath = path.join(extensionPath, LocalWebService._htmlContentLocation);
        this.app.use(express.static(LocalWebService.staticContentPath));
        this.app.use(bodyParser.json({ limit: '50mb', type: 'application/json' }));
        this.app.set('view engine', 'ejs');
        Utils.logDebug(`LocalWebService: added static html content path: ${LocalWebService.staticContentPath}`);
        this.server.on('request', this.app);
        // Handle new connections to the web socket server
        this.wss.on('connection', (ws) => {
            let parse = querystring.parse(url.parse(ws.upgradeReq.url).query);
            // Attempt to find the mapping for the web socket server
            let mapping = self.wsMap.get(parse.uri);
            // If the mapping does not exist, create it now
            if (mapping === undefined) {
                mapping = new WebSocketMapping();
                self.wsMap.set(parse.uri, mapping);
            }
            // Assign the web socket server to the mapping
            mapping.webSocketServer = ws;
            // Replay all messages to the server
            mapping.pendingMessages.forEach(m => {
                ws.send(JSON.stringify(m));
            });
        });
    }
    static get serviceUrl() {
        return Constants.outputServiceLocalhost + LocalWebService._servicePort;
    }
    static get staticContentPath() {
        return LocalWebService._staticContentPath;
    }
    static get extensionPath() {
        return LocalWebService._vscodeExtensionPath;
    }
    static getEndpointUri(type) {
        return this.serviceUrl + '/' + Interfaces.ContentTypes[type];
    }
    broadcast(uri, event, data) {
        // Create a message to send out
        let message = {
            type: event,
            data: data ? data : undefined
        };
        // Attempt to find the web socket server
        let mapping = this.wsMap.get(uri);
        // Is the URI mapped to a web socket server?
        if (mapping === undefined) {
            // There isn't a mapping, so create it
            mapping = new WebSocketMapping();
            this.wsMap.set(uri, mapping);
        }
        else {
            // Make sure the web socket server is open, then fire away
            if (mapping.webSocketServer && mapping.webSocketServer.readyState === ws.OPEN) {
                mapping.webSocketServer.send(JSON.stringify(message));
            }
        }
        // Append the message to the message history
        mapping.pendingMessages.push(message);
    }
    /**
     * Purges the queue of messages to send on the web socket server for the given uri
     * @param   uri URI of the web socket server to reset
     */
    resetSocket(uri) {
        if (this.wsMap.has(uri)) {
            this.wsMap.delete(uri);
        }
    }
    addHandler(type, handler) {
        let segment = '/' + Interfaces.ContentTypes[type];
        this.app.get(segment, handler);
    }
    addPostHandler(type, handler) {
        let segment = '/' + Interfaces.ContentTypes[type];
        this.app.post(segment, handler);
    }
    start() {
        const address = this.server.listen(0).address();
        const port = address.port; // 0 = listen on a random port
        Utils.logDebug(`LocalWebService listening on port ${port}`);
        LocalWebService._servicePort = port.toString();
    }
}
LocalWebService._htmlContentLocation = 'out/src/views/htmlcontent';
exports.default = LocalWebService;

//# sourceMappingURL=localWebService.js.map
