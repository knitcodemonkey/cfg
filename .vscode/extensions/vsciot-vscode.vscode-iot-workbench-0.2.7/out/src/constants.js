"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
class ConfigKey {
}
ConfigKey.devicePath = 'DevicePath';
ConfigKey.iotHubConnectionString = 'iothubConnectionString';
ConfigKey.iotHubDeviceConnectionString = 'iothubDeviceConnectionString';
ConfigKey.eventHubConnectionString = 'eventHubConnectionString';
ConfigKey.eventHubConnectionPath = 'eventHubConnectionPath';
ConfigKey.functionAppId = 'functionAppId';
ConfigKey.functionPath = 'FunctionPath';
ConfigKey.boardId = 'BoardId';
ConfigKey.asaPath = 'StreamAnalyticsPath';
ConfigKey.shownHelpPage = 'ShownHelpPage';
exports.ConfigKey = ConfigKey;
class EventNames {
}
EventNames.createNewProjectEvent = 'IoTWorkbench.NewProject';
EventNames.azureProvisionEvent = 'IoTWorkbench.AzureProvision';
EventNames.azureDeployEvent = 'IoTWorkbench.AzureDeploy';
EventNames.createAzureFunctionsEvent = 'IoTWorkbench.CreateAzureFunctions';
EventNames.deviceCompileEvent = 'IoTWorkbench.DeviceCompile';
EventNames.deviceUploadEvent = 'IoTWorkbench.DeviceUpload';
EventNames.devicePackageEvent = 'IoTWorkbench.DevicePackage';
EventNames.configDeviceSettingsEvent = 'IoTWorkbench.ConfigDeviceSettingsEvent';
EventNames.openExamplePageEvent = 'IoTWorkbench.OpenExamplePage';
EventNames.loadExampleEvent = 'IoTWorkbench.loadExample';
EventNames.detectBoard = 'IoTWorkbench.DetectBoard';
EventNames.generateOtaCrc = 'IoTWorkbench.GenerateOtaCrc';
EventNames.nsatsurvery = 'IoTWorkbench.NSATSurvey';
EventNames.selectSubscription = 'IoTWorkbench.SelectSubscription';
EventNames.openTutorial = 'IoTWorkbench.OpenTutorial';
EventNames.projectLoadEvent = 'IoTWorkbench.ProjectLoadEvent';
exports.EventNames = EventNames;
class FileNames {
}
FileNames.templateFileName = 'template.json';
FileNames.boardListFileName = 'boardlist.json';
FileNames.resourcesFolderName = 'resources';
FileNames.iotworkbenchprojectFileName = '.iotworkbenchproject';
FileNames.settingsJsonFileName = 'settings.json';
FileNames.vscodeSettingsFolderName = '.vscode';
FileNames.workspaceExtensionName = '.code-workspace';
exports.FileNames = FileNames;
var AzureFunctionsLanguage;
(function (AzureFunctionsLanguage) {
    AzureFunctionsLanguage["CSharpScript"] = "C#Script";
    AzureFunctionsLanguage["JavaScript"] = "JavaScript";
    AzureFunctionsLanguage["CSharpLibrary"] = "C#";
})(AzureFunctionsLanguage = exports.AzureFunctionsLanguage || (exports.AzureFunctionsLanguage = {}));
class AzureComponentsStorage {
}
AzureComponentsStorage.folderName = '.azurecomponent';
AzureComponentsStorage.fileName = 'azureconfig.json';
exports.AzureComponentsStorage = AzureComponentsStorage;
class GlobalConstants {
}
GlobalConstants.extensionId = 'vsciot-vscode.vscode-iot-workbench';
exports.GlobalConstants = GlobalConstants;
class DependentExtensions {
}
DependentExtensions.azureFunctions = 'ms-azuretools.vscode-azurefunctions';
DependentExtensions.arduino = 'vsciot-vscode.vscode-arduino';
exports.DependentExtensions = DependentExtensions;
//# sourceMappingURL=constants.js.map