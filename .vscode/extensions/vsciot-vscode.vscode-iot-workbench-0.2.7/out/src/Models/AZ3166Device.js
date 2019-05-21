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
const child_process_1 = require("child_process");
const crypto = require("crypto");
const fs = require("fs-plus");
const getmac = require("getmac");
const guid_typescript_1 = require("guid-typescript");
const _ = require("lodash");
const opn = require("opn");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const WinReg = require("winreg");
const boardProvider_1 = require("../boardProvider");
const configHandler_1 = require("../configHandler");
const constants_1 = require("../constants");
const DialogResponses_1 = require("../DialogResponses");
const utils_1 = require("../utils");
const ArduinoDeviceBase_1 = require("./ArduinoDeviceBase");
const Device_1 = require("./Interfaces/Device");
const impor = require('impor')(__dirname);
const forEach = impor('lodash.foreach');
const trimStart = impor('lodash.trimstart');
const filter = impor('lodash.filter');
const constants = {
    boardInfo: 'AZ3166:stm32f4:MXCHIP_AZ3166',
    uploadMethod: 'upload_method=OpenOCDMethod',
    outputPath: './.build',
    platformLocalFileName: 'platform.local.txt',
    cExtraFlag: 'compiler.c.extra_flags=-DCORRELATIONID="',
    cppExtraFlag: 'compiler.cpp.extra_flags=-DCORRELATIONID="',
    traceExtraFlag: ' -DENABLETRACE=',
    informationPageUrl: 'https://aka.ms/AA35xln'
};
var configDeviceOptions;
(function (configDeviceOptions) {
    configDeviceOptions[configDeviceOptions["ConnectionString"] = 0] = "ConnectionString";
    configDeviceOptions[configDeviceOptions["UDS"] = 1] = "UDS";
})(configDeviceOptions || (configDeviceOptions = {}));
function cmd(command) {
    return __awaiter(this, void 0, void 0, function* () {
        child_process_1.exec(command, Promise.resolve);
    });
}
class AZ3166Device extends ArduinoDeviceBase_1.ArduinoDeviceBase {
    constructor(context, channel, devicePath, sketchName) {
        super(context, devicePath, Device_1.DeviceType.MXChip_AZ3166);
        this.sketchName = '';
        this.name = 'AZ3166';
        this.channel = channel;
        this.componentId = guid_typescript_1.Guid.create().toString();
        if (sketchName) {
            this.sketchName = sketchName;
        }
    }
    // tslint:disable-next-line: no-any
    static get serialport() {
        if (!AZ3166Device._serialport) {
            AZ3166Device._serialport =
                require('../../vendor/node-usb-native').SerialPort;
        }
        return AZ3166Device._serialport;
    }
    get id() {
        return this.componentId;
    }
    static get boardId() {
        return AZ3166Device._boardId;
    }
    get board() {
        const boardProvider = new boardProvider_1.BoardProvider(this.extensionContext);
        const az3166 = boardProvider.find({ id: AZ3166Device._boardId });
        return az3166;
    }
    get version() {
        const packageRootPath = this.getArduinoPackagePath();
        let version = '0.0.1';
        if (fs.existsSync(packageRootPath)) {
            const versions = fs.readdirSync(packageRootPath);
            if (versions[0]) {
                version = versions[0];
            }
        }
        return version;
    }
    checkPrerequisites() {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            return _super("checkPrerequisites").call(this);
        });
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            const deviceFolderPath = this.deviceFolder;
            if (!fs.existsSync(deviceFolderPath)) {
                throw new Error('Unable to find the device folder inside the project.');
            }
            if (!this.board) {
                throw new Error('Unable to find the board in the config file.');
            }
            this.generateCppPropertiesFile(this.board);
            return true;
        });
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.sketchName) {
                throw new Error('No sketch file found.');
            }
            const deviceFolderPath = this.deviceFolder;
            if (!fs.existsSync(deviceFolderPath)) {
                throw new Error('Unable to find the device folder inside the project.');
            }
            if (!this.board) {
                throw new Error('Unable to find the board in the config file.');
            }
            this.generateCommonFiles();
            this.generateCppPropertiesFile(this.board);
            yield this.generateSketchFile(this.sketchName, this.board, constants.boardInfo, constants.uploadMethod);
            return true;
        });
    }
    preCompileAction() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.generatePlatformLocal();
            return true;
        });
    }
    preUploadAction() {
        return __awaiter(this, void 0, void 0, function* () {
            const isStlinkInstalled = yield this.stlinkDriverInstalled();
            if (!isStlinkInstalled) {
                const message = 'The ST-LINK driver for DevKit is not installed. Install now?';
                const result = yield vscode.window.showWarningMessage(message, DialogResponses_1.DialogResponses.yes, DialogResponses_1.DialogResponses.skipForNow, DialogResponses_1.DialogResponses.cancel);
                if (result === DialogResponses_1.DialogResponses.yes) {
                    // Open the download page
                    const installUri = 'http://www.st.com/en/development-tools/stsw-link009.html';
                    opn(installUri);
                    return true;
                }
                else if (result !== DialogResponses_1.DialogResponses.cancel) {
                    return false;
                }
            }
            // Enable logging on IoT Devkit
            yield this.generatePlatformLocal();
            return true;
        });
    }
    configDeviceSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const configSelectionItems = [
                {
                    label: 'Config Device Connection String',
                    description: 'Config Device Connection String',
                    detail: 'Config Connection String'
                },
                {
                    label: 'Config Unique Device String (UDS)',
                    description: 'Config Unique Device String (UDS)',
                    detail: 'Config UDS'
                },
                {
                    label: 'Generate CRC for OTA',
                    description: 'Generate Cyclic Redundancy Check(CRC) code for OTA Update',
                    detail: 'Config CRC'
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
            if (configSelection.detail === 'Config CRC') {
                const retValue = yield this.generateCrc(this.extensionContext, this.channel);
                return retValue;
            }
            else if (configSelection.detail === 'Config Connection String') {
                try {
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
                                detail: ''
                            }
                        ];
                    }
                    else {
                        deviceConnectionStringSelection = [{
                                label: 'Input IoT Hub Device Connection String',
                                description: '',
                                detail: ''
                            }];
                    }
                    const selection = yield vscode.window.showQuickPick(deviceConnectionStringSelection, { ignoreFocusOut: true, placeHolder: 'Choose an option:' });
                    if (!selection) {
                        return false;
                    }
                    if (selection.label === 'Input IoT Hub Device Connection String') {
                        const option = {
                            value: 'HostName=<Host Name>;DeviceId=<Device Name>;SharedAccessKey=<Device Key>',
                            prompt: `Please input device connection string here.`,
                            ignoreFocusOut: true,
                            validateInput: (deviceConnectionString) => {
                                if (!deviceConnectionString) {
                                    return 'Please provide a valid device connection string.';
                                }
                                if ((deviceConnectionString.indexOf('HostName') === -1) ||
                                    (deviceConnectionString.indexOf('DeviceId') === -1) ||
                                    (deviceConnectionString.indexOf('SharedAccessKey') === -1)) {
                                    return 'The format of the IoT Hub Device connection string is invalid.';
                                }
                                return;
                            }
                        };
                        deviceConnectionString = yield vscode.window.showInputBox(option);
                        if (!deviceConnectionString) {
                            const message = 'Need more information on how to get device connection string?';
                            const result = yield vscode.window.showWarningMessage(message, DialogResponses_1.DialogResponses.yes, DialogResponses_1.DialogResponses.no);
                            if (result === DialogResponses_1.DialogResponses.yes) {
                                opn(constants.informationPageUrl);
                            }
                            return false;
                        }
                    }
                    if (!deviceConnectionString) {
                        return false;
                    }
                    console.log(deviceConnectionString);
                    // Try to close serial monitor
                    try {
                        yield vscode.commands.executeCommand('arduino.closeSerialMonitor', null, false);
                    }
                    catch (ignore) {
                    }
                    // Set selected connection string to device
                    let res;
                    const plat = os.platform();
                    if (plat === 'win32') {
                        res = yield this.flushDeviceConfig(deviceConnectionString, configDeviceOptions.ConnectionString);
                    }
                    else {
                        res = yield this.flushDeviceConfigUnix(deviceConnectionString, configDeviceOptions.ConnectionString);
                    }
                    if (res === false) {
                        return false;
                    }
                    else {
                        vscode.window.showInformationMessage('Configure Device connection string completely.');
                        return true;
                    }
                }
                catch (error) {
                    throw error;
                }
            }
            else {
                try {
                    function generateRandomHex() {
                        const chars = '0123456789abcdef'.split('');
                        let hexNum = '';
                        for (let i = 0; i < 64; i++) {
                            hexNum += chars[Math.floor(Math.random() * 16)];
                        }
                        return hexNum;
                    }
                    const option = {
                        value: generateRandomHex(),
                        prompt: `Please input Unique Device String (UDS) here.`,
                        ignoreFocusOut: true,
                        validateInput: (UDS) => {
                            if (/^([0-9a-f]){64}$/i.test(UDS) === false) {
                                return 'The format of the UDS is invalid. Please provide a valid UDS.';
                            }
                            return '';
                        }
                    };
                    const UDS = yield vscode.window.showInputBox(option);
                    if (UDS === undefined) {
                        return false;
                    }
                    console.log(UDS);
                    // Try to close serial monitor
                    try {
                        yield vscode.commands.executeCommand('arduino.closeSerialMonitor', null, false);
                    }
                    catch (ignore) {
                    }
                    // Set selected connection string to device
                    let res;
                    const plat = os.platform();
                    if (plat === 'win32') {
                        res = yield this.flushDeviceConfig(UDS, configDeviceOptions.UDS);
                    }
                    else {
                        res = yield this.flushDeviceConfigUnix(UDS, configDeviceOptions.UDS);
                    }
                    if (res === false) {
                        return false;
                    }
                    else {
                        vscode.window.showInformationMessage('Configure Unique Device String (UDS) completely.');
                        return true;
                    }
                }
                catch (error) {
                    throw error;
                }
            }
        });
    }
    flushDeviceConfigUnix(configValue, option) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let comPort = '';
                let command = '';
                try {
                    // Choose COM port that AZ3166 is connected
                    comPort = yield this.chooseCOM();
                    console.log(`Opening ${comPort}.`);
                }
                catch (error) {
                    reject(error);
                }
                if (option === configDeviceOptions.ConnectionString) {
                    command = 'set_az_iothub';
                }
                else {
                    command = 'set_dps_uds';
                }
                let errorRejected = false;
                const az3166 = this.board;
                if (!az3166) {
                    return reject(new Error('IoT DevKit is not found in the board list.'));
                }
                const port = new AZ3166Device.serialport(comPort, {
                    baudRate: az3166.defaultBaudRate,
                    dataBits: 8,
                    stopBits: 1,
                    xon: false,
                    xoff: false,
                    parity: 'none'
                });
                const rejectIfError = (err) => {
                    if (errorRejected)
                        return true;
                    if (err) {
                        errorRejected = true;
                        reject(err);
                        try {
                            port.close();
                        }
                        catch (ignore) {
                        }
                    }
                    return true;
                };
                const executeSetAzIoTHub = () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const data = `${command} "${configValue}"\r\n`;
                        let restDataLength = data.length;
                        while (restDataLength > 0) {
                            const start = data.length - restDataLength;
                            const length = Math.min(100, restDataLength);
                            restDataLength -= length;
                            const dataChunk = data.substr(start, length);
                            yield this.sendDataViaSerialPort(port, dataChunk);
                            yield utils_1.delay(1000);
                        }
                        port.close();
                    }
                    catch (ignore) {
                    }
                    if (errorRejected) {
                        return;
                    }
                    else {
                        resolve(true);
                    }
                });
                // Configure serial port callbacks
                port.on('open', () => __awaiter(this, void 0, void 0, function* () {
                    // tslint:disable-next-line: no-any
                    yield vscode.window.showInformationMessage('Please hold down button A and then push and release the reset button to enter configuration mode. After enter configuration mode, click OK.', 'OK');
                    executeSetAzIoTHub()
                        .then(() => resolve(true))
                        .catch((error) => reject(error));
                }));
                // tslint:disable-next-line: no-any
                port.on('error', (error) => {
                    if (errorRejected)
                        return;
                    console.log(error);
                    rejectIfError(error);
                });
            }));
        });
    }
    flushDeviceConfig(configValue, option) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let comPort = '';
                let command = '';
                try {
                    // Choose COM port that AZ3166 is connected
                    comPort = yield this.chooseCOM();
                    console.log(`Opening ${comPort}.`);
                }
                catch (error) {
                    reject(error);
                }
                if (option === configDeviceOptions.ConnectionString) {
                    command = 'set_az_iothub';
                }
                else {
                    command = 'set_dps_uds';
                }
                let configMode = false;
                let errorRejected = false;
                let commandExecuted = false;
                let gotData = false;
                const az3166 = this.board;
                if (!az3166) {
                    return reject(new Error('IoT DevKit is not found in the board list.'));
                }
                const port = new AZ3166Device.serialport(comPort, {
                    baudRate: az3166.defaultBaudRate,
                    dataBits: 8,
                    stopBits: 1,
                    xon: false,
                    xoff: false,
                    parity: 'none'
                });
                const rejectIfError = (err) => {
                    if (errorRejected)
                        return true;
                    if (err) {
                        errorRejected = true;
                        reject(err);
                        try {
                            port.close();
                        }
                        catch (ignore) {
                        }
                    }
                    return true;
                };
                const executeSetAzIoTHub = () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const data = `${command} "${configValue}"\r\n`;
                        yield this.sendDataViaSerialPort(port, data.slice(0, 120));
                        if (data.length > 120) {
                            yield utils_1.delay(1000);
                            yield this.sendDataViaSerialPort(port, data.slice(120));
                        }
                        yield utils_1.delay(1000);
                        port.close();
                    }
                    catch (ignore) {
                    }
                    if (errorRejected) {
                        return;
                    }
                    else {
                        resolve(true);
                    }
                });
                // Configure serial port callbacks
                port.on('open', () => {
                    // tslint:disable-next-line: no-any
                    port.write('\r\nhelp\r\n', (error) => {
                        if (rejectIfError(error))
                            return;
                    });
                });
                // tslint:disable-next-line: no-any
                port.on('data', (data) => {
                    gotData = true;
                    const output = data.toString().trim();
                    if (commandExecuted)
                        return;
                    if (output.includes('set_')) {
                        commandExecuted = true;
                        configMode = true;
                        executeSetAzIoTHub()
                            .then(() => resolve(true))
                            .catch((error) => reject(error));
                    }
                    else {
                        configMode = false;
                    }
                    if (configMode) {
                        forEach(output.split('\n'), line => {
                            if (line) {
                                line = trimStart(line.trim(), '#').trim();
                                if (line && line.length) {
                                    console.log('SerialOutput', line);
                                }
                            }
                        });
                    }
                });
                // tslint:disable-next-line: no-any
                port.on('error', (error) => {
                    if (errorRejected)
                        return;
                    console.log(error);
                    rejectIfError(error);
                });
                setTimeout(() => {
                    if (errorRejected)
                        return;
                    // Prompt user to enter configuration mode
                    if (!gotData || !configMode) {
                        vscode.window
                            .showInformationMessage('Please hold down button A and then push and release the reset button to enter configuration mode.')
                            .then(() => {
                            // tslint:disable-next-line: no-any
                            port.write('\r\nhelp\r\n', (error) => {
                                rejectIfError(error);
                            });
                        });
                    }
                }, 10000);
            }));
        });
    }
    getComList() {
        return new Promise((resolve, reject) => {
            // tslint:disable-next-line: no-any
            AZ3166Device.serialport.list((e, ports) => {
                if (e) {
                    reject(e);
                }
                else {
                    resolve(ports);
                }
            });
        });
    }
    chooseCOM() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const comList = yield this.getComList();
                const az3166 = this.board;
                if (!az3166) {
                    return reject(new Error('AZ3166 is not found in the board list.'));
                }
                const list = _.filter(comList, com => {
                    if (com.vendorId && com.productId && az3166.vendorId &&
                        az3166.productId &&
                        com.vendorId.toLowerCase().endsWith(az3166.vendorId) &&
                        com.productId.toLowerCase().endsWith(az3166.productId)) {
                        return true;
                    }
                    else {
                        return false;
                    }
                });
                if (list && list.length) {
                    let comPort = list[0].comName;
                    if (list.length > 1) {
                        // TODO: select com port from list when there are multiple AZ3166
                        // boards connected
                        comPort = list[0].comName;
                    }
                    if (!comPort) {
                        reject(new Error('No avalible COM port.'));
                    }
                    resolve(comPort);
                }
                else {
                    reject(new Error('No AZ3166 board connected.'));
                }
            }));
        });
    }
    // tslint:disable-next-line: no-any
    sendDataViaSerialPort(port, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    // tslint:disable-next-line: no-any
                    port.write(data, (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            port.drain(() => resolve(true));
                        }
                    });
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    stlinkDriverInstalled() {
        return __awaiter(this, void 0, void 0, function* () {
            const plat = os.platform();
            if (plat === 'win32') {
                try {
                    // The STlink driver would write to the following registry.
                    const pathString = yield utils_1.getRegistryValues(WinReg.HKLM, '\\SYSTEM\\ControlSet001\\Control\\Class\\{88bae032-5a81-49f0-bc3d-a4ff138216d6}', 'Class');
                    if (pathString) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                catch (error) {
                    return false;
                }
            }
            // For other OS platform, there is no need to install STLink Driver.
            return true;
        });
    }
    generatePlatformLocal() {
        return __awaiter(this, void 0, void 0, function* () {
            const arduinoPackagePath = this.getArduinoPackagePath();
            function getHashMacAsync() {
                return new Promise((resolve) => {
                    getmac.getMac((err, macAddress) => {
                        if (err) {
                            throw (err);
                        }
                        const hashMacAddress = crypto.createHash('sha256')
                            .update(macAddress, 'utf8')
                            .digest('hex');
                        resolve(hashMacAddress);
                    });
                });
            }
            if (!fs.existsSync(arduinoPackagePath)) {
                throw new Error('Unable to find the Arduino package path, please install the latest Arduino package for Devkit.');
            }
            const files = fs.readdirSync(arduinoPackagePath);
            for (let i = files.length - 1; i >= 0; i--) {
                if (files[i] === '.DS_Store') {
                    files.splice(i, 1);
                }
            }
            if (files.length === 0 || files.length > 1) {
                throw new Error('There are unexpected files or folders under Arduino package installation path. Please clear the folder and reinstall the package for Devkit.');
            }
            const directoryName = path.join(arduinoPackagePath, files[0]);
            if (!fs.isDirectorySync(directoryName)) {
                throw new Error('The Arduino package for MXChip IoT Devkit is not installed. Please follow the guide to install it');
            }
            const fileName = path.join(directoryName, constants.platformLocalFileName);
            if (!fs.existsSync(fileName)) {
                const enableTrace = 1;
                let hashMacAddress;
                try {
                    hashMacAddress = yield getHashMacAsync();
                }
                catch (error) {
                    throw error;
                }
                // Create the file of platform.local.txt
                const targetFileName = path.join(directoryName, constants.platformLocalFileName);
                const content = `${constants.cExtraFlag}${hashMacAddress}" ${constants.traceExtraFlag}${enableTrace}\r\n` +
                    `${constants.cppExtraFlag}${hashMacAddress}" ${constants.traceExtraFlag}${enableTrace}\r\n`;
                try {
                    fs.writeFileSync(targetFileName, content);
                }
                catch (e) {
                    throw e;
                }
            }
        });
    }
    getArduinoPackagePath() {
        const plat = os.platform();
        // TODO: Currently, we do not support portable Arduino installation.
        let arduinoPackagePath = '';
        const homeDir = os.homedir();
        if (plat === 'win32') {
            arduinoPackagePath =
                path.join(homeDir, 'AppData', 'Local', 'Arduino15', 'packages');
        }
        else if (plat === 'darwin') {
            arduinoPackagePath =
                path.join(homeDir, 'Library', 'Arduino15', 'packages');
        }
        else if (plat === 'linux') {
            arduinoPackagePath = path.join(homeDir, '.arduino15', 'packages');
        }
        return path.join(arduinoPackagePath, 'AZ3166', 'hardware', 'stm32f4');
    }
}
AZ3166Device._boardId = 'devkit';
exports.AZ3166Device = AZ3166Device;
//# sourceMappingURL=AZ3166Device.js.map