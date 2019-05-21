"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageclient_1 = require("vscode-languageclient");
// ------------------------------- < IntelliSense Ready Event > ------------------------------------
/**
 * Event sent when the language service is finished updating after a connection
 */
var IntelliSenseReadyNotification;
(function (IntelliSenseReadyNotification) {
    IntelliSenseReadyNotification.type = new vscode_languageclient_1.NotificationType('textDocument/intelliSenseReady');
})(IntelliSenseReadyNotification = exports.IntelliSenseReadyNotification || (exports.IntelliSenseReadyNotification = {}));
/**
 * Update event parameters
 */
class IntelliSenseReadyParams {
}
exports.IntelliSenseReadyParams = IntelliSenseReadyParams;
/**
 * Notification sent when the an IntelliSense cache invalidation is requested
 */
var RebuildIntelliSenseNotification;
(function (RebuildIntelliSenseNotification) {
    RebuildIntelliSenseNotification.type = new vscode_languageclient_1.NotificationType('textDocument/rebuildIntelliSense');
})(RebuildIntelliSenseNotification = exports.RebuildIntelliSenseNotification || (exports.RebuildIntelliSenseNotification = {}));
/**
 * Rebuild IntelliSense notification parameters
 */
class RebuildIntelliSenseParams {
}
exports.RebuildIntelliSenseParams = RebuildIntelliSenseParams;
// ------------------------------- </ IntelliSense Ready Event > ----------------------------------
// ------------------------------- < Telemetry Sent Event > ------------------------------------
/**
 * Event sent when the language service send a telemetry event
 */
var TelemetryNotification;
(function (TelemetryNotification) {
    TelemetryNotification.type = new vscode_languageclient_1.NotificationType('telemetry/sqlevent');
})(TelemetryNotification = exports.TelemetryNotification || (exports.TelemetryNotification = {}));
/**
 * Update event parameters
 */
class TelemetryParams {
}
exports.TelemetryParams = TelemetryParams;
// ------------------------------- </ Telemetry Sent Event > ----------------------------------
// ------------------------------- < Status Event > ------------------------------------
/**
 * Event sent when the language service send a status change event
 */
var StatusChangedNotification;
(function (StatusChangedNotification) {
    StatusChangedNotification.type = new vscode_languageclient_1.NotificationType('textDocument/statusChanged');
})(StatusChangedNotification = exports.StatusChangedNotification || (exports.StatusChangedNotification = {}));
/**
 * Update event parameters
 */
class StatusChangeParams {
}
exports.StatusChangeParams = StatusChangeParams;
// ------------------------------- </ Status Sent Event > ----------------------------------
// ------------------------------- < Language Flavor Changed Event > ------------------------------------
/**
 * Language flavor change event parameters
 */
class DidChangeLanguageFlavorParams {
}
exports.DidChangeLanguageFlavorParams = DidChangeLanguageFlavorParams;
/**
 * Notification sent when the language flavor is changed
 */
var LanguageFlavorChangedNotification;
(function (LanguageFlavorChangedNotification) {
    LanguageFlavorChangedNotification.type = new vscode_languageclient_1.NotificationType('connection/languageflavorchanged');
})(LanguageFlavorChangedNotification = exports.LanguageFlavorChangedNotification || (exports.LanguageFlavorChangedNotification = {}));

//# sourceMappingURL=languageService.js.map
