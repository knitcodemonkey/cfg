// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
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
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const vscode_express_1 = require("vscode-express");
const boardProvider_1 = require("./boardProvider");
const projectInitializer_1 = require("./projectInitializer");
const DeviceOperator_1 = require("./DeviceOperator");
const AzureOperator_1 = require("./AzureOperator");
const IoTSettings_1 = require("./IoTSettings");
const configHandler_1 = require("./configHandler");
const constants_1 = require("./constants");
const impor = require('impor')(__dirname);
const exampleExplorerModule = impor('./exampleExplorer');
const ioTProjectModule = impor('./Models/IoTProject');
const telemetryModule = impor('./telemetry');
const request = impor('request-promise');
const usbDetectorModule = impor('./usbDetector');
let telemetryWorkerInitialized = false;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Use the console to output diagnostic information (console.log) and errors
        // (console.error) This line of code will only be executed once when your
        // extension is activated
        console.log('Congratulations, your extension "vscode-iot-workbench" is now active!');
        const outputChannel = vscode.window.createOutputChannel('Azure IoT Device Workbench');
        const telemetryContext = {
            properties: { result: 'Succeeded', error: '', errorMessage: '' },
            measurements: { duration: 0 }
        };
        if (vscode.workspace.workspaceFolders) {
            try {
                const iotProject = new ioTProjectModule.IoTProject(context, outputChannel, telemetryContext);
                yield iotProject.load(true);
            }
            catch (error) {
                // do nothing as we are not sure whether the project is initialized.
            }
        }
        const deviceOperator = new DeviceOperator_1.DeviceOperator();
        const azureOperator = new AzureOperator_1.AzureOperator();
        const exampleExplorer = new exampleExplorerModule.ExampleExplorer();
        const exampleSelectBoardBinder = exampleExplorer.selectBoard.bind(exampleExplorer);
        const initializeExampleBinder = exampleExplorer.initializeExample.bind(exampleExplorer);
        // The command has been defined in the package.json file
        // Now provide the implementation of the command with  registerCommand
        // The commandId parameter must match the command field in package.json
        const projectInitProvider = () => __awaiter(this, void 0, void 0, function* () {
            const projectInitializer = new projectInitializer_1.ProjectInitializer();
            const projectInitializerBinder = projectInitializer.InitializeProject.bind(projectInitializer);
            telemetryModule.callWithTelemetry(constants_1.EventNames.createNewProjectEvent, outputChannel, true, context, projectInitializerBinder);
        });
        const azureProvisionProvider = () => __awaiter(this, void 0, void 0, function* () {
            telemetryModule.callWithTelemetry(constants_1.EventNames.azureProvisionEvent, outputChannel, true, context, azureOperator.Provision);
        });
        const azureDeployProvider = () => __awaiter(this, void 0, void 0, function* () {
            telemetryModule.callWithTelemetry(constants_1.EventNames.azureDeployEvent, outputChannel, true, context, azureOperator.Deploy);
        });
        const deviceCompileProvider = () => __awaiter(this, void 0, void 0, function* () {
            telemetryModule.callWithTelemetry(constants_1.EventNames.deviceCompileEvent, outputChannel, true, context, deviceOperator.compile);
        });
        const deviceUploadProvider = () => __awaiter(this, void 0, void 0, function* () {
            telemetryModule.callWithTelemetry(constants_1.EventNames.deviceUploadEvent, outputChannel, true, context, deviceOperator.upload);
        });
        const devicePackageManager = () => __awaiter(this, void 0, void 0, function* () {
            telemetryModule.callWithTelemetry(constants_1.EventNames.devicePackageEvent, outputChannel, true, context, deviceOperator.downloadPackage);
        });
        const deviceSettingsConfigProvider = () => __awaiter(this, void 0, void 0, function* () {
            telemetryModule.callWithTelemetry(constants_1.EventNames.configDeviceSettingsEvent, outputChannel, true, context, deviceOperator.configDeviceSettings);
        });
        const examplesProvider = () => __awaiter(this, void 0, void 0, function* () {
            telemetryModule.callWithTelemetry(constants_1.EventNames.openExamplePageEvent, outputChannel, true, context, exampleSelectBoardBinder);
        });
        const examplesInitializeProvider = (name, url, boardId) => __awaiter(this, void 0, void 0, function* () {
            telemetryModule.callWithTelemetry(constants_1.EventNames.loadExampleEvent, outputChannel, true, context, initializeExampleBinder, {}, name, url, boardId);
        });
        const projectInit = vscode.commands.registerCommand('iotworkbench.initializeProject', projectInitProvider);
        const examples = vscode.commands.registerCommand('iotworkbench.examples', examplesProvider);
        const exampleInitialize = vscode.commands.registerCommand('iotworkbench.exampleInitialize', examplesInitializeProvider);
        const deviceCompile = vscode.commands.registerCommand('iotworkbench.deviceCompile', deviceCompileProvider);
        const deviceUpload = vscode.commands.registerCommand('iotworkbench.deviceUpload', deviceUploadProvider);
        const azureProvision = vscode.commands.registerCommand('iotworkbench.azureProvision', azureProvisionProvider);
        const azureDeploy = vscode.commands.registerCommand('iotworkbench.azureDeploy', azureDeployProvider);
        const deviceToolchain = vscode.commands.registerCommand('iotworkbench.installToolchain', devicePackageManager);
        const configureDevice = vscode.commands.registerCommand('iotworkbench.configureDevice', deviceSettingsConfigProvider);
        const sendTelemetry = vscode.commands.registerCommand('iotworkbench.sendTelemetry', (additionalProperties) => {
            const properties = {
                result: 'Succeeded',
                error: '',
                errorMessage: ''
            };
            for (const key of Object.keys(additionalProperties)) {
                properties[key] = additionalProperties[key];
            }
            const telemetryContext = { properties, measurements: { duration: 0 } };
            // Initialize Telemetry
            if (!telemetryWorkerInitialized) {
                telemetryModule.TelemetryWorker.Initialize(context);
                telemetryWorkerInitialized = true;
            }
            telemetryModule.TelemetryWorker.sendEvent(constants_1.EventNames.openTutorial, telemetryContext);
        });
        const openUri = vscode.commands.registerCommand('iotworkbench.openUri', (uri) => {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(uri));
        });
        const httpRequest = vscode.commands.registerCommand('iotworkbench.httpRequest', (uri) => __awaiter(this, void 0, void 0, function* () {
            const res = yield request(uri);
            return res;
        }));
        const helpProvider = new vscode_express_1.VSCExpress(context, 'views');
        const helpInit = vscode.commands.registerCommand('iotworkbench.help', () => __awaiter(this, void 0, void 0, function* () {
            const boardId = configHandler_1.ConfigHandler.get(constants_1.ConfigKey.boardId);
            if (boardId) {
                const boardProvider = new boardProvider_1.BoardProvider(context);
                const board = boardProvider.find({ id: boardId });
                if (board && board.helpUrl) {
                    yield vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(board.helpUrl));
                    return;
                }
            }
            helpProvider.open('help.html', 'Welcome - Azure IoT Device Workbench', vscode.ViewColumn.One, {
                enableScripts: true,
                enableCommandUris: true,
                retainContextWhenHidden: true
            });
            return;
        }));
        const workbenchPath = vscode.commands.registerCommand('iotworkbench.workbench', () => __awaiter(this, void 0, void 0, function* () {
            const settings = new IoTSettings_1.IoTWorkbenchSettings();
            yield settings.setWorkbenchPath();
            return;
        }));
        context.subscriptions.push(projectInit);
        context.subscriptions.push(examples);
        context.subscriptions.push(exampleInitialize);
        context.subscriptions.push(helpInit);
        context.subscriptions.push(workbenchPath);
        context.subscriptions.push(deviceCompile);
        context.subscriptions.push(deviceUpload);
        context.subscriptions.push(azureProvision);
        context.subscriptions.push(azureDeploy);
        context.subscriptions.push(deviceToolchain);
        context.subscriptions.push(configureDevice);
        context.subscriptions.push(sendTelemetry);
        context.subscriptions.push(openUri);
        context.subscriptions.push(httpRequest);
        const shownHelpPage = configHandler_1.ConfigHandler.get(constants_1.ConfigKey.shownHelpPage);
        if (!shownHelpPage) {
            const iotTools = vscode.extensions.getExtension('vsciot-vscode.azure-iot-tools');
            // If Azure IoT Tools has been installed, do not open help page
            if (iotTools) {
                return;
            }
            // Do not execute help command here
            // Help command may open board help link
            helpProvider.open('help.html', 'Welcome - Azure IoT Device Workbench', vscode.ViewColumn.One);
            configHandler_1.ConfigHandler.update(constants_1.ConfigKey.shownHelpPage, true, vscode.ConfigurationTarget.Global);
        }
        setTimeout(() => {
            // delay to detect usb
            const usbDetector = new usbDetectorModule.UsbDetector(context, outputChannel);
            usbDetector.startListening();
        }, 200);
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
    return __awaiter(this, void 0, void 0, function* () {
        if (telemetryWorkerInitialized) {
            yield telemetryModule.TelemetryWorker.dispose();
        }
    });
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map