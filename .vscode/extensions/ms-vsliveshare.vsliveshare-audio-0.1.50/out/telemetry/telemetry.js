"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const path = require("path");
const traceSource_1 = require("../tracing/traceSource");
const telemetryStrings_1 = require("./telemetryStrings");
class Telemetry {
    constructor() {
        let packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
        const { name, version, aiKey } = require(packageJsonPath);
        this.reporter = new vscode_extension_telemetry_1.default(name, version, aiKey);
        this.contextProperties = {};
    }
    static get Instance() {
        if (!Telemetry.singleton) {
            Telemetry.singleton = new Telemetry();
        }
        return Telemetry.singleton;
    }
    addContextProperty(property, value, isPII = false) {
        // no need to set `undefined` values
        if (value === undefined) {
            return;
        }
        const valueString = String(value);
        if (isPII) {
            this.contextProperties[property] = traceSource_1.Privacy.getShortHash(valueString);
        }
        else {
            this.contextProperties[property] = valueString;
        }
    }
    removeContextProperty(property) {
        delete this.contextProperties[property];
    }
    addContextPropertiesToObject(properties) {
        return Object.assign({}, this.contextProperties, properties);
    }
    sendTelemetryEvent(eventName, properties, measures) {
        this.reporter.sendTelemetryEvent(eventName, this.addContextPropertiesToObject(properties), measures);
    }
    sendFault(eventName, type, details, exception, correlatedEvent) {
        (new Fault(eventName, type, details, exception, correlatedEvent)).send();
    }
    sendActivateExtensionFault(type, details, exception, correlatedEvent) {
        this.sendFault(telemetryStrings_1.TelemetryEventNames.ACTIVATE_EXTENSION_FAULT, type, details, exception, correlatedEvent);
    }
    sendDeactivateExtensionFault(type, details, exception, correlatedEvent) {
        this.sendFault(telemetryStrings_1.TelemetryEventNames.DEACTIVATE_EXTENSION_FAULT, type, details, exception, correlatedEvent);
    }
    sendCommandEvent(commandName) {
        const properties = {};
        properties[telemetryStrings_1.TelemetryPropertyNames.INVOKED_COMMAND] = commandName;
        this.sendTelemetryEvent(telemetryStrings_1.TelemetryEventNames.INVOKE_COMMAND, properties);
    }
    startTimedEvent(eventName, correlate = false) {
        return new TimedEvent(eventName, correlate);
    }
    setUserInfo(userInfo) {
        let userDomain = process.env.USERDNSDOMAIN ? process.env.USERDNSDOMAIN.toLowerCase() : '';
        if (userDomain.endsWith('microsoft.com')) {
            this.addContextProperty(telemetryStrings_1.TelemetryPropertyNames.IS_INTERNAL, 'true');
            return;
        }
        if (!(userInfo && userInfo.emailAddress)) {
            return;
        }
        this.addContextProperty(telemetryStrings_1.TelemetryPropertyNames.IS_INTERNAL, userInfo.emailAddress.endsWith('microsoft.com') ? 'true' : 'false');
    }
    setCorrelationEvent(correlationEvent) {
        this.correlationEvent = correlationEvent;
    }
    removeCorrelationEvent(correlationEvent) {
        if (this.correlationEvent === correlationEvent) {
            this.correlationEvent = undefined;
        }
    }
    correlate(telemetryEvent) {
        if (this.correlationEvent) {
            telemetryEvent.correlateWith(this.correlationEvent);
        }
    }
    capitalizeFirstChar(content) {
        return content.charAt(0).toUpperCase() + content.slice(1);
    }
}
const Instance = Telemetry.Instance;
exports.Telemetry = Instance;
class TelemetryEvent {
    constructor(eventName, correlate = false) {
        this.eventName = eventName;
        this.properties = {};
        this.measures = {};
        this.correlationId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        if (correlate) {
            Instance.correlate(this);
        }
    }
    static create(property, data) {
        const correlate = data ? !!data.correlate : false;
        const telemetryEvent = new TelemetryEvent(property, correlate);
        if (data.properties) {
            Object.keys(data.properties)
                .forEach(key => telemetryEvent.addProperty(telemetryStrings_1.TelemetryPropertyNames.FEATURE_NAME + key, data.properties[key]));
        }
        if (data.measures) {
            Object.keys(data.measures)
                .forEach(key => telemetryEvent.addMeasure(telemetryStrings_1.TelemetryPropertyNames.FEATURE_NAME + key, data.measures[key]));
        }
        return telemetryEvent;
    }
    addProperty(property, value, isPII = false) {
        // no need to set `undefined` values
        if (value === undefined) {
            return;
        }
        const valueString = String(value);
        if (isPII) {
            this.properties[property] = traceSource_1.Privacy.getShortHash(valueString);
        }
        else {
            this.properties[property] = valueString;
        }
    }
    propertyExists(property) {
        return property in this.properties;
    }
    addMeasure(measure, value) {
        this.measures[measure] = value;
    }
    getCorrelationId() {
        return this.correlationId;
    }
    correlateWith(otherEvent) {
        this.correlationId = otherEvent.getCorrelationId();
    }
    correlateWithId(correlationId) {
        this.correlationId = correlationId;
    }
    send() {
        return __awaiter(this, void 0, void 0, function* () {
            this.addMeasure(telemetryStrings_1.TelemetryPropertyNames.CORRELATION_ID, this.correlationId);
            Instance.sendTelemetryEvent(this.eventName, this.properties, this.measures);
        });
    }
}
exports.TelemetryEvent = TelemetryEvent;
function removeEmailAddresses(str) {
    return str.replace(/[\S]+@[\S]+/gi, '[EMAIL]');
}
/**
 * Path names are PII, so we need to remove all parts preceeding the filename.
 * Makes sure we don't accidentally scrub dates as well.
 */
function removePath(filePath, replacementString = '') {
    return filePath.replace(/([A-Za-z]:)?(\S*[\\\/])+\S*/gi, (match, drive, directory, offset, whole) => {
        if (/^\d{1,4}\/\d{1,2}\/\d{1,4}$/.test(match)) { // This is a date. No need to scrub.
            return match;
        }
        else {
            const driveAndDirectoryLength = (drive ? drive.length : 0) + directory.length;
            const fileName = match.substr(driveAndDirectoryLength);
            return replacementString + fileName;
        }
    });
}
function cleanSensitiveInformation(str) {
    return str ? removeEmailAddresses(removePath(str, '[PATH]/')) : str;
}
exports.cleanSensitiveInformation = cleanSensitiveInformation;
class Fault extends TelemetryEvent {
    constructor(eventName, type, details, exception, correlatedEvent) {
        super(eventName);
        this.exception = exception;
        this.addProperty(telemetryStrings_1.TelemetryPropertyNames.FAULT_TYPE, FaultType[type]);
        if (details) {
            this.addProperty(telemetryStrings_1.TelemetryPropertyNames.EVENT_MESSAGE, cleanSensitiveInformation(details));
        }
        let exceptionStack = '';
        if (exception && exception.stack && typeof exception.stack === 'string') {
            exceptionStack += cleanSensitiveInformation(exception.stack);
        }
        if (!exceptionStack) {
            exceptionStack = 'No Stack';
        }
        this.addProperty(telemetryStrings_1.TelemetryPropertyNames.EVENT_EXCEPTION_STACK, exceptionStack);
        if (correlatedEvent) {
            this.correlateWith(correlatedEvent);
        }
    }
}
exports.Fault = Fault;
class TimedEvent extends TelemetryEvent {
    constructor(eventName, correlate = false) {
        super(eventName, correlate);
        this.startTime = (new Date()).getTime();
        this.lastMarkTime = this.startTime;
        TimedEvent.scopeStack.push(this);
    }
    markTime(markName, fromStart = false) {
        let currentTime = (new Date()).getTime();
        let duration = fromStart ? (currentTime - this.startTime) : (currentTime - this.lastMarkTime);
        this.lastMarkTime = currentTime;
        this.addMeasure(markName, duration);
    }
    end(result, message, sendNow = true) {
        this.addProperty(telemetryStrings_1.TelemetryPropertyNames.EVENT_RESULT, TelemetryResult[result]);
        if (message) {
            this.addProperty(telemetryStrings_1.TelemetryPropertyNames.EVENT_MESSAGE, cleanSensitiveInformation(message));
        }
        this.markTime(telemetryStrings_1.TelemetryPropertyNames.EVENT_DURATION, true);
        Instance.removeCorrelationEvent(this);
        if (sendNow) {
            this.send();
        }
        for (let i = TimedEvent.scopeStack.length - 1; i >= 0; i--) {
            if (TimedEvent.scopeStack[i] === this) {
                TimedEvent.scopeStack.splice(i, 1);
            }
        }
    }
    static propagateOffsetMarkTime(markName, markEvent) {
        for (let i = 0; i < TimedEvent.scopeStack.length; i++) {
            const targetEvent = TimedEvent.scopeStack[i];
            if (targetEvent !== markEvent) {
                targetEvent.markTime(markName);
            }
        }
    }
}
TimedEvent.scopeStack = [];
exports.TimedEvent = TimedEvent;
var FaultType;
(function (FaultType) {
    FaultType[FaultType["Error"] = 0] = "Error";
    FaultType[FaultType["User"] = 1] = "User";
    FaultType[FaultType["Unknown"] = 2] = "Unknown";
    FaultType[FaultType["NonBlockingFault"] = 3] = "NonBlockingFault";
})(FaultType = exports.FaultType || (exports.FaultType = {}));
var TelemetryResult;
(function (TelemetryResult) {
    TelemetryResult[TelemetryResult["Cancel"] = 0] = "Cancel";
    TelemetryResult[TelemetryResult["Success"] = 1] = "Success";
    TelemetryResult[TelemetryResult["Failure"] = 2] = "Failure";
    TelemetryResult[TelemetryResult["UserFailure"] = 3] = "UserFailure";
    TelemetryResult[TelemetryResult["IndeterminateFailure"] = 4] = "IndeterminateFailure";
})(TelemetryResult = exports.TelemetryResult || (exports.TelemetryResult = {}));
//# sourceMappingURL=telemetry.js.map