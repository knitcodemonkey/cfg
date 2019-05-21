//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const traceSource_1 = require("./traceSource");
const fs = require("fs");
const os = require("os");
const path = require("path");
const util_1 = require("../util");
class LogFileTraceListener extends traceSource_1.TraceListener {
    constructor(processName, logDirectory) {
        super();
        this.processName = processName;
        this.logDirectory = logDirectory;
        this.canWriteLogs = true;
        this.openLogFileAsync = (index = 0) => __awaiter(this, void 0, void 0, function* () {
            // if 5th attempt - report to telemetry and forbit writing to local logs.
            if (index === 5) {
                this.canWriteLogs = false;
                console.error('Name Log File Failed - Reached maximum number of attempts.');
                return;
            }
            const datePrefix = new Date().toISOString()
                .replace(/T/, '_')
                .replace(/:|-/g, '')
                .replace(/\..+/, '');
            // Ensure a unique file name, in case another log session started around the same time.
            const indexFileName = path.join(this.logDirectory, `${datePrefix}_${Date.now()}${index}_${this.processName}.log`);
            try {
                const fileDescriptior = yield util_1.openFileAsync(indexFileName, 'ax'); // Append, fail if exists
                this.fileDescriptior = fileDescriptior;
                this.fileName = indexFileName;
            }
            catch (err) {
                if (err.code === 'EEXIST') {
                    // try the nex index
                    yield this.openLogFileAsync(index + 1);
                }
                else {
                    this.canWriteLogs = false;
                    console.error(`Name Log File Failed. ${err.message}`, err.stack);
                }
            }
            this.writePromise = Promise.resolve();
        });
        if (!this.logDirectory) {
            this.logDirectory = LogFileTraceListener.defaultLogDirectory;
        }
    }
    static get defaultLogDirectory() {
        return path.join(os.tmpdir(), 'VSFeedbackVSRTCLogs');
    }
    get logFileName() {
        return this.fileName;
    }
    /**
     * Opens the log file. Await this method before using the trace listener.
     */
    openAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => {
                fs.mkdir(this.logDirectory, (err) => {
                    resolve();
                });
            });
            yield this.openLogFileAsync();
        });
    }
    writeLine(line) {
        // Agent messages that are traced with writeLine() are already
        // logged to a separate file by the agent process.
    }
    writeEvent(source, eventType, id, message) {
        if (this.canWriteLogs === false) {
            return;
        }
        const line = traceSource_1.TraceFormat.formatEvent(new Date(), source, eventType, id, message);
        this.writePromise = this.writePromise.then(() => {
            return new Promise((resolve, reject) => {
                fs.write(this.fileDescriptior, line + os.EOL, (err) => {
                    if (err) {
                        this.canWriteLogs = false;
                        // do not reject if error, but log the event to telemetry
                        console.error(err.message, err.stack);
                    }
                    resolve();
                });
            });
        });
    }
}
exports.LogFileTraceListener = LogFileTraceListener;
//# sourceMappingURL=logFileTraceListener.js.map