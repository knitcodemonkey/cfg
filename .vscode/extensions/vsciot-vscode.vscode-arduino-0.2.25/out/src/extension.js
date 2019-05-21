"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const Uuid = require("uuid/v4");
const vscode = require("vscode");
const constants = require("./common/constants");
const arduinoContentProvider_1 = require("./arduino/arduinoContentProvider");
const arduinoActivator_1 = require("./arduinoActivator");
const arduinoContext_1 = require("./arduinoContext");
const constants_1 = require("./common/constants");
const platform_1 = require("./common/platform");
const util = require("./common/util");
const workspace_1 = require("./common/workspace");
const configurationProvider_1 = require("./debug/configurationProvider");
const deviceContext_1 = require("./deviceContext");
const completionProvider_1 = require("./langService/completionProvider");
const Logger = require("./logger/logger");
const nsat_1 = require("./nsat");
const serialMonitor_1 = require("./serialmonitor/serialMonitor");
const usbDetector_1 = require("./serialmonitor/usbDetector");
const status = {};
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        Logger.configure(context);
        const activeGuid = Uuid().replace(/-/g, "");
        Logger.traceUserData("start-activate-extension", { correlationId: activeGuid });
        // Show a warning message if the working file is not under the workspace folder.
        // People should know the extension might not work appropriately, they should look for the doc to get started.
        const openEditor = vscode.window.activeTextEditor;
        if (openEditor && openEditor.document.fileName.endsWith(".ino")) {
            const workingFile = path.normalize(openEditor.document.fileName);
            const workspaceFolder = (vscode.workspace && workspace_1.ArduinoWorkspace.rootPath) || "";
            if (!workspaceFolder || workingFile.indexOf(path.normalize(workspaceFolder)) < 0) {
                vscode.window.showWarningMessage(`The working file "${workingFile}" is not under the workspace folder, ` +
                    "the arduino extension might not work appropriately.");
            }
        }
        const deviceContext = deviceContext_1.DeviceContext.getInstance();
        deviceContext.extensionPath = context.extensionPath;
        context.subscriptions.push(deviceContext);
        const arduinoManagerProvider = new arduinoContentProvider_1.ArduinoContentProvider(context.extensionPath);
        context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(constants_1.ARDUINO_MANAGER_PROTOCOL, arduinoManagerProvider));
        const commandExecution = (command, commandBody, args, getUserData) => __awaiter(this, void 0, void 0, function* () {
            const guid = Uuid().replace(/\-/g, "");
            Logger.traceUserData(`start-command-` + command, { correlationId: guid });
            const timer1 = new Logger.Timer();
            let telemetryResult;
            try {
                let result = commandBody(...args);
                if (result) {
                    result = yield Promise.resolve(result);
                }
                if (result && result.telemetry) {
                    telemetryResult = result;
                }
                else if (getUserData) {
                    telemetryResult = getUserData();
                }
            }
            catch (error) {
                Logger.traceError("executeCommandError", error, { correlationId: guid, command });
            }
            Logger.traceUserData(`end-command-` + command, Object.assign({}, telemetryResult, { correlationId: guid, duration: timer1.end() }));
            nsat_1.NSAT.takeSurvey(context);
        });
        const registerArduinoCommand = (command, commandBody, getUserData) => {
            return context.subscriptions.push(vscode.commands.registerCommand(command, (...args) => __awaiter(this, void 0, void 0, function* () {
                if (!arduinoContext_1.default.initialized) {
                    yield arduinoActivator_1.default.activate();
                }
                if (!serialMonitor_1.SerialMonitor.getInstance().initialized) {
                    serialMonitor_1.SerialMonitor.getInstance().initialize();
                }
                const arduinoPath = arduinoContext_1.default.arduinoApp.settings.arduinoPath;
                const commandPath = arduinoContext_1.default.arduinoApp.settings.commandPath;
                if (!arduinoPath || !platform_1.validateArduinoPath(arduinoPath)) { // Pop up vscode User Settings page when cannot resolve arduino path.
                    Logger.notifyUserError("InvalidArduinoPath", new Error(constants.messages.INVALID_ARDUINO_PATH));
                    vscode.commands.executeCommand("workbench.action.openGlobalSettings");
                }
                else if (!commandPath || !util.fileExistsSync(commandPath)) {
                    Logger.notifyUserError("InvalidCommandPath", new Error(constants.messages.INVALID_COMMAND_PATH + commandPath));
                }
                else {
                    yield commandExecution(command, commandBody, args, getUserData);
                }
            })));
        };
        const registerNonArduinoCommand = (command, commandBody, getUserData) => {
            return context.subscriptions.push(vscode.commands.registerCommand(command, (...args) => __awaiter(this, void 0, void 0, function* () {
                if (!serialMonitor_1.SerialMonitor.getInstance().initialized) {
                    serialMonitor_1.SerialMonitor.getInstance().initialize();
                }
                yield commandExecution(command, commandBody, args, getUserData);
            })));
        };
        registerArduinoCommand("arduino.showBoardManager", () => __awaiter(this, void 0, void 0, function* () {
            const panel = vscode.window.createWebviewPanel("arduinoBoardManager", "Arduino Board Manager", vscode.ViewColumn.Two, {
                enableScripts: true,
                retainContextWhenHidden: true,
            });
            panel.webview.html = yield arduinoManagerProvider.provideTextDocumentContent(constants_1.BOARD_MANAGER_URI);
        }));
        registerArduinoCommand("arduino.showLibraryManager", () => __awaiter(this, void 0, void 0, function* () {
            const panel = vscode.window.createWebviewPanel("arduinoLibraryManager", "Arduino Library Manager", vscode.ViewColumn.Two, {
                enableScripts: true,
                retainContextWhenHidden: true,
            });
            panel.webview.html = yield arduinoManagerProvider.provideTextDocumentContent(constants_1.LIBRARY_MANAGER_URI);
        }));
        registerArduinoCommand("arduino.showBoardConfig", () => __awaiter(this, void 0, void 0, function* () {
            const panel = vscode.window.createWebviewPanel("arduinoBoardConfiguration", "Arduino Board Configuration", vscode.ViewColumn.Two, {
                enableScripts: true,
                retainContextWhenHidden: true,
            });
            panel.webview.html = yield arduinoManagerProvider.provideTextDocumentContent(constants_1.BOARD_CONFIG_URI);
        }));
        registerArduinoCommand("arduino.showExamples", (forceRefresh = false) => __awaiter(this, void 0, void 0, function* () {
            vscode.commands.executeCommand("setContext", "vscode-arduino:showExampleExplorer", true);
            if (forceRefresh) {
                vscode.commands.executeCommand("arduino.reloadExample");
            }
            const panel = vscode.window.createWebviewPanel("arduinoExamples", "Arduino Examples", vscode.ViewColumn.Two, {
                enableScripts: true,
                retainContextWhenHidden: true,
            });
            panel.webview.html = yield arduinoManagerProvider.provideTextDocumentContent(constants_1.EXAMPLES_URI);
        }));
        // change board type
        registerArduinoCommand("arduino.changeBoardType", () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield arduinoContext_1.default.boardManager.changeBoardType();
            }
            catch (exception) {
                Logger.error(exception.message);
            }
            arduinoManagerProvider.update(constants_1.LIBRARY_MANAGER_URI);
            arduinoManagerProvider.update(constants_1.EXAMPLES_URI);
        }), () => {
            return { board: arduinoContext_1.default.boardManager.currentBoard.name };
        });
        registerArduinoCommand("arduino.reloadExample", () => {
            arduinoManagerProvider.update(constants_1.EXAMPLES_URI);
        }, () => {
            return { board: (arduinoContext_1.default.boardManager.currentBoard === null) ? null : arduinoContext_1.default.boardManager.currentBoard.name };
        });
        registerArduinoCommand("arduino.initialize", () => __awaiter(this, void 0, void 0, function* () { return yield deviceContext.initialize(); }));
        registerArduinoCommand("arduino.verify", () => __awaiter(this, void 0, void 0, function* () {
            if (!status.compile) {
                status.compile = "verify";
                try {
                    yield vscode.window.withProgress({
                        location: vscode.ProgressLocation.Window,
                        title: "Arduino: Verifying...",
                    }, () => __awaiter(this, void 0, void 0, function* () {
                        yield arduinoContext_1.default.arduinoApp.verify();
                    }));
                }
                catch (ex) {
                }
                delete status.compile;
            }
        }), () => {
            return { board: (arduinoContext_1.default.boardManager.currentBoard === null) ? null : arduinoContext_1.default.boardManager.currentBoard.name };
        });
        registerArduinoCommand("arduino.upload", () => __awaiter(this, void 0, void 0, function* () {
            if (!status.compile) {
                status.compile = "upload";
                try {
                    yield vscode.window.withProgress({
                        location: vscode.ProgressLocation.Window,
                        title: "Arduino: Uploading...",
                    }, () => __awaiter(this, void 0, void 0, function* () {
                        yield arduinoContext_1.default.arduinoApp.upload();
                    }));
                }
                catch (ex) {
                }
                delete status.compile;
            }
        }), () => {
            return { board: arduinoContext_1.default.boardManager.currentBoard.name };
        });
        registerArduinoCommand("arduino.setSketchFile", () => __awaiter(this, void 0, void 0, function* () {
            const sketchFileName = deviceContext.sketch;
            const newSketchFileName = yield vscode.window.showInputBox({
                placeHolder: sketchFileName,
                validateInput: (value) => {
                    if (value && /\.((ino)|(cpp)|c)$/.test(value.trim())) {
                        return null;
                    }
                    else {
                        return "Invalid sketch file name. Should be *.ino/*.cpp/*.c";
                    }
                },
            });
            if (!newSketchFileName) {
                return;
            }
            deviceContext.sketch = newSketchFileName;
            deviceContext.showStatusBar();
        }));
        registerArduinoCommand("arduino.uploadUsingProgrammer", () => __awaiter(this, void 0, void 0, function* () {
            if (!status.compile) {
                status.compile = "upload";
                try {
                    yield arduinoContext_1.default.arduinoApp.uploadUsingProgrammer();
                }
                catch (ex) {
                }
                delete status.compile;
            }
        }), () => {
            return { board: arduinoContext_1.default.boardManager.currentBoard.name };
        });
        registerArduinoCommand("arduino.selectProgrammer", () => __awaiter(this, void 0, void 0, function* () {
            if (!status.compile) {
                status.compile = "upload";
                try {
                    yield arduinoContext_1.default.arduinoApp.programmerManager.selectProgrammer();
                }
                catch (ex) {
                }
                delete status.compile;
            }
        }), () => {
            return { board: (arduinoContext_1.default.boardManager.currentBoard === null) ? null : arduinoContext_1.default.boardManager.currentBoard.name };
        });
        registerArduinoCommand("arduino.addLibPath", (path) => arduinoContext_1.default.arduinoApp.addLibPath(path));
        registerArduinoCommand("arduino.openExample", (path) => arduinoContext_1.default.arduinoApp.openExample(path));
        registerArduinoCommand("arduino.loadPackages", () => __awaiter(this, void 0, void 0, function* () { return yield arduinoContext_1.default.boardManager.loadPackages(true); }));
        registerArduinoCommand("arduino.installBoard", (packageName, arch, version = "") => __awaiter(this, void 0, void 0, function* () {
            let installed = false;
            const installedBoards = arduinoContext_1.default.boardManager.installedBoards;
            installedBoards.forEach((board, key) => {
                let _packageName;
                if (board.platform.package && board.platform.package.name) {
                    _packageName = board.platform.package.name;
                }
                else {
                    _packageName = board.platform.packageName;
                }
                if (packageName === _packageName &&
                    arch === board.platform.architecture &&
                    (!version || version === board.platform.installedVersion)) {
                    installed = true;
                }
            });
            if (!installed) {
                yield arduinoContext_1.default.boardManager.loadPackages(true);
                yield arduinoContext_1.default.arduinoApp.installBoard(packageName, arch, version);
            }
            return;
        }));
        // serial monitor commands
        const serialMonitor = serialMonitor_1.SerialMonitor.getInstance();
        context.subscriptions.push(serialMonitor);
        registerNonArduinoCommand("arduino.selectSerialPort", () => serialMonitor.selectSerialPort(null, null));
        registerNonArduinoCommand("arduino.openSerialMonitor", () => serialMonitor.openSerialMonitor());
        registerNonArduinoCommand("arduino.changeBaudRate", () => serialMonitor.changeBaudRate());
        registerNonArduinoCommand("arduino.changeEnding", () => serialMonitor.changeEnding());
        registerNonArduinoCommand("arduino.sendMessageToSerialPort", () => serialMonitor.sendMessageToSerialPort());
        registerNonArduinoCommand("arduino.closeSerialMonitor", (port) => serialMonitor.closeSerialMonitor(port));
        const completionProvider = new completionProvider_1.CompletionProvider();
        context.subscriptions.push(vscode.languages.registerCompletionItemProvider(constants_1.ARDUINO_MODE, completionProvider, "<", '"', "."));
        context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider("arduino", new configurationProvider_1.ArduinoDebugConfigurationProvider()));
        usbDetector_1.UsbDetector.getInstance().initialize(context.extensionPath);
        usbDetector_1.UsbDetector.getInstance().startListening();
        if (workspace_1.ArduinoWorkspace.rootPath && (util.fileExistsSync(path.join(workspace_1.ArduinoWorkspace.rootPath, constants_1.ARDUINO_CONFIG_FILE))
            || (openEditor && openEditor.document.fileName.endsWith(".ino")))) {
            (() => __awaiter(this, void 0, void 0, function* () {
                if (!arduinoContext_1.default.initialized) {
                    yield arduinoActivator_1.default.activate();
                }
                if (!serialMonitor_1.SerialMonitor.getInstance().initialized) {
                    serialMonitor_1.SerialMonitor.getInstance().initialize();
                }
                arduinoContext_1.default.boardManager.updateStatusBar(true);
                vscode.commands.executeCommand("setContext", "vscode-arduino:showExampleExplorer", true);
            }))();
        }
        vscode.window.onDidChangeActiveTextEditor(() => __awaiter(this, void 0, void 0, function* () {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && ((path.basename(activeEditor.document.fileName) === "arduino.json"
                && path.basename(path.dirname(activeEditor.document.fileName)) === ".vscode")
                || activeEditor.document.fileName.endsWith(".ino"))) {
                if (!arduinoContext_1.default.initialized) {
                    yield arduinoActivator_1.default.activate();
                }
                if (!serialMonitor_1.SerialMonitor.getInstance().initialized) {
                    serialMonitor_1.SerialMonitor.getInstance().initialize();
                }
                arduinoContext_1.default.boardManager.updateStatusBar(true);
                vscode.commands.executeCommand("setContext", "vscode-arduino:showExampleExplorer", true);
            }
        }));
        Logger.traceUserData("end-activate-extension", { correlationId: activeGuid });
    });
}
exports.activate = activate;
function deactivate() {
    return __awaiter(this, void 0, void 0, function* () {
        const monitor = serialMonitor_1.SerialMonitor.getInstance();
        yield monitor.closeSerialMonitor(null, false);
        usbDetector_1.UsbDetector.getInstance().stopListening();
        Logger.traceUserData("deactivate-extension");
    });
}
exports.deactivate = deactivate;

//# sourceMappingURL=extension.js.map
