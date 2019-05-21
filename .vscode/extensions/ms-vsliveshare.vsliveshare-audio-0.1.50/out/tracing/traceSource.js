//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const dateformat = require("dateformat");
const events = require("events");
const path = require("path");
// Types defined here are (simplified) ports of .NET's System.Diagnostics tracing framework.
var TraceEventType;
(function (TraceEventType) {
    TraceEventType[TraceEventType["Critical"] = 1] = "Critical";
    TraceEventType[TraceEventType["Error"] = 2] = "Error";
    TraceEventType[TraceEventType["Warning"] = 4] = "Warning";
    TraceEventType[TraceEventType["Information"] = 8] = "Information";
    TraceEventType[TraceEventType["Verbose"] = 16] = "Verbose";
    TraceEventType[TraceEventType["Start"] = 256] = "Start";
    TraceEventType[TraceEventType["Stop"] = 512] = "Stop";
    TraceEventType[TraceEventType["Suspend"] = 1024] = "Suspend";
    TraceEventType[TraceEventType["Resume"] = 2048] = "Resume";
    TraceEventType[TraceEventType["Transfer"] = 4096] = "Transfer";
})(TraceEventType = exports.TraceEventType || (exports.TraceEventType = {}));
/**
 * Source for tracing events that associates a name with every event.
 */
class TraceSource extends events.EventEmitter {
    constructor(name) {
        super();
        this.name = name;
    }
    /**
     * Creates a new TraceSource with listeners copied from the existing TraceSource.
     */
    withName(name) {
        const newTraceSource = new TraceSource(name);
        this.eventNames().forEach((eventName) => {
            this.listeners(eventName).forEach(listener => {
                newTraceSource.on(eventName, listener);
            });
        });
        return newTraceSource;
    }
    addTraceListener(listener) {
        this.on(TraceSource.eventEventName, listener.traceEvent.bind(listener));
        this.on(TraceSource.lineEventName, listener.writeLine.bind(listener));
    }
    writeLine(line) {
        this.emit(TraceSource.lineEventName, line);
    }
    traceEvent(eventType, id, message) {
        this.emit(TraceSource.eventEventName, this.name, eventType, id, message);
    }
    errorEvent(id, message) {
        this.traceEvent(TraceEventType.Error, id, message);
    }
    warningEvent(id, message) {
        this.traceEvent(TraceEventType.Warning, id, message);
    }
    infoEvent(id, message) {
        this.traceEvent(TraceEventType.Information, id, message);
    }
    error(message) {
        this.traceEvent(TraceEventType.Error, 0, message);
    }
    warning(message) {
        this.traceEvent(TraceEventType.Warning, 0, message);
    }
    info(message) {
        this.traceEvent(TraceEventType.Information, 0, message);
    }
    verbose(message) {
        this.traceEvent(TraceEventType.Verbose, 0, message);
    }
}
TraceSource.lineEventName = 'line';
TraceSource.eventEventName = 'event';
exports.TraceSource = TraceSource;
var TracingConstants_1 = require("./TracingConstants");
exports.TraceSources = TracingConstants_1.TraceSources;
exports.TraceEventIds = TracingConstants_1.TraceEventIds;
exports.defaultTraceSource = new TraceSource('LiveShareAudio');
/**
 * Base class for a listener for events from a TraceSource.
 */
class TraceListener {
    traceEvent(source, eventType, id, message) {
        if (!this.filter || this.filter.shouldTrace(source, eventType, id)) {
            this.writeEvent(source, eventType, id, message);
        }
    }
}
exports.TraceListener = TraceListener;
class TraceFormat {
    static formatEvent(time, source, eventType, id, message) {
        let eventTypeChar;
        switch (eventType) {
            case TraceEventType.Critical:
                eventTypeChar = 'C';
                break;
            case TraceEventType.Error:
                eventTypeChar = 'E';
                break;
            case TraceEventType.Warning:
                eventTypeChar = 'W';
                break;
            case TraceEventType.Information:
                eventTypeChar = 'I';
                break;
            case TraceEventType.Verbose:
                eventTypeChar = 'V';
                break;
            case TraceEventType.Start:
                eventTypeChar = '>';
                break;
            case TraceEventType.Stop:
                eventTypeChar = '<';
                break;
            default:
                eventTypeChar = '?';
                break;
        }
        const dateString = time === null ? '' :
            dateformat(time, 'yyyy-mm-dd HH:MM:ss.l ', /*utc*/ true);
        if (message.length > TraceFormat.maxMessageLength) {
            message = message.substr(0, TraceFormat.maxMessageLength) + '...';
        }
        let line;
        if (id !== 0) {
            line = `[${dateString}${source} ${eventTypeChar}] (${id}) ${message}`;
        }
        else {
            line = `[${dateString}${source} ${eventTypeChar}] ${message}`;
        }
        return line;
    }
    static parseEventId(formattedMessage) {
        let m = formattedMessage.match(/\] \(([0-9]+)\)/);
        return parseInt(m && m[1], 10) || 0;
    }
    static formatPath(value) {
        if (!value) {
            return '<null>';
        }
        else if (TraceFormat.disableObfuscation) {
            return value;
        }
        // Obfuscate the directory and file names, but preserve the extension
        // and whether it's an absolute or relative path.
        const directoryHash = Privacy.getShortHash(path.dirname(value));
        const extension = path.extname(value);
        const fileHash = Privacy.getShortHash(path.basename(value, extension));
        const slashIndex = value.replace('\\', '/').indexOf('/');
        if (slashIndex === 2 && value[1] === ':') {
            // Windows style absolute path
            return `<?:${value[2]}${directoryHash}${value[2]}${fileHash}${extension}>`;
        }
        else if (slashIndex === 0) {
            // Unix style absolute path
            return `<${value[0]}${directoryHash}${value[0]}${fileHash}${extension}>`;
        }
        else if (slashIndex > 0) {
            // Relative path
            return `<${directoryHash}${value[slashIndex]}${fileHash}${extension}>`;
        }
        else {
            // Simple file name
            return `<${fileHash}${extension}>`;
        }
    }
}
TraceFormat.maxMessageLength = 5120;
TraceFormat.disableObfuscation = false;
exports.TraceFormat = TraceFormat;
class Privacy {
    static setKey(privacyKeyBase64) {
        Privacy.privacyKey = new Buffer(privacyKeyBase64, 'base64');
    }
    static getShortHash(value) {
        if (!value) {
            return '<null>';
        }
        else if (!Privacy.privacyKey) {
            // The privacy key has not yet been retrieved from the agent.
            // (Generally we shouldn't be doing anything with PII before that point anyway.)
            return '<redacted>';
        }
        const hmac = crypto.createHmac('sha256', Privacy.privacyKey);
        hmac.update(value);
        return hmac.digest('hex').substr(0, 8);
    }
}
exports.Privacy = Privacy;
//# sourceMappingURL=traceSource.js.map