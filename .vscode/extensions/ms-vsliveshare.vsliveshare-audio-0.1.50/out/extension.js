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
const vscode = require("vscode");
const app_1 = require("./app");
const vsls = require("vsls/vscode");
const extensionutil_1 = require("./extensionutil");
const traceSource_1 = require("./tracing/traceSource");
const telemetry_1 = require("./telemetry/telemetry");
const telemetryStrings_1 = require("./telemetry/telemetryStrings");
const downloader_1 = require("./downloader");
const { displayName } = require('../package.json');
let app = null;
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let activationEvent = telemetry_1.Telemetry.startTimedEvent(telemetryStrings_1.TelemetryEventNames.ACTIVATE_EXTENSION);
        context.subscriptions.push(telemetry_1.Telemetry.reporter);
        try {
            yield extensionutil_1.ExtensionUtil.Init(context);
            let liveShare = yield vsls.getApiAsync();
            if (!liveShare) {
                vscode.window.showInformationMessage('VS LiveShare Audio extension requires VS Live Share extension to be installed. Please install VS Live Share extension or update to latest');
                return false;
            }
            const liveShareExtension = vscode.extensions.getExtension('ms-vsliveshare.vsliveshare-audio');
            const installationResult = yield downloader_1.ExternalDownloader.ensureRuntimeDependenciesAsync(liveShareExtension);
            // failed to install dependecies
            if (installationResult === downloader_1.EnsureRuntimeDependenciesResult.Failure) {
                activationEvent.end(telemetry_1.TelemetryResult.UserFailure, 'Extension activation failed - download runtime dependencies.');
                vscode.window.showErrorMessage(`${displayName} was unable to download needed dependencies to finish installation. Ensure you have network connectivity and restart VS Code to retry.`);
                return;
            }
            app = new app_1.App(context, liveShare);
        }
        catch (e) {
            const telemetryMessage = 'Extension activation failed. ' + e.message;
            activationEvent.end(telemetry_1.TelemetryResult.Failure, telemetryMessage);
            telemetry_1.Telemetry.sendActivateExtensionFault(telemetry_1.FaultType.Error, telemetryMessage, e, activationEvent);
            throw e;
        }
        activationEvent.end(telemetry_1.TelemetryResult.Success, 'Extension activation success.');
    });
}
exports.activate = activate;
function deactivate() {
    return __awaiter(this, void 0, void 0, function* () {
        let deactivateEvent = telemetry_1.Telemetry.startTimedEvent(telemetryStrings_1.TelemetryEventNames.DEACTIVATE_EXTENSION);
        try {
            traceSource_1.defaultTraceSource.info(`Deactivating extension`);
            yield new Promise((resolve, reject) => {
                setTimeout(() => {
                    traceSource_1.defaultTraceSource.info('Extension deactivation complete');
                    resolve();
                }, 5000);
                app.dispose();
            });
        }
        catch (e) {
            const telemetryMessage = 'Extension deactivation failed. ' + e.message;
            deactivateEvent.end(telemetry_1.TelemetryResult.Failure, telemetryMessage);
            telemetry_1.Telemetry.sendDeactivateExtensionFault(telemetry_1.FaultType.Error, telemetryMessage, e, deactivateEvent);
            throw e;
        }
        deactivateEvent.end(telemetry_1.TelemetryResult.Success, 'Extension deactivation success.');
    });
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map