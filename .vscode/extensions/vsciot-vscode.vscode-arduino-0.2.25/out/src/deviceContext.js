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
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const constants = require("./common/constants");
const util = require("./common/util");
const Logger = require("./logger/logger");
const constants_1 = require("./common/constants");
const workspace_1 = require("./common/workspace");
class DeviceContext {
    /**
     * @constructor
     */
    constructor() {
        this._onDidChange = new vscode.EventEmitter();
        if (vscode.workspace && workspace_1.ArduinoWorkspace.rootPath) {
            this._watcher = vscode.workspace.createFileSystemWatcher(path.join(workspace_1.ArduinoWorkspace.rootPath, constants_1.ARDUINO_CONFIG_FILE));
            // We only care about the deletion arduino.json in the .vscode folder:
            this._vscodeWatcher = vscode.workspace.createFileSystemWatcher(path.join(workspace_1.ArduinoWorkspace.rootPath, ".vscode"), true, true, false);
            this._watcher.onDidCreate(() => this.loadContext());
            this._watcher.onDidChange(() => this.loadContext());
            this._watcher.onDidDelete(() => this.loadContext());
            this._vscodeWatcher.onDidDelete(() => this.loadContext());
            this._sketchStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants.statusBarPriority.SKETCH);
            this._sketchStatusBar.command = "arduino.setSketchFile";
            this._sketchStatusBar.tooltip = "Sketch File";
        }
    }
    static getInstance() {
        return DeviceContext._deviceContext;
    }
    dispose() {
        if (this._watcher) {
            this._watcher.dispose();
        }
        if (this._vscodeWatcher) {
            this._vscodeWatcher.dispose();
        }
    }
    get extensionPath() {
        return this._extensionPath;
    }
    set extensionPath(value) {
        this._extensionPath = value;
    }
    /**
     * TODO: Current we use the Arduino default settings. For future release, this dependency might be removed
     * and the setting only depends on device.json.
     * @method
     */
    loadContext() {
        return vscode.workspace.findFiles(constants_1.ARDUINO_CONFIG_FILE, null, 1)
            .then((files) => {
            let deviceConfigJson = {};
            if (files && files.length > 0) {
                const configFile = files[0];
                deviceConfigJson = util.tryParseJSON(fs.readFileSync(configFile.fsPath, "utf8"));
                if (deviceConfigJson) {
                    this._port = deviceConfigJson.port;
                    this._board = deviceConfigJson.board;
                    this._sketch = deviceConfigJson.sketch;
                    this._configuration = deviceConfigJson.configuration;
                    this._output = deviceConfigJson.output;
                    this._debugger = deviceConfigJson["debugger"];
                    this._onDidChange.fire();
                    this._prebuild = deviceConfigJson.prebuild;
                    this._programmer = deviceConfigJson.programmer;
                }
                else {
                    Logger.notifyUserError("arduinoFileError", new Error(constants.messages.ARDUINO_FILE_ERROR));
                }
            }
            else {
                this._port = null;
                this._board = null;
                this._sketch = null;
                this._configuration = null;
                this._output = null;
                this._debugger = null;
                this._onDidChange.fire();
                this._prebuild = null;
                this._programmer = null;
            }
            return this;
        }, (reason) => {
            // Workaround for change in API.
            // vscode.workspace.findFiles() for some reason now throws an error ehn path does not exist
            // vscode.window.showErrorMessage(reason.toString());
            // Logger.notifyUserError("arduinoFileUnhandleError", new Error(reason.toString()));
            // Workaround for change in API, populate required props for arduino.json
            this._port = null;
            this._board = null;
            this._sketch = null;
            this._configuration = null;
            this._output = null;
            this._debugger = null;
            this._onDidChange.fire();
            this._prebuild = null;
            this._programmer = null;
            return this;
        });
    }
    showStatusBar() {
        if (!this._sketch) {
            return false;
        }
        this._sketchStatusBar.text = this._sketch;
        this._sketchStatusBar.show();
    }
    saveContext() {
        if (!workspace_1.ArduinoWorkspace.rootPath) {
            return;
        }
        const deviceConfigFile = path.join(workspace_1.ArduinoWorkspace.rootPath, constants_1.ARDUINO_CONFIG_FILE);
        let deviceConfigJson = {};
        if (util.fileExistsSync(deviceConfigFile)) {
            deviceConfigJson = util.tryParseJSON(fs.readFileSync(deviceConfigFile, "utf8"));
        }
        if (!deviceConfigJson) {
            Logger.notifyUserError("arduinoFileError", new Error(constants.messages.ARDUINO_FILE_ERROR));
            return;
        }
        deviceConfigJson.sketch = this.sketch;
        deviceConfigJson.port = this.port;
        deviceConfigJson.board = this.board;
        deviceConfigJson.output = this.output;
        deviceConfigJson["debugger"] = this.debugger_;
        deviceConfigJson.configuration = this.configuration;
        deviceConfigJson.programmer = this.programmer;
        util.mkdirRecursivelySync(path.dirname(deviceConfigFile));
        fs.writeFileSync(deviceConfigFile, JSON.stringify(deviceConfigJson, (key, value) => {
            if (value === null) {
                return undefined;
            }
            return value;
        }, 4));
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    get port() {
        return this._port;
    }
    set port(value) {
        this._port = value;
        this.saveContext();
    }
    get board() {
        return this._board;
    }
    set board(value) {
        this._board = value;
        this.saveContext();
    }
    get sketch() {
        return this._sketch;
    }
    set sketch(value) {
        this._sketch = value;
        this.saveContext();
    }
    get prebuild() {
        return this._prebuild ? this._prebuild.trim() : "";
    }
    get output() {
        return this._output;
    }
    set output(value) {
        this._output = value;
        this.saveContext();
    }
    get debugger_() {
        return this._debugger;
    }
    set debugger_(value) {
        this._debugger = value;
        this.saveContext();
    }
    get configuration() {
        return this._configuration;
    }
    set configuration(value) {
        this._configuration = value;
        this.saveContext();
    }
    get programmer() {
        return this._programmer;
    }
    set programmer(value) {
        this._programmer = value;
        this.saveContext();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (workspace_1.ArduinoWorkspace.rootPath && util.fileExistsSync(path.join(workspace_1.ArduinoWorkspace.rootPath, constants_1.ARDUINO_CONFIG_FILE))) {
                vscode.window.showInformationMessage("Arduino.json is already generated.");
                return;
            }
            else {
                if (!workspace_1.ArduinoWorkspace.rootPath) {
                    vscode.window.showInformationMessage("Please open an folder first.");
                    return;
                }
                yield this.resolveMainSketch();
                if (this.sketch) {
                    yield vscode.commands.executeCommand("arduino.changeBoardType");
                    vscode.window.showInformationMessage("The workspace is initialized with the Arduino extension support.");
                }
                else {
                    vscode.window.showInformationMessage("No *.ino sketch file was found or selected, so skip initialize command.");
                }
            }
        });
    }
    resolveMainSketch() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield vscode.workspace.findFiles("**/*.ino", null)
                .then((fileUris) => __awaiter(this, void 0, void 0, function* () {
                if (fileUris.length === 0) {
                    let newSketchFileName = yield vscode.window.showInputBox({
                        value: "app.ino",
                        prompt: "No .ino file was found on workspace, initialize sketch first",
                        placeHolder: "Input the sketch file name",
                        validateInput: (value) => {
                            if (value && /^\w+\.((ino)|(cpp)|c)$/.test(value.trim())) {
                                return null;
                            }
                            else {
                                return "Invalid sketch file name. Should be *.ino/*.cpp/*.c";
                            }
                        },
                    });
                    newSketchFileName = (newSketchFileName && newSketchFileName.trim()) || "";
                    if (newSketchFileName) {
                        const snippets = fs.readFileSync(path.join(this.extensionPath, "snippets", "sample.ino"));
                        fs.writeFileSync(path.join(workspace_1.ArduinoWorkspace.rootPath, newSketchFileName), snippets);
                        this.sketch = newSketchFileName;
                        // Open the new sketch file.
                        const textDocument = yield vscode.workspace.openTextDocument(path.join(workspace_1.ArduinoWorkspace.rootPath, newSketchFileName));
                        vscode.window.showTextDocument(textDocument, vscode.ViewColumn.One, true);
                    }
                    else {
                        this._sketch = undefined;
                    }
                }
                else if (fileUris.length === 1) {
                    this.sketch = path.relative(workspace_1.ArduinoWorkspace.rootPath, fileUris[0].fsPath);
                }
                else if (fileUris.length > 1) {
                    const chosen = yield vscode.window.showQuickPick(fileUris.map((fileUri) => {
                        return {
                            label: path.relative(workspace_1.ArduinoWorkspace.rootPath, fileUri.fsPath),
                            description: fileUri.fsPath,
                        };
                    }), { placeHolder: "Select the main sketch file" });
                    if (chosen && chosen.label) {
                        this.sketch = chosen.label;
                    }
                }
            }));
        });
    }
}
DeviceContext._deviceContext = new DeviceContext();
exports.DeviceContext = DeviceContext;

//# sourceMappingURL=deviceContext.js.map
