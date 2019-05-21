"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-plus");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const configHandler_1 = require("../configHandler");
const constants_1 = require("../constants");
const Component_1 = require("./Interfaces/Component");
const OTA_1 = require("./OTA");
const constants = {
    defaultSketchFileName: 'device.ino',
    arduinoJsonFileName: 'arduino.json',
    cppPropertiesFileName: 'c_cpp_properties.json',
    cppPropertiesFileNameMac: 'c_cpp_properties_macos.json',
    cppPropertiesFileNameWin: 'c_cpp_properties_win32.json',
    outputPath: './.build'
};
class ArduinoDeviceBase {
    constructor(context, devicePath, deviceType) {
        this.deviceType = deviceType;
        this.componentType = Component_1.ComponentType.Device;
        this.deviceFolder = devicePath;
        this.extensionContext = context;
        this.vscodeFolderPath =
            path.join(this.deviceFolder, constants_1.FileNames.vscodeSettingsFolderName);
    }
    getDeviceType() {
        return this.deviceType;
    }
    getComponentType() {
        return this.componentType;
    }
    static isAvailable() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!vscode.extensions.getExtension(constants_1.DependentExtensions.arduino)) {
                const choice = yield vscode.window.showInformationMessage('Arduino extension is required for the current project. Do you want to install it from marketplace?', 'Yes', 'No');
                if (choice === 'Yes') {
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('vscode:extension/' + constants_1.DependentExtensions.arduino));
                }
                return false;
            }
            return true;
        });
    }
    checkPrerequisites() {
        return __awaiter(this, void 0, void 0, function* () {
            const isArduinoExtensionAvailable = yield ArduinoDeviceBase.isAvailable();
            if (!isArduinoExtensionAvailable) {
                return false;
            }
            return true;
        });
    }
    compile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.preCompileAction();
                if (!result) {
                    return false;
                }
                yield vscode.commands.executeCommand('arduino.verify');
                return true;
            }
            catch (error) {
                throw error;
            }
        });
    }
    upload() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.preUploadAction();
                if (!result) {
                    return false;
                }
                yield vscode.commands.executeCommand('arduino.upload');
                return true;
            }
            catch (error) {
                throw error;
            }
        });
    }
    // Helper functions:
    generateCommonFiles() {
        const deviceFolderPath = this.deviceFolder;
        if (!fs.existsSync(deviceFolderPath)) {
            throw new Error('Unable to find the device folder inside the project.');
        }
        try {
            const iotworkbenchprojectFilePath = path.join(deviceFolderPath, constants_1.FileNames.iotworkbenchprojectFileName);
            fs.writeFileSync(iotworkbenchprojectFilePath, ' ');
        }
        catch (error) {
            throw new Error(`Device: create iotworkbenchproject file failed: ${error.message}`);
        }
        if (!fs.existsSync(this.vscodeFolderPath)) {
            fs.mkdirSync(this.vscodeFolderPath);
        }
    }
    generateCppPropertiesFile(board) {
        // Create c_cpp_properties.json file
        const cppPropertiesFilePath = path.join(this.vscodeFolderPath, constants.cppPropertiesFileName);
        if (fs.existsSync(cppPropertiesFilePath)) {
            return;
        }
        try {
            const plat = os.platform();
            if (plat === 'win32') {
                const propertiesFilePathWin32 = this.extensionContext.asAbsolutePath(path.join(constants_1.FileNames.resourcesFolderName, board.id, constants.cppPropertiesFileNameWin));
                const propertiesContentWin32 = fs.readFileSync(propertiesFilePathWin32).toString();
                const rootPathPattern = /{ROOTPATH}/g;
                const versionPattern = /{VERSION}/g;
                const homeDir = os.homedir();
                const localAppData = path.join(homeDir, 'AppData', 'Local');
                const replaceStr = propertiesContentWin32
                    .replace(rootPathPattern, localAppData.replace(/\\/g, '\\\\'))
                    .replace(versionPattern, this.version);
                fs.writeFileSync(cppPropertiesFilePath, replaceStr);
            }
            // TODO: Let's use the same file for Linux and MacOS for now. Need to
            // revisit this part.
            else {
                const propertiesFilePathMac = this.extensionContext.asAbsolutePath(path.join(constants_1.FileNames.resourcesFolderName, board.id, constants.cppPropertiesFileNameMac));
                const propertiesContentMac = fs.readFileSync(propertiesFilePathMac).toString();
                fs.writeFileSync(cppPropertiesFilePath, propertiesContentMac);
            }
        }
        catch (error) {
            throw new Error(`Create cpp properties file failed: ${error.message}`);
        }
    }
    generateSketchFile(sketchTemplateFileName, board, boardInfo, boardConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create arduino.json config file
            const arduinoJSONFilePath = path.join(this.vscodeFolderPath, constants.arduinoJsonFileName);
            const arduinoJSONObj = {
                'board': boardInfo,
                'sketch': constants.defaultSketchFileName,
                'configuration': boardConfig,
                'output': constants.outputPath
            };
            try {
                fs.writeFileSync(arduinoJSONFilePath, JSON.stringify(arduinoJSONObj, null, 4));
            }
            catch (error) {
                throw new Error(`Device: create arduino config file failed: ${error.message}`);
            }
            // Create settings.json config file
            const settingsJSONFilePath = path.join(this.vscodeFolderPath, constants_1.FileNames.settingsJsonFileName);
            const settingsJSONObj = {
                'files.exclude': { '.build': true, '.iotworkbenchproject': true }
            };
            try {
                fs.writeFileSync(settingsJSONFilePath, JSON.stringify(settingsJSONObj, null, 4));
            }
            catch (error) {
                throw new Error(`Device: create arduino config file failed: ${error.message}`);
            }
            // Create an empty arduino sketch
            const sketchTemplateFilePath = this.extensionContext.asAbsolutePath(path.join(constants_1.FileNames.resourcesFolderName, board.id, sketchTemplateFileName));
            const newSketchFilePath = path.join(this.deviceFolder, constants.defaultSketchFileName);
            try {
                const content = fs.readFileSync(sketchTemplateFilePath).toString();
                fs.writeFileSync(newSketchFilePath, content);
            }
            catch (error) {
                throw new Error(`Create arduino sketch file failed: ${error.message}`);
            }
            return true;
        });
    }
    generateCrc(context, channel) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!vscode.workspace.workspaceFolders) {
                vscode.window.showWarningMessage('No workspace opened.');
                channel.show();
                channel.appendLine('No workspace opened.');
                return false;
            }
            const devicePath = configHandler_1.ConfigHandler.get(constants_1.ConfigKey.devicePath);
            if (!devicePath) {
                vscode.window.showWarningMessage('No device path found in workspace configuration.');
                channel.show();
                channel.appendLine('No device path found in workspace configuration.');
                return false;
            }
            const deviceBuildLocation = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '..', devicePath, '.build');
            if (!deviceBuildLocation) {
                vscode.window.showWarningMessage('No device compile output folder found.');
                channel.show();
                channel.appendLine('No device compile output folder found.');
                return false;
            }
            const binFiles = fs.listSync(deviceBuildLocation, ['bin']);
            if (!binFiles || !binFiles.length) {
                const message = 'No bin file found. Please run the command of Device Compile first.';
                vscode.window.showWarningMessage(message);
                channel.show();
                channel.appendLine(message);
                return false;
            }
            let binFilePath = '';
            if (binFiles.length === 1) {
                binFilePath = binFiles[0];
            }
            else {
                const binFilePickItems = [];
                for (const file of binFiles) {
                    const fileName = path.basename(file);
                    binFilePickItems.push({ label: fileName, description: file });
                }
                const choice = yield vscode.window.showQuickPick(binFilePickItems, {
                    ignoreFocusOut: true,
                    matchOnDescription: true,
                    matchOnDetail: true,
                    placeHolder: 'Select bin file',
                });
                if (!choice || !choice.description) {
                    return false;
                }
                binFilePath = choice.description;
            }
            if (!binFilePath || !fs.existsSync(binFilePath)) {
                return false;
            }
            const res = OTA_1.OTA.generateCrc(binFilePath);
            vscode.window.showInformationMessage('Generate CRC succeeded.');
            channel.show();
            channel.appendLine('========== CRC Information ==========');
            channel.appendLine('');
            channel.appendLine('fwPath: ' + binFilePath);
            channel.appendLine('fwPackageCheckValue: ' + res.crc);
            channel.appendLine('fwSize: ' + res.size);
            channel.appendLine('');
            channel.appendLine('======================================');
            return true;
        });
    }
}
exports.ArduinoDeviceBase = ArduinoDeviceBase;
//# sourceMappingURL=ArduinoDeviceBase.js.map