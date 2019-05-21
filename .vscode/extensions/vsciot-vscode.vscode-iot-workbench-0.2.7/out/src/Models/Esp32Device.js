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
const copypaste = require("copy-paste");
const fs = require("fs-plus");
const guid_typescript_1 = require("guid-typescript");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const boardProvider_1 = require("../boardProvider");
const configHandler_1 = require("../configHandler");
const constants_1 = require("../constants");
const ArduinoDeviceBase_1 = require("./ArduinoDeviceBase");
const Device_1 = require("./Interfaces/Device");
const constants = {
    defaultBoardInfo: 'esp32:esp32:m5stack-core-esp32',
    defaultBoardConfig: 'FlashMode=qio,FlashFreq=80,UploadSpeed=921600,DebugLevel=none'
};
class Esp32Device extends ArduinoDeviceBase_1.ArduinoDeviceBase {
    constructor(context, channel, devicePath, sketchFileTemplateName) {
        super(context, devicePath, Device_1.DeviceType.IoT_Button);
        this.sketchFileTemplateName = '';
        this.name = 'Esp32Arduino';
        this.channel = channel;
        this.componentId = guid_typescript_1.Guid.create().toString();
        if (sketchFileTemplateName) {
            this.sketchFileTemplateName = sketchFileTemplateName;
        }
    }
    get id() {
        return this.componentId;
    }
    static get boardId() {
        return Esp32Device._boardId;
    }
    get board() {
        const boardProvider = new boardProvider_1.BoardProvider(this.extensionContext);
        const esp32 = boardProvider.find({ id: Esp32Device._boardId });
        return esp32;
    }
    get version() {
        const plat = os.platform();
        let packageRootPath = '';
        let version = '0.0.1';
        if (plat === 'win32') {
            const homeDir = os.homedir();
            const localAppData = path.join(homeDir, 'AppData', 'Local');
            packageRootPath = path.join(localAppData, 'Arduino15', 'packages', 'esp32', 'hardware', 'esp32');
        }
        else {
            packageRootPath = '~/Library/Arduino15/packages/esp32/hardware/esp32';
        }
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
            if (!this.sketchFileTemplateName) {
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
            yield this.generateSketchFile(this.sketchFileTemplateName, this.board, constants.defaultBoardInfo, constants.defaultBoardConfig);
            return true;
        });
    }
    configDeviceSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const configSelectionItems = [
                {
                    label: 'Copy device connection string',
                    description: 'Copy device connection string',
                    detail: 'Copy'
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
            else if (configSelection.detail === 'Copy') {
                const deviceConnectionString = configHandler_1.ConfigHandler.get(constants_1.ConfigKey.iotHubDeviceConnectionString);
                if (!deviceConnectionString) {
                    throw new Error('Unable to get the device connection string, please invoke the command of Azure Provision first.');
                }
                copypaste.copy(deviceConnectionString);
                return true;
            }
            return false;
        });
    }
    preCompileAction() {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    preUploadAction() {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
}
Esp32Device._boardId = 'esp32';
exports.Esp32Device = Esp32Device;
//# sourceMappingURL=Esp32Device.js.map