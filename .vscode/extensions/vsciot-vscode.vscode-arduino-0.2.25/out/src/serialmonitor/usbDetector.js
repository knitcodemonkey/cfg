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
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const vscodeSettings_1 = require("../arduino/vscodeSettings");
const arduinoActivator_1 = require("../arduinoActivator");
const arduinoContext_1 = require("../arduinoContext");
const util = require("../common/util");
const Logger = require("../logger/logger");
const serialMonitor_1 = require("./serialMonitor");
const HTML_EXT = ".html";
const MARKDOWN_EXT = ".md";
class UsbDetector {
    constructor() {
        this._boardDescriptors = null;
        this._extensionRoot = null;
    }
    static getInstance() {
        if (!UsbDetector._instance) {
            UsbDetector._instance = new UsbDetector();
        }
        return UsbDetector._instance;
    }
    initialize(extensionRoot) {
        this._extensionRoot = extensionRoot;
    }
    startListening() {
        return __awaiter(this, void 0, void 0, function* () {
            const enableUSBDetection = vscodeSettings_1.VscodeSettings.getInstance().enableUSBDetection;
            if (os.platform() === "linux" || !enableUSBDetection) {
                return;
            }
            this._usbDetector = require("../../../vendor/node-usb-native").detector;
            if (!this._usbDetector) {
                return;
            }
            if (this._extensionRoot === null) {
                throw new Error("UsbDetector should be initialized before using.");
            }
            this._usbDetector.on("add", (device) => __awaiter(this, void 0, void 0, function* () {
                if (device.vendorId && device.productId) {
                    const deviceDescriptor = this.getUsbDeviceDescriptor(util.convertToHex(device.vendorId, 4), // vid and pid both are 2 bytes long.
                    util.convertToHex(device.productId, 4), this._extensionRoot);
                    // Not supported device for discovery.
                    if (!deviceDescriptor) {
                        return;
                    }
                    const boardKey = `${deviceDescriptor.package}:${deviceDescriptor.architecture}:${deviceDescriptor.id}`;
                    Logger.traceUserData("detected a board", { board: boardKey });
                    if (!arduinoContext_1.default.initialized) {
                        yield arduinoActivator_1.default.activate();
                    }
                    if (!serialMonitor_1.SerialMonitor.getInstance().initialized) {
                        serialMonitor_1.SerialMonitor.getInstance().initialize();
                    }
                    let bd = arduinoContext_1.default.boardManager.installedBoards.get(boardKey);
                    if (!bd) {
                        arduinoContext_1.default.boardManager.updatePackageIndex(deviceDescriptor.indexFile).then((shouldLoadPackageContent) => {
                            const ignoreBoards = vscodeSettings_1.VscodeSettings.getInstance().ignoreBoards || [];
                            if (ignoreBoards.indexOf(deviceDescriptor.name) >= 0) {
                                return;
                            }
                            vscode.window.showInformationMessage(`Install board package for ${deviceDescriptor.name}`, "Yes", "No", "Don't ask again").then((ans) => {
                                if (ans === "Yes") {
                                    arduinoContext_1.default.arduinoApp.installBoard(deviceDescriptor.package, deviceDescriptor.architecture)
                                        .then(() => {
                                        if (shouldLoadPackageContent) {
                                            arduinoContext_1.default.boardManager.loadPackageContent(deviceDescriptor.indexFile);
                                        }
                                        arduinoContext_1.default.boardManager.updateInstalledPlatforms(deviceDescriptor.package, deviceDescriptor.architecture);
                                        bd = arduinoContext_1.default.boardManager.installedBoards.get(boardKey);
                                        this.switchBoard(bd, deviceDescriptor);
                                    });
                                }
                                else if (ans === "Don't ask again") {
                                    ignoreBoards.push(deviceDescriptor.name);
                                    vscodeSettings_1.VscodeSettings.getInstance().ignoreBoards = ignoreBoards;
                                }
                            });
                        });
                    }
                    else if (arduinoContext_1.default.boardManager.currentBoard) {
                        const currBoard = arduinoContext_1.default.boardManager.currentBoard;
                        if (currBoard.board !== deviceDescriptor.id
                            || currBoard.platform.architecture !== deviceDescriptor.architecture
                            || currBoard.getPackageName() !== deviceDescriptor.package) {
                            const ignoreBoards = vscodeSettings_1.VscodeSettings.getInstance().ignoreBoards || [];
                            if (ignoreBoards.indexOf(deviceDescriptor.name) >= 0) {
                                return;
                            }
                            vscode.window.showInformationMessage(`Detected board ${deviceDescriptor.name}. Would you like to switch to this board type?`, "Yes", "No", "Don't ask again")
                                .then((ans) => {
                                if (ans === "Yes") {
                                    return this.switchBoard(bd, deviceDescriptor);
                                }
                                else if (ans === "Don't ask again") {
                                    ignoreBoards.push(deviceDescriptor.name);
                                    vscodeSettings_1.VscodeSettings.getInstance().ignoreBoards = ignoreBoards;
                                }
                            });
                        }
                        else {
                            const monitor = serialMonitor_1.SerialMonitor.getInstance();
                            monitor.selectSerialPort(deviceDescriptor.vid, deviceDescriptor.pid);
                            this.showReadMeAndExample(deviceDescriptor.readme);
                        }
                    }
                    else {
                        this.switchBoard(bd, deviceDescriptor);
                    }
                }
            }));
        });
    }
    stopListening() {
        if (this._usbDetector) {
            this._usbDetector.stopMonitoring();
        }
    }
    pauseListening() {
        if (this._usbDetector) {
            this._usbDetector.stopMonitoring();
        }
    }
    resumeListening() {
        if (this._usbDetector) {
            this._usbDetector.startMonitoring();
        }
        else {
            this.startListening();
        }
    }
    switchBoard(bd, deviceDescriptor, showReadMe = true) {
        arduinoContext_1.default.boardManager.doChangeBoardType(bd);
        const monitor = serialMonitor_1.SerialMonitor.getInstance();
        monitor.selectSerialPort(deviceDescriptor.vid, deviceDescriptor.pid);
        if (showReadMe) {
            this.showReadMeAndExample(deviceDescriptor.readme);
        }
    }
    showReadMeAndExample(readme) {
        if (arduinoContext_1.default.boardManager.currentBoard) {
            let readmeFilePath = path.join(arduinoContext_1.default.boardManager.currentBoard.platform.rootBoardPath, readme);
            if (!util.fileExistsSync(readmeFilePath)) {
                readmeFilePath = path.join(arduinoContext_1.default.boardManager.currentBoard.platform.rootBoardPath, "README.md");
            }
            vscode.commands.executeCommand("arduino.showExamples", true);
            if (util.fileExistsSync(readmeFilePath)) {
                if (readmeFilePath.endsWith(MARKDOWN_EXT)) {
                    vscode.commands.executeCommand("markdown.showPreview", vscode.Uri.file(readmeFilePath));
                }
                else if (readmeFilePath.endsWith(HTML_EXT)) {
                    const panel = vscode.window.createWebviewPanel("arduinoBoardReadMe", "", vscode.ViewColumn.One, {
                        enableScripts: true,
                        retainContextWhenHidden: true,
                    });
                    panel.webview.html = fs.readFileSync(readmeFilePath, "utf8");
                }
            }
        }
    }
    getUsbDeviceDescriptor(vendorId, productId, extensionRoot) {
        if (!this._boardDescriptors) {
            this._boardDescriptors = [];
            const fileContent = fs.readFileSync(path.join(extensionRoot, "misc", "usbmapping.json"), "utf8");
            const boardIndexes = JSON.parse(fileContent);
            boardIndexes.forEach((boardIndex) => {
                boardIndex.boards.forEach((board) => board.indexFile = boardIndex.index_file);
                this._boardDescriptors = this._boardDescriptors.concat(boardIndex.boards);
            });
        }
        return this._boardDescriptors.find((obj) => {
            return obj.vid === vendorId && (obj.pid === productId || (obj.pid.indexOf && obj.pid.indexOf(productId) >= 0));
        });
    }
}
exports.UsbDetector = UsbDetector;

//# sourceMappingURL=usbDetector.js.map
