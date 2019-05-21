"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const express = require("express");
const http = require("http");
const path = require("path");
class LocalWebServer {
    constructor(_extensionPath) {
        this._extensionPath = _extensionPath;
        this.app = express();
        this.app.use("/", express.static(path.join(this._extensionPath, "./out/views")));
        this.app.use(bodyParser.json());
        this.server = http.createServer(this.app);
    }
    getServerUrl() {
        return `http://localhost:${this._serverPort}`;
    }
    getEndpointUri(type) {
        return `http://localhost:${this._serverPort}/${type}`;
    }
    addHandler(url, handler) {
        this.app.get(url, handler);
    }
    addPostHandler(url, handler) {
        this.app.post(url, handler);
    }
    start() {
        const port = this.server.listen(0).address().port;
        // tslint:disable-next-line
        console.log(`Starting express server on port: ${port}`);
        this._serverPort = port;
    }
}
exports.default = LocalWebServer;

//# sourceMappingURL=localWebServer.js.map
