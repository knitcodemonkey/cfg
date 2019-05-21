"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = require("fs-extra");
var NumericLogLevel;
(function (NumericLogLevel) {
    NumericLogLevel[NumericLogLevel["Debug"] = 0] = "Debug";
    NumericLogLevel[NumericLogLevel["Info"] = 1] = "Info";
    NumericLogLevel[NumericLogLevel["Warn"] = 2] = "Warn";
    NumericLogLevel[NumericLogLevel["Error"] = 3] = "Error";
})(NumericLogLevel || (NumericLogLevel = {}));
class Log {
    constructor(name) {
        this.name = name;
        this.configure();
        Log.logs.set(name, this);
    }
    static setConfig(newConfig) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (Log.fileDescriptor !== undefined) {
                yield fs.close(Log.fileDescriptor);
                Log.fileDescriptor = undefined;
            }
            Log.config = newConfig;
            if (Log.config.fileName) {
                try {
                    Log.fileDescriptor = yield fs.open(Log.config.fileName, 'w');
                }
                catch (e) { }
            }
            Log.logs.forEach((log) => log.configure());
        });
    }
    static create(name) {
        return new Log(name);
    }
    debug(msg) {
        this.log(msg, NumericLogLevel.Debug, 'DEBUG');
    }
    info(msg) {
        this.log(msg, NumericLogLevel.Info, 'INFO ');
    }
    warn(msg) {
        this.log(msg, NumericLogLevel.Warn, 'WARN ');
    }
    error(msg) {
        this.log(msg, NumericLogLevel.Error, 'ERROR');
    }
    isDebugEnabled() {
        return (this.minLevel !== undefined) && (this.minLevel <= NumericLogLevel.Debug);
    }
    isInfoEnabled() {
        return (this.minLevel !== undefined) && (this.minLevel <= NumericLogLevel.Info);
    }
    isWarnEnabled() {
        return (this.minLevel !== undefined) && (this.minLevel <= NumericLogLevel.Warn);
    }
    isErrorEnabled() {
        return (this.minLevel !== undefined) && (this.minLevel <= NumericLogLevel.Error);
    }
    configure() {
        this.fileLevel = undefined;
        if (Log.config.fileName && Log.config.fileLevel) {
            this.fileLevel = this.convertLogLevel(Log.config.fileLevel[this.name]);
            if (this.fileLevel === undefined) {
                this.fileLevel = this.convertLogLevel(Log.config.fileLevel['default']);
            }
        }
        if (Log.config.consoleLevel) {
            this.consoleLevel = this.convertLogLevel(Log.config.consoleLevel[this.name]);
            if (this.consoleLevel === undefined) {
                this.consoleLevel = this.convertLogLevel(Log.config.consoleLevel['default']);
            }
        }
        this.minLevel = this.fileLevel;
        if ((this.consoleLevel !== undefined) &&
            ((this.minLevel === undefined) || (this.consoleLevel < this.minLevel))) {
            this.minLevel = this.consoleLevel;
        }
    }
    convertLogLevel(logLevel) {
        if (!logLevel) {
            return undefined;
        }
        switch (logLevel) {
            case 'Debug':
                return NumericLogLevel.Debug;
            case 'Info':
                return NumericLogLevel.Info;
            case 'Warn':
                return NumericLogLevel.Warn;
            case 'Error':
                return NumericLogLevel.Error;
        }
    }
    log(msg, level, displayLevel) {
        if ((this.minLevel !== undefined) && (level >= this.minLevel)) {
            let elapsedTime = (Date.now() - Log.startTime) / 1000;
            let elapsedTimeString = elapsedTime.toFixed(3);
            while (elapsedTimeString.length < 7) {
                elapsedTimeString = '0' + elapsedTimeString;
            }
            let logMsg = displayLevel + '|' + elapsedTimeString + '|' + this.name + ': ' + msg;
            if ((Log.fileDescriptor !== undefined) &&
                (this.fileLevel !== undefined) && (level >= this.fileLevel)) {
                fs.write(Log.fileDescriptor, logMsg + '\n', (err, written, str) => { });
            }
            if ((this.consoleLevel !== undefined) && (level >= this.consoleLevel)) {
                Log.consoleLog(logMsg);
            }
        }
    }
}
Log.startTime = Date.now();
Log.config = {};
Log.logs = new Map();
Log.consoleLog = console.log;
exports.Log = Log;
//# sourceMappingURL=log.js.map