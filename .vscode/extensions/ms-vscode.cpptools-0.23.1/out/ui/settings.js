/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All Rights Reserved.
 * See 'LICENSE' in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
var elementId = {
    activeConfig: "activeConfig",
    compilerPath: "compilerPath",
    intelliSenseMode: "intelliSenseMode",
    includePath: "includePath",
    defines: "defines",
    cStandard: "cStandard",
    cppStandard: "cppStandard",
    compilerPathInvalid: "compilerPathInvalid",
    intelliSenseModeInvalid: "intelliSenseModeInvalid",
    includePathInvalid: "includePathInvalid"
};
var SettingsApp = /** @class */ (function () {
    function SettingsApp() {
        this.updating = false;
        this.vsCodeApi = acquireVsCodeApi();
        window.addEventListener('message', this.onMessageReceived.bind(this));
        document.getElementById(elementId.activeConfig).addEventListener("change", this.onChanged.bind(this, elementId.activeConfig));
        document.getElementById(elementId.compilerPath).addEventListener("change", this.onChanged.bind(this, elementId.compilerPath));
        document.getElementById(elementId.intelliSenseMode).addEventListener("change", this.onChanged.bind(this, elementId.intelliSenseMode));
        document.getElementById(elementId.includePath).addEventListener("change", this.onChanged.bind(this, elementId.includePath));
        document.getElementById(elementId.defines).addEventListener("change", this.onChanged.bind(this, elementId.defines));
        document.getElementById(elementId.cStandard).addEventListener("change", this.onChanged.bind(this, elementId.cStandard));
        document.getElementById(elementId.cppStandard).addEventListener("change", this.onChanged.bind(this, elementId.cppStandard));
    }
    SettingsApp.prototype.onChanged = function (id) {
        if (this.updating) {
            return;
        }
        var x = document.getElementById(id);
        this.vsCodeApi.postMessage({
            command: "change",
            key: id,
            value: x.value
        });
    };
    SettingsApp.prototype.onMessageReceived = function (e) {
        var message = e.data; // The json data that the extension sent
        switch (message.command) {
            case 'updateConfig':
                this.updateConfig(message.config);
                break;
            case 'updateErrors':
                this.updateErrors(message.errors);
                break;
        }
    };
    SettingsApp.prototype.updateConfig = function (config) {
        this.updating = true;
        try {
            document.getElementById(elementId.activeConfig).value = config.name;
            document.getElementById(elementId.compilerPath).value = config.compilerPath ? config.compilerPath : "";
            document.getElementById(elementId.intelliSenseMode).value = config.intelliSenseMode ? config.intelliSenseMode : "${default}";
            document.getElementById(elementId.includePath).value =
                (config.includePath && config.includePath.length > 0) ? config.includePath.join("\n") : "";
            document.getElementById(elementId.defines).value =
                (config.defines && config.defines.length > 0) ? config.defines.join("\n") : "";
            document.getElementById(elementId.cStandard).value = config.cStandard;
            document.getElementById(elementId.cppStandard).value = config.cppStandard;
        }
        finally {
            this.updating = false;
        }
    };
    SettingsApp.prototype.updateErrors = function (errors) {
        this.updating = true;
        try {
            this.showErrorWithInfo(elementId.intelliSenseModeInvalid, errors.intelliSenseMode ? true : false, errors.intelliSenseMode);
            this.showErrorWithInfo(elementId.compilerPathInvalid, errors.compilerPath ? true : false, errors.compilerPath);
            this.showErrorWithInfo(elementId.includePathInvalid, errors.includePath ? true : false, errors.includePath);
        }
        finally {
            this.updating = false;
        }
    };
    SettingsApp.prototype.showErrorWithInfo = function (elementID, show, errorInfo) {
        document.getElementById(elementID).style.visibility = show ? "visible" : "hidden";
        document.getElementById(elementID).innerHTML = errorInfo ? errorInfo : "";
    };
    return SettingsApp;
}());
var app = new SettingsApp();
