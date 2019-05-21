"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
const telemetry_transport_1 = require("./telemetry-transport");
const user_notification_transport_1 = require("./user-notification-transport");
function FilterErrorPath(line) {
    if (line) {
        const values = line.split("/out/");
        if (values.length <= 1) {
            // Didn't match expected format
            return line;
        }
        else {
            return values[1];
        }
    }
}
function configure(context) {
    winston.configure({
        transports: [
            new (winston.transports.File)({ level: "warn", filename: context.asAbsolutePath("arduino.log") }),
            new telemetry_transport_1.default({ level: "info", context }),
            new user_notification_transport_1.default({ level: "info" }),
        ],
    });
}
exports.configure = configure;
function info(message, metadata) {
    winston.info(message, metadata);
}
exports.info = info;
function debug(message, metadata) {
    winston.debug(message, metadata);
}
exports.debug = debug;
function warn(message, metadata) {
    winston.warn(message, metadata);
}
exports.warn = warn;
function verbose(message, metadata) {
    winston.verbose(message, metadata);
}
exports.verbose = verbose;
function error(message, metadata) {
    winston.error(message, metadata);
}
exports.error = error;
function silly(message, metadata) {
    winston.silly(message, metadata);
}
exports.silly = silly;
function traceUserData(message, metadata) {
    // use `info` as the log level and add a special flag in metadata
    winston.log("info", message, Object.assign({}, metadata, { telemetry: true }));
}
exports.traceUserData = traceUserData;
function traceErrorOrWarning(level, message, error, metadata) {
    // use `info` as the log level and add a special flag in metadata
    let stackArray;
    let firstLine = "";
    if (error !== undefined && error.stack !== undefined) {
        stackArray = error.stack.split("\n");
        if (stackArray !== undefined && stackArray.length >= 2) {
            firstLine = stackArray[1]; // The fist line is the error message and we don't want to send that telemetry event
            firstLine = FilterErrorPath(firstLine ? firstLine.replace(/\\/g, "/") : "");
        }
    }
    winston.log(level, "error", Object.assign({}, metadata, { message: error.message, errorLine: firstLine, telemetry: true }));
}
function traceError(message, error, metadata) {
    traceErrorOrWarning("error", message, error, metadata);
}
exports.traceError = traceError;
function traceWarning(message, error, metadata) {
    traceErrorOrWarning("warn", message, error, metadata);
}
exports.traceWarning = traceWarning;
function notifyAndThrowUserError(errorCode, error, message) {
    notifyUserError(errorCode, error, message);
    throw error;
}
exports.notifyAndThrowUserError = notifyAndThrowUserError;
function notifyUserError(errorCode, error, message) {
    traceError(errorCode, error, { notification: message || error.message, showUser: true, telemetry: true });
}
exports.notifyUserError = notifyUserError;
function notifyUserWarning(errorCode, error, message) {
    traceWarning(errorCode, error, { notification: message || error.message, showUser: true, telemetry: true });
}
exports.notifyUserWarning = notifyUserWarning;
class Timer {
    constructor() {
        this.start();
    }
    // Get the duration of time elapsed by the timer, in milliseconds
    end() {
        if (!this._startTime) {
            return -1;
        }
        else {
            const endTime = process.hrtime(this._startTime);
            return endTime[0] * 1000 + endTime[1] / 1000000;
        }
    }
    start() {
        this._startTime = process.hrtime();
    }
}
exports.Timer = Timer;

//# sourceMappingURL=logger.js.map
