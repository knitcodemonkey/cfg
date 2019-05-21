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
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const exceptionHelper_1 = require("./exceptionHelper");
const nsat_1 = require("./nsat");
function getPackageInfo(context) {
    const extensionPackage = require(context.asAbsolutePath('./package.json'));
    if (extensionPackage) {
        const packageInfo = {
            name: extensionPackage.name,
            version: extensionPackage.version,
            aiKey: extensionPackage.aiKey,
        };
        return packageInfo;
    }
    return undefined;
}
class TelemetryWorker {
    static sendEvent(eventName, telemetryContext) {
        if (this._reporter) {
            this._reporter.sendTelemetryEvent(eventName, telemetryContext.properties, telemetryContext.measurements);
        }
    }
    static dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._reporter) {
                yield this._reporter.dispose();
            }
        });
    }
    static Initialize(context) {
        const packageInfo = getPackageInfo(context);
        if (!packageInfo) {
            console.log('Unable to initialize telemetry');
            return;
        }
        if (!packageInfo.aiKey) {
            console.log('Unable to initialize telemetry, please make sure AIKey is set in package.json');
            return;
        }
        this._reporter = new vscode_extension_telemetry_1.default(packageInfo.name, packageInfo.version, packageInfo.aiKey);
    }
}
exports.TelemetryWorker = TelemetryWorker;
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
function callWithTelemetry(eventName, outputChannel, enableSurvey, context, callback, 
// tslint:disable-next-line:no-any
additionalProperties, 
// tslint:disable-next-line:no-any
...args) {
    return __awaiter(this, void 0, void 0, function* () {
        const start = Date.now();
        const properties = { result: 'Succeeded', error: '', errorMessage: '' };
        if (additionalProperties) {
            for (const key of Object.keys(additionalProperties)) {
                if (!properties.hasOwnProperty(key)) {
                    properties[key] = additionalProperties[key];
                }
            }
        }
        const telemetryContext = { properties, measurements: { duration: 0 } };
        try {
            return yield Promise.resolve(callback.apply(null, [context, outputChannel, telemetryContext, ...args]));
        }
        catch (error) {
            telemetryContext.properties.result = 'Failed';
            telemetryContext.properties.error = error.errorType;
            telemetryContext.properties.errorMessage = error.message;
            exceptionHelper_1.ExceptionHelper.logError(outputChannel, error, true);
        }
        finally {
            const end = Date.now();
            telemetryContext.measurements.duration = (end - start) / 1000;
            try {
                TelemetryWorker.sendEvent(eventName, telemetryContext);
                if (enableSurvey) {
                    nsat_1.NSAT.takeSurvey(context);
                }
            }
            catch (_a) {
                // If sending telemetry failed, skip the error to avoid blocking user.
            }
        }
    });
}
exports.callWithTelemetry = callWithTelemetry;
//# sourceMappingURL=telemetry.js.map