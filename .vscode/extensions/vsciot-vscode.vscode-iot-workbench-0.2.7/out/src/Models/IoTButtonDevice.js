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
const guid_typescript_1 = require("guid-typescript");
const path = require("path");
const request = require("request-promise");
const vscode = require("vscode");
const configHandler_1 = require("../configHandler");
const constants_1 = require("../constants");
const Component_1 = require("./Interfaces/Component");
const Device_1 = require("./Interfaces/Device");
const constants = {
    timeout: 10000,
    accessEndpoint: 'http://192.168.4.1',
    userjsonFilename: 'userdata.json'
};
class IoTButtonDevice {
    constructor(context, devicePath, inputFileName) {
        this.inputFileName = '';
        this.name = 'IoTButton';
        this.deviceType = Device_1.DeviceType.IoT_Button;
        this.componentType = Component_1.ComponentType.Device;
        this.deviceFolder = devicePath;
        this.extensionContext = context;
        this.componentId = guid_typescript_1.Guid.create().toString();
        if (inputFileName) {
            this.inputFileName = inputFileName;
        }
    }
    get id() {
        return this.componentId;
    }
    static get boardId() {
        return IoTButtonDevice._boardId;
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
            return true;
        });
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.inputFileName) {
                throw new Error('No user data file found.');
            }
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
            // Create an empty userdata.json
            const userdataJsonFilePath = this.extensionContext.asAbsolutePath(path.join(constants_1.FileNames.resourcesFolderName, IoTButtonDevice._boardId, this.inputFileName));
            const newUserdataPath = path.join(deviceFolderPath, this.inputFileName);
            try {
                const content = fs.readFileSync(userdataJsonFilePath).toString();
                fs.writeFileSync(newUserdataPath, content);
            }
            catch (error) {
                throw new Error(`Create userdata json file failed: ${error.message}`);
            }
            const vscodeFolderPath = path.join(deviceFolderPath, constants_1.FileNames.vscodeSettingsFolderName);
            if (!fs.existsSync(vscodeFolderPath)) {
                fs.mkdirSync(vscodeFolderPath);
            }
            // Create settings.json config file
            const settingsJSONFilePath = path.join(vscodeFolderPath, constants_1.FileNames.settingsJsonFileName);
            const settingsJSONObj = {
                'files.exclude': { '.build': true, '.iotworkbenchproject': true }
            };
            try {
                fs.writeFileSync(settingsJSONFilePath, JSON.stringify(settingsJSONObj, null, 4));
            }
            catch (error) {
                throw new Error(`Device: create config file failed: ${error.message}`);
            }
            return true;
        });
    }
    compile() {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.showInformationMessage('Congratulations! There is no device code to compile in this project.');
            return true;
        });
    }
    upload() {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.window.showInformationMessage('Congratulations! There is no device code to upload in this project.');
            return true;
        });
    }
    configDeviceSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: try to connect to access point host of IoT button to detect the
            // connection.
            const configSelectionItems = [
                {
                    label: 'Config WiFi of IoT button',
                    description: 'Config WiFi of IoT button',
                    detail: 'Config WiFi'
                },
                {
                    label: 'Config connection of IoT Hub Device',
                    description: 'Config connection of IoT Hub Device',
                    detail: 'Config IoT Hub Device'
                },
                {
                    label: 'Config time server of IoT button',
                    description: 'Config time server of IoT button',
                    detail: 'Config Time Server'
                },
                {
                    label: 'Config JSON data to append to message',
                    description: 'Config JSON data to append to message',
                    detail: 'Config User Json Data'
                },
                {
                    label: 'Shutdown IoT button',
                    description: 'Shutdown IoT button',
                    detail: 'Shutdown'
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
            if (configSelection.detail === 'Config WiFi') {
                try {
                    const res = yield this.configWifi();
                    if (res) {
                        vscode.window.showInformationMessage('Config WiFi successfully.');
                    }
                }
                catch (error) {
                    vscode.window.showWarningMessage('Config WiFi failed.');
                }
            }
            else if (configSelection.detail === 'Config IoT Hub Device') {
                try {
                    const res = yield this.configHub();
                    if (res) {
                        vscode.window.showInformationMessage('Config Azure IoT Hub successfully.');
                    }
                }
                catch (error) {
                    vscode.window.showWarningMessage('Config IoT Hub failed.');
                }
            }
            else if (configSelection.detail === 'Config Time Server') {
                try {
                    const res = yield this.configNtp();
                    if (res) {
                        vscode.window.showInformationMessage('Config time server successfully.');
                    }
                }
                catch (error) {
                    vscode.window.showWarningMessage('Config IoT Hub failed.');
                }
            }
            else if (configSelection.detail === 'Config User Json Data') {
                try {
                    const res = yield this.configUserData();
                    if (res) {
                        vscode.window.showInformationMessage('Config user data successfully.');
                    }
                }
                catch (error) {
                    vscode.window.showWarningMessage('Config user data failed.');
                }
            }
            else {
                try {
                    const res = yield this.configSaveAndShutdown();
                }
                catch (error) {
                    // Ignore.
                    // Because the button has been shutdown, we won't get any response for
                    // the action
                }
                vscode.window.showInformationMessage('Shutdown IoT button completed.');
                return true;
            }
            return yield this.configDeviceSettings();
        });
    }
    setConfig(uri, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const option = { uri, method: 'POST', timeout: constants.timeout, form: data };
            const res = yield request(option);
            if (!res) {
                throw new Error('Empty response.');
            }
            return res;
        });
    }
    configWifi() {
        return __awaiter(this, void 0, void 0, function* () {
            const ssid = yield vscode.window.showInputBox({
                prompt: `WiFi SSID`,
                ignoreFocusOut: true,
                validateInput: (ssid) => {
                    if (!ssid) {
                        return 'WiFi SSID cannot be empty.';
                    }
                    else {
                        return;
                    }
                }
            });
            if (ssid === undefined) {
                return false;
            }
            const password = yield vscode.window.showInputBox({ prompt: `WiFi Password`, password: true, ignoreFocusOut: true });
            if (password === undefined) {
                return false;
            }
            const data = { ssid, password };
            const uri = constants.accessEndpoint;
            const res = yield this.setConfig(uri, data);
            return res;
        });
    }
    configHub() {
        return __awaiter(this, void 0, void 0, function* () {
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
                    ignoreFocusOut: true,
                    validateInput: (connectionString) => {
                        if (!connectionString) {
                            return 'Connection string cannot be empty.';
                        }
                        else {
                            return;
                        }
                    }
                };
                deviceConnectionString = yield vscode.window.showInputBox(option);
                if (deviceConnectionString === undefined) {
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
            const iothubMatches = deviceConnectionString.match(/HostName=(.*?)(;|$)/);
            const iotdevicenameMatches = deviceConnectionString.match(/DeviceId=(.*?)(;|$)/);
            const iotdevicesecretMatches = deviceConnectionString.match(/SharedAccessKey=(.*?)(;|$)/);
            if (!iothubMatches || !iothubMatches[1] || !iotdevicenameMatches ||
                !iotdevicenameMatches[1] || !iotdevicesecretMatches ||
                !iotdevicesecretMatches[1]) {
                return false;
            }
            const iothub = iothubMatches[1];
            const iotdevicename = iotdevicenameMatches[1];
            const iotdevicesecret = iotdevicesecretMatches[1];
            const data = { iothub, iotdevicename, iotdevicesecret };
            const uri = constants.accessEndpoint;
            const res = yield this.setConfig(uri, data);
            return res;
        });
    }
    configUserData() {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceFolderPath = this.deviceFolder;
            if (!fs.existsSync(deviceFolderPath)) {
                throw new Error('Unable to find the device folder inside the project.');
            }
            const userjsonFilePath = path.join(deviceFolderPath, constants.userjsonFilename);
            if (!fs.existsSync(userjsonFilePath)) {
                throw new Error('The user json file does not exist.');
            }
            let userjson = {};
            try {
                userjson = JSON.parse(fs.readFileSync(userjsonFilePath, 'utf8'));
            }
            catch (error) {
                userjson = {};
            }
            const data = { userjson: JSON.stringify(userjson) };
            const uri = constants.accessEndpoint;
            const res = yield this.setConfig(uri, data);
            return res;
        });
    }
    configNtp() {
        return __awaiter(this, void 0, void 0, function* () {
            const timeserver = yield vscode.window.showInputBox({
                value: 'pool.ntp.org',
                prompt: `Time Server`,
                ignoreFocusOut: true,
                validateInput: (timeserver) => {
                    if (!timeserver) {
                        return 'Time Server cannot be empty.';
                    }
                    else {
                        return;
                    }
                }
            });
            if (timeserver === undefined) {
                return false;
            }
            const data = { timeserver };
            const uri = constants.accessEndpoint;
            const res = yield this.setConfig(uri, data);
            return res;
        });
    }
    configSaveAndShutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = { action: 'shutdown' };
            const uri = constants.accessEndpoint;
            const res = yield this.setConfig(uri, data);
            return res;
        });
    }
}
IoTButtonDevice._boardId = 'iotbutton';
exports.IoTButtonDevice = IoTButtonDevice;
//# sourceMappingURL=IoTButtonDevice.js.map