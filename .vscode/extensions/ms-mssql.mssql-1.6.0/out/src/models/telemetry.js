'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const Utils = require("./utils");
const platform_1 = require("./platform");
var Telemetry;
(function (Telemetry) {
    let reporter;
    let userId;
    let platformInformation;
    let disabled;
    // Get the unique ID for the current user of the extension
    function getUserId() {
        return new Promise(resolve => {
            // Generate the user id if it has not been created already
            if (typeof userId === 'undefined') {
                let id = Utils.generateUserId();
                id.then(newId => {
                    userId = newId;
                    resolve(userId);
                });
            }
            else {
                resolve(userId);
            }
        });
    }
    function getPlatformInformation() {
        if (platformInformation) {
            return Promise.resolve(platformInformation);
        }
        else {
            return new Promise(resolve => {
                platform_1.PlatformInformation.GetCurrent().then(info => {
                    platformInformation = info;
                    resolve(platformInformation);
                });
            });
        }
    }
    /**
     * Disable telemetry reporting
     */
    function disable() {
        disabled = true;
    }
    Telemetry.disable = disable;
    /**
     * Initialize the telemetry reporter for use.
     */
    function initialize(context) {
        if (typeof reporter === 'undefined') {
            // Check if the user has opted out of telemetry
            if (!vscode.workspace.getConfiguration('telemetry').get('enableTelemetry', true)) {
                disable();
                return;
            }
            let packageInfo = Utils.getPackageInfo(context);
            reporter = new vscode_extension_telemetry_1.default('vscode-mssql', packageInfo.version, packageInfo.aiKey);
        }
    }
    Telemetry.initialize = initialize;
    /**
     * Filters error paths to only include source files. Exported to support testing
     */
    function FilterErrorPath(line) {
        if (line) {
            let values = line.split('/out/');
            if (values.length <= 1) {
                // Didn't match expected format
                return line;
            }
            else {
                return values[1];
            }
        }
    }
    Telemetry.FilterErrorPath = FilterErrorPath;
    /**
     * Send a telemetry event for an exception
     */
    function sendTelemetryEventForException(err, methodName) {
        try {
            let stackArray;
            let firstLine = '';
            if (err !== undefined && err.stack !== undefined) {
                stackArray = err.stack.split('\n');
                if (stackArray !== undefined && stackArray.length >= 2) {
                    firstLine = stackArray[1]; // The fist line is the error message and we don't want to send that telemetry event
                    firstLine = FilterErrorPath(firstLine);
                }
            }
            // Only adding the method name and the fist line of the stack trace. We don't add the error message because it might have PII
            Telemetry.sendTelemetryEvent('Exception', { methodName: methodName, errorLine: firstLine });
            Utils.logDebug('Unhandled Exception occurred. error: ' + err + ' method: ' + methodName);
        }
        catch (telemetryErr) {
            // If sending telemetry event fails ignore it so it won't break the extension
            Utils.logDebug('Failed to send telemetry event. error: ' + telemetryErr);
        }
    }
    Telemetry.sendTelemetryEventForException = sendTelemetryEventForException;
    /**
     * Send a telemetry event using application insights
     */
    function sendTelemetryEvent(eventName, properties, measures) {
        if (typeof disabled === 'undefined') {
            disabled = false;
        }
        if (disabled || typeof (reporter) === 'undefined') {
            // Don't do anything if telemetry is disabled
            return;
        }
        if (!properties || typeof properties === 'undefined') {
            properties = {};
        }
        // Augment the properties structure with additional common properties before sending
        Promise.all([getUserId(), getPlatformInformation()]).then(() => {
            properties['userId'] = userId;
            properties['distribution'] = (platformInformation && platformInformation.distribution) ?
                `${platformInformation.distribution.name}, ${platformInformation.distribution.version}` : '';
            reporter.sendTelemetryEvent(eventName, properties, measures);
        });
    }
    Telemetry.sendTelemetryEvent = sendTelemetryEvent;
})(Telemetry = exports.Telemetry || (exports.Telemetry = {}));
exports.default = Telemetry;

//# sourceMappingURL=telemetry.js.map
