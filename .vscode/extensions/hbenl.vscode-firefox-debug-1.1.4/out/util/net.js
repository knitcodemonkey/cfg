"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const url = require("url");
const fs = require("fs-extra");
const net = require("net");
const http = require("http");
const https = require("https");
const fileUriToPath = require("file-uri-to-path");
const dataUriToBuffer = require("data-uri-to-buffer");
const log_1 = require("./log");
const misc_1 = require("./misc");
let log = log_1.Log.create('net');
function connect(port, host) {
    return new Promise((resolve, reject) => {
        let socket = net.connect(port, host || 'localhost');
        socket.on('connect', () => resolve(socket));
        socket.on('error', reject);
    });
}
exports.connect = connect;
function waitForSocket(port) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let lastError;
        for (var i = 0; i < 25; i++) {
            try {
                return yield connect(port);
            }
            catch (err) {
                lastError = err;
                yield misc_1.delay(200);
            }
        }
        throw lastError;
    });
}
exports.waitForSocket = waitForSocket;
function urlBasename(url) {
    let lastSepIndex = url.lastIndexOf('/');
    if (lastSepIndex < 0) {
        return url;
    }
    else {
        return url.substring(lastSepIndex + 1);
    }
}
exports.urlBasename = urlBasename;
function urlDirname(url) {
    let lastSepIndex = url.lastIndexOf('/');
    if (lastSepIndex < 0) {
        return url;
    }
    else {
        return url.substring(0, lastSepIndex + 1);
    }
}
exports.urlDirname = urlDirname;
function getUri(uri) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (uri.startsWith('data:')) {
            return dataUriToBuffer(uri).toString();
        }
        if (uri.startsWith('file:')) {
            return yield fs.readFile(fileUriToPath(uri), 'utf8');
        }
        return yield new Promise((resolve, reject) => {
            const parsedUrl = url.parse(uri);
            const get = (parsedUrl.protocol === 'https:') ? https.get : http.get;
            const options = Object.assign({ rejectUnauthorized: false }, parsedUrl);
            get(options, response => {
                let responseData = '';
                response.on('data', chunk => responseData += chunk);
                response.on('end', () => {
                    if (response.statusCode === 200) {
                        resolve(responseData);
                    }
                    else {
                        log.error(`HTTP GET failed with: ${response.statusCode} ${response.statusMessage}`);
                        reject(new Error(responseData.trim()));
                    }
                });
            }).on('error', e => {
                log.error(`HTTP GET failed: ${e}`);
                reject(e);
            });
        });
    });
}
exports.getUri = getUri;
//# sourceMappingURL=net.js.map