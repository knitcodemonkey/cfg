"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const winston = require("winston");
class UserNotificationTransport extends winston.Transport {
    constructor(options) {
        super(options);
    }
    log(level, message, metadata, callback) {
        if (metadata && metadata.showUser) {
            const notification = (metadata && metadata.notification) ? metadata.notification : message;
            if (level === "warn") {
                vscode.window.showWarningMessage(notification);
            }
            else if (level === "error") {
                vscode.window.showErrorMessage(notification);
            }
            else {
                winston.error(`Invalid error level '${level}' for user notification.`);
            }
        }
        super.emit("logged");
        if (callback) {
            callback(null, true);
        }
    }
}
exports.default = UserNotificationTransport;

//# sourceMappingURL=user-notification-transport.js.map
