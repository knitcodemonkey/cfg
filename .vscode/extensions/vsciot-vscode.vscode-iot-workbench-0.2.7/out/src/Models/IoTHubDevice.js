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
const iothub = require("azure-iothub");
const guid_typescript_1 = require("guid-typescript");
const vscode = require("vscode");
const configHandler_1 = require("../configHandler");
const constants_1 = require("../constants");
const Apis_1 = require("./Apis");
const Api_1 = require("./Interfaces/Api");
const Component_1 = require("./Interfaces/Component");
class IoTHubDevice {
    constructor(channel) {
        this.dependencies = [];
        this.name = 'IoT Hub Device';
        this.componentType = Component_1.ComponentType.IoTHubDevice;
        this.channel = channel;
        this.componentId = guid_typescript_1.Guid.create().toString();
    }
    get id() {
        return this.componentId;
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
            return true;
        });
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    provision() {
        return __awaiter(this, void 0, void 0, function* () {
            const iotHubConnectionString = configHandler_1.ConfigHandler.get(constants_1.ConfigKey.iotHubConnectionString);
            if (!iotHubConnectionString) {
                throw new Error('Unable to find IoT Hub connection in the project. Please retry Azure Provision.');
            }
            const selection = yield vscode.window.showQuickPick(getProvisionIothubDeviceSelection(iotHubConnectionString), { ignoreFocusOut: true, placeHolder: 'Provision IoTHub Device' });
            if (!selection) {
                return false;
            }
            const toolkit = Apis_1.getExtension(Api_1.extensionName.Toolkit);
            if (toolkit === undefined) {
                const error = new Error('Azure IoT Hub Toolkit is not installed. Please install it from Marketplace.');
                throw error;
            }
            let device = null;
            try {
                switch (selection.detail) {
                    case 'select':
                        device = yield toolkit.azureIoTExplorer.getDevice(null, iotHubConnectionString, this.channel);
                        if (device === undefined) {
                            return false;
                        }
                        else {
                            yield configHandler_1.ConfigHandler.update(constants_1.ConfigKey.iotHubDeviceConnectionString, device.connectionString);
                        }
                        break;
                    case 'create':
                        device = yield toolkit.azureIoTExplorer.createDevice(false, iotHubConnectionString, this.channel);
                        if (device === undefined) {
                            return false;
                        }
                        else {
                            yield configHandler_1.ConfigHandler.update(constants_1.ConfigKey.iotHubDeviceConnectionString, device.connectionString);
                        }
                        break;
                    default:
                        break;
                }
                return true;
            }
            catch (error) {
                throw error;
            }
        });
    }
    updateConfigSettings(componentInfo) { }
}
exports.IoTHubDevice = IoTHubDevice;
function getProvisionIothubDeviceSelection(iotHubConnectionString) {
    return __awaiter(this, void 0, void 0, function* () {
        let provisionIothubDeviceSelection;
        const deviceNumber = yield getDeviceNumber(iotHubConnectionString);
        if (deviceNumber > 0) {
            provisionIothubDeviceSelection = [
                {
                    label: 'Select an existing IoT Hub device',
                    description: 'Select an existing IoT Hub device',
                    detail: 'select'
                },
                {
                    label: 'Create a new IoT Hub device',
                    description: 'Create a new IoT Hub device',
                    detail: 'create'
                }
            ];
        }
        else {
            provisionIothubDeviceSelection = [{
                    label: 'Create a new IoT Hub device',
                    description: 'Create a new IoT Hub device',
                    detail: 'create'
                }];
        }
        return provisionIothubDeviceSelection;
    });
}
function getDeviceNumber(iotHubConnectionString) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const registry = iothub.Registry.fromConnectionString(iotHubConnectionString);
            registry.list((err, list) => {
                if (err) {
                    return reject(err);
                }
                if (list === undefined) {
                    return resolve(0);
                }
                else {
                    return resolve(list.length);
                }
            });
        });
    });
}
//# sourceMappingURL=IoTHubDevice.js.map