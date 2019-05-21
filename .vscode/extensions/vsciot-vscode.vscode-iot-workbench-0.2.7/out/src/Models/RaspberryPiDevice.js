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
const cp = require("child_process");
const fs = require("fs-plus");
const guid_typescript_1 = require("guid-typescript");
const path = require("path");
const vscode = require("vscode");
const configHandler_1 = require("../configHandler");
const constants_1 = require("../constants");
const Component_1 = require("./Interfaces/Component");
const Device_1 = require("./Interfaces/Device");
const SSH_1 = require("./SSH");
const constants = {
    defaultSketchFileName: 'app.js'
};
class RaspberryPiUploadConfig {
}
RaspberryPiUploadConfig.host = 'raspberrypi';
RaspberryPiUploadConfig.port = 22;
RaspberryPiUploadConfig.user = 'pi';
RaspberryPiUploadConfig.password = 'raspberry';
RaspberryPiUploadConfig.projectPath = 'IoTProject';
RaspberryPiUploadConfig.updated = false;
class RaspberryPiDevice {
    constructor(context, devicePath, channel, sketchName) {
        this.sketchName = '';
        this.name = 'RaspberryPi';
        this.deviceType = Device_1.DeviceType.Raspberry_Pi;
        this.componentType = Component_1.ComponentType.Device;
        this.deviceFolder = devicePath;
        this.extensionContext = context;
        this.channel = channel;
        this.componentId = guid_typescript_1.Guid.create().toString();
        if (sketchName) {
            this.sketchName = sketchName;
        }
    }
    get id() {
        return this.componentId;
    }
    static get boardId() {
        return RaspberryPiDevice._boardId;
    }
    getDeviceType() {
        return this.deviceType;
    }
    getComponentType() {
        return this.componentType;
    }
    checkPrerequisites() {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceFolderPath = this.deviceFolder;
            if (!fs.existsSync(deviceFolderPath)) {
                throw new Error('Unable to find the device folder inside the project.');
            }
            if (!fs.existsSync(path.join(deviceFolderPath, 'node_modules'))) {
                cp.exec('npm install', { cwd: deviceFolderPath });
            }
            return true;
        });
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
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
            const vscodeFolderPath = path.join(deviceFolderPath, constants_1.FileNames.vscodeSettingsFolderName);
            if (!fs.existsSync(vscodeFolderPath)) {
                fs.mkdirSync(vscodeFolderPath);
            }
            const option = {
                value: constants.defaultSketchFileName,
                prompt: `Please input device sketch file name here.`,
                ignoreFocusOut: true,
                validateInput: (sketchFileName) => {
                    if (!sketchFileName ||
                        /^([a-z_]|[a-z_][-a-z0-9_.]*[a-z0-9_])(\.js)?$/i.test(sketchFileName)) {
                        return '';
                    }
                    return 'Sketch file name can only contain alphanumeric and cannot start with number.';
                }
            };
            let sketchFileName = yield vscode.window.showInputBox(option);
            if (sketchFileName === undefined) {
                return false;
            }
            else if (!sketchFileName) {
                sketchFileName = constants.defaultSketchFileName;
            }
            else {
                sketchFileName = sketchFileName.trim();
                if (!/\.js$/i.test(sketchFileName)) {
                    sketchFileName += '.js';
                }
            }
            const sketchTemplateFilePath = this.extensionContext.asAbsolutePath(path.join(constants_1.FileNames.resourcesFolderName, RaspberryPiDevice.boardId, this.sketchName));
            const newSketchFilePath = path.join(deviceFolderPath, sketchFileName);
            try {
                const content = fs.readFileSync(sketchTemplateFilePath).toString();
                fs.writeFileSync(newSketchFilePath, content);
            }
            catch (error) {
                throw new Error(`Create ${sketchFileName} failed: ${error.message}`);
            }
            const packageTemplateFilePath = this.extensionContext.asAbsolutePath(path.join(constants_1.FileNames.resourcesFolderName, RaspberryPiDevice.boardId, 'package.json'));
            const newPackageFilePath = path.join(deviceFolderPath, 'package.json');
            try {
                const packageObj = require(packageTemplateFilePath);
                packageObj.main = sketchFileName;
                fs.writeFileSync(newPackageFilePath, JSON.stringify(packageObj, null, 2));
            }
            catch (error) {
                throw new Error(`Create package.json failed: ${error.message}`);
            }
            const settingsJSONFilePath = path.join(vscodeFolderPath, constants_1.FileNames.settingsJsonFileName);
            const settingsJSONObj = { 'files.exclude': { '.iotworkbenchproject': true } };
            try {
                fs.writeFileSync(settingsJSONFilePath, JSON.stringify(settingsJSONObj, null, 4));
            }
            catch (error) {
                throw new Error(`Device: create config file failed: ${error.message}`);
            }
            cp.exec('npm install', { cwd: deviceFolderPath });
            return true;
        });
    }
    compile() {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.window.showInformationMessage('Compiling device code for Raspberry Pi is not supported');
            return true;
        });
    }
    upload() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!fs.existsSync(path.join(this.deviceFolder, 'config.json'))) {
                const option = yield vscode.window.showInformationMessage('No config file found. Have you configured device connection string?', 'Upload anyway', 'Cancel');
                if (option === 'Cancel') {
                    return true;
                }
            }
            if (!RaspberryPiUploadConfig.updated) {
                const res = yield this.configSSH();
                if (!res) {
                    vscode.window.showWarningMessage('Configure SSH cancelled.');
                    return true;
                }
            }
            const ssh = new SSH_1.SSH(this.channel);
            const sshConnected = yield ssh.connect(RaspberryPiUploadConfig.host, RaspberryPiUploadConfig.port, RaspberryPiUploadConfig.user, RaspberryPiUploadConfig.password);
            let sshUploaded;
            if (sshConnected) {
                sshUploaded = yield ssh.upload(this.deviceFolder, RaspberryPiUploadConfig.projectPath);
            }
            else {
                yield ssh.close();
                this.channel.appendLine('SSH connection failed.');
                return false;
            }
            let sshNpmInstalled;
            if (sshUploaded) {
                sshNpmInstalled = yield ssh.shell(`cd ${RaspberryPiUploadConfig.projectPath} && npm install`);
            }
            else {
                yield ssh.close();
                this.channel.appendLine('SFTP upload failed.');
                return false;
            }
            yield ssh.close();
            if (this.channel) {
                this.channel.appendLine('Uploaded project to Raspberry Pi.');
            }
            vscode.window.showInformationMessage('Uploaded project to Raspberry Pi.');
            return true;
        });
    }
    configDeviceSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const configSelectionItems = [
                {
                    label: 'Config Raspberry Pi SSH',
                    description: 'Config Raspberry Pi SSH',
                    detail: 'Config SSH'
                },
                {
                    label: 'Config connection of IoT Hub Device',
                    description: 'Config connection of IoT Hub Device',
                    detail: 'Config IoT Hub Device'
                }
            ];
            const configSelection = yield vscode.window.showQuickPick(configSelectionItems, {
                ignoreFocusOut: true,
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: 'Select an option',
            });
            if (!configSelection) {
                return false;
            }
            if (configSelection.detail === 'Config SSH') {
                try {
                    const res = yield this.configSSH();
                    if (res) {
                        vscode.window.showInformationMessage('Config SSH successfully.');
                    }
                    return res;
                }
                catch (error) {
                    vscode.window.showWarningMessage('Config SSH failed.');
                    return false;
                }
            }
            else {
                try {
                    const res = yield this.configHub();
                    return res;
                }
                catch (error) {
                    vscode.window.showWarningMessage('Config IoT Hub failed.');
                    return false;
                }
            }
        });
    }
    configSSH() {
        return __awaiter(this, void 0, void 0, function* () {
            // Raspberry Pi host
            const raspiHostOption = {
                value: RaspberryPiUploadConfig.host,
                prompt: `Please input Raspberry Pi ip or hostname here.`,
                ignoreFocusOut: true
            };
            let raspiHost = yield vscode.window.showInputBox(raspiHostOption);
            if (raspiHost === undefined) {
                return false;
            }
            raspiHost = raspiHost || RaspberryPiUploadConfig.host;
            // Raspberry Pi SSH port
            const raspiPortOption = {
                value: RaspberryPiUploadConfig.port.toString(),
                prompt: `Please input Raspberry Pi SSH port here.`,
                ignoreFocusOut: true
            };
            const raspiPortString = yield vscode.window.showInputBox(raspiPortOption);
            if (raspiPortString === undefined) {
                return false;
            }
            const raspiPort = raspiPortString && !isNaN(Number(raspiPortString)) ?
                Number(raspiPortString) :
                RaspberryPiUploadConfig.port;
            // Raspberry Pi user name
            const raspiUserOption = {
                value: RaspberryPiUploadConfig.user,
                prompt: `Please input Raspberry Pi user name here.`,
                ignoreFocusOut: true
            };
            let raspiUser = yield vscode.window.showInputBox(raspiUserOption);
            if (raspiUser === undefined) {
                return false;
            }
            raspiUser = raspiUser || RaspberryPiUploadConfig.user;
            // Raspberry Pi user password
            const raspiPasswordOption = {
                value: RaspberryPiUploadConfig.password,
                prompt: `Please input Raspberry Pi password here.`,
                ignoreFocusOut: true
            };
            let raspiPassword = yield vscode.window.showInputBox(raspiPasswordOption);
            if (raspiPassword === undefined) {
                return false;
            }
            raspiPassword = raspiPassword || RaspberryPiUploadConfig.password;
            // Raspberry Pi path
            const raspiPathOption = {
                value: RaspberryPiUploadConfig.projectPath,
                prompt: `Please input Raspberry Pi path here.`,
                ignoreFocusOut: true
            };
            let raspiPath = yield vscode.window.showInputBox(raspiPathOption);
            if (raspiPath === undefined) {
                return false;
            }
            raspiPath = raspiPath || RaspberryPiUploadConfig.projectPath;
            RaspberryPiUploadConfig.host = raspiHost;
            RaspberryPiUploadConfig.port = raspiPort;
            RaspberryPiUploadConfig.user = raspiUser;
            RaspberryPiUploadConfig.password = raspiPassword;
            RaspberryPiUploadConfig.projectPath = raspiPath;
            RaspberryPiUploadConfig.updated = true;
            return true;
        });
    }
    configHub() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const deviceFolderPath = this.deviceFolder;
                if (!fs.existsSync(deviceFolderPath)) {
                    throw new Error('Unable to find the device folder inside the project.');
                }
                // Get IoT Hub device connection string from config
                let deviceConnectionString = configHandler_1.ConfigHandler.get(constants_1.ConfigKey.iotHubDeviceConnectionString);
                let hostName = '';
                let deviceId = '';
                if (deviceConnectionString) {
                    const hostnameMatches = deviceConnectionString.match(/HostName=(.*?)(;|$)/);
                    if (hostnameMatches) {
                        hostName = hostnameMatches[0];
                    }
                    const deviceIDMatches = deviceConnectionString.match(/DeviceId=(.*?)(;|$)/);
                    if (deviceIDMatches) {
                        deviceId = deviceIDMatches[0];
                    }
                }
                let deviceConnectionStringSelection = [];
                if (deviceId && hostName) {
                    deviceConnectionStringSelection = [
                        {
                            label: 'Select IoT Hub Device Connection String',
                            description: '',
                            detail: `Device Information: ${hostName} ${deviceId}`
                        },
                        {
                            label: 'Input IoT Hub Device Connection String',
                            description: '',
                            detail: 'Input another...'
                        }
                    ];
                }
                else {
                    deviceConnectionStringSelection = [{
                            label: 'Input IoT Hub Device Connection String',
                            description: '',
                            detail: 'Input another...'
                        }];
                }
                const selection = yield vscode.window.showQuickPick(deviceConnectionStringSelection, {
                    ignoreFocusOut: true,
                    placeHolder: 'Choose IoT Hub Device Connection String'
                });
                if (!selection) {
                    return false;
                }
                if (selection.detail === 'Input another...') {
                    const option = {
                        value: 'HostName=<Host Name>;DeviceId=<Device Name>;SharedAccessKey=<Device Key>',
                        prompt: `Please input device connection string here.`,
                        ignoreFocusOut: true
                    };
                    deviceConnectionString = yield vscode.window.showInputBox(option);
                    if (!deviceConnectionString) {
                        return false;
                    }
                    if ((deviceConnectionString.indexOf('HostName') === -1) ||
                        (deviceConnectionString.indexOf('DeviceId') === -1) ||
                        (deviceConnectionString.indexOf('SharedAccessKey') === -1)) {
                        throw new Error('The format of the IoT Hub Device connection string is invalid. Please provide a valid Device connection string.');
                    }
                }
                if (!deviceConnectionString) {
                    return false;
                }
                console.log(deviceConnectionString);
                // Set selected connection string to device
                try {
                    const configFilePath = path.join(deviceFolderPath, 'config.json');
                    const config = { connectionString: deviceConnectionString };
                    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
                }
                catch (error) {
                    throw new Error(`Device: create config file failed: ${error.message}`);
                }
                vscode.window.showInformationMessage('Configure Device connection string successfully.');
                return true;
            }
            catch (error) {
                throw error;
            }
        });
    }
}
RaspberryPiDevice._boardId = 'raspberrypi';
exports.RaspberryPiDevice = RaspberryPiDevice;
//# sourceMappingURL=RaspberryPiDevice.js.map