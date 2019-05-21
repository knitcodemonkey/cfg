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
const vscode = require("vscode");
const configHandler_1 = require("../configHandler");
const constants_1 = require("../constants");
const Apis_1 = require("./Apis");
const AzureComponentConfig_1 = require("./AzureComponentConfig");
const AzureUtility_1 = require("./AzureUtility");
const Api_1 = require("./Interfaces/Api");
const Component_1 = require("./Interfaces/Component");
class IoTHub {
    constructor(projectRoot, channel) {
        this.dependencies = [];
        this.name = 'IoT Hub';
        this.componentType = Component_1.ComponentType.IoTHub;
        this.channel = channel;
        this.componentId = guid_typescript_1.Guid.create().toString();
        this.projectRootPath = projectRoot;
        this.azureConfigFileHandler = new AzureComponentConfig_1.AzureConfigFileHandler(projectRoot);
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
            const azureConfigFilePath = path.join(this.projectRootPath, constants_1.AzureComponentsStorage.folderName, constants_1.AzureComponentsStorage.fileName);
            if (!fs.existsSync(azureConfigFilePath)) {
                return false;
            }
            let azureConfigs;
            try {
                azureConfigs = JSON.parse(fs.readFileSync(azureConfigFilePath, 'utf8'));
                const iotHubConfig = azureConfigs.componentConfigs.find(config => config.type === Component_1.ComponentType[this.componentType]);
                if (iotHubConfig) {
                    this.componentId = iotHubConfig.id;
                    this.dependencies = iotHubConfig.dependencies;
                    // Load other information from config file.
                }
            }
            catch (error) {
                return false;
            }
            return true;
        });
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateConfigSettings();
            return true;
        });
    }
    provision() {
        return __awaiter(this, void 0, void 0, function* () {
            const provisionIothubSelection = [
                {
                    label: 'Select an existing IoT Hub',
                    description: 'Select an existing IoT Hub',
                    detail: 'select'
                },
                {
                    label: 'Create a new IoT Hub',
                    description: 'Create a new IoT Hub',
                    detail: 'create'
                }
            ];
            const selection = yield vscode.window.showQuickPick(provisionIothubSelection, { ignoreFocusOut: true, placeHolder: 'Provision IoT Hub' });
            if (!selection) {
                return false;
            }
            const toolkit = Apis_1.getExtension(Api_1.extensionName.Toolkit);
            if (toolkit === undefined) {
                const error = new Error('Azure IoT Hub Toolkit is not installed. Please install it from Marketplace.');
                throw error;
            }
            let iothub = null;
            const subscriptionId = AzureUtility_1.AzureUtility.subscriptionId;
            const resourceGroup = AzureUtility_1.AzureUtility.resourceGroup;
            switch (selection.detail) {
                case 'select':
                    iothub = yield toolkit.azureIoTExplorer.selectIoTHub(this.channel, subscriptionId);
                    break;
                case 'create':
                    if (this.channel) {
                        this.channel.show();
                        this.channel.appendLine('Creating new IoT Hub...');
                    }
                    iothub = yield toolkit.azureIoTExplorer.createIoTHub(this.channel, subscriptionId, resourceGroup);
                    break;
                default:
                    break;
            }
            if (iothub && iothub.iotHubConnectionString) {
                if (this.channel) {
                    this.channel.show();
                    this.channel.appendLine(JSON.stringify(iothub, null, 2));
                }
                const sharedAccessKeyMatches = iothub.iotHubConnectionString.match(/SharedAccessKey=([^;]*)/);
                if (!sharedAccessKeyMatches || sharedAccessKeyMatches.length < 2) {
                    throw new Error('Cannot parse shared access key from IoT Hub connection string. Please retry Azure Provision.');
                }
                const sharedAccessKey = sharedAccessKeyMatches[1];
                const eventHubConnectionString = `Endpoint=${iothub.properties.eventHubEndpoints.events
                    .endpoint};SharedAccessKeyName=iothubowner;SharedAccessKey=${sharedAccessKey}`;
                const eventHubConnectionPath = iothub.properties.eventHubEndpoints.events.path;
                yield configHandler_1.ConfigHandler.update(constants_1.ConfigKey.iotHubConnectionString, iothub.iotHubConnectionString);
                yield configHandler_1.ConfigHandler.update(constants_1.ConfigKey.eventHubConnectionString, eventHubConnectionString);
                yield configHandler_1.ConfigHandler.update(constants_1.ConfigKey.eventHubConnectionPath, eventHubConnectionPath);
                this.updateConfigSettings({
                    values: {
                        iotHubConnectionString: iothub.iotHubConnectionString,
                        eventHubConnectionString,
                        eventHubConnectionPath
                    }
                });
                if (this.channel) {
                    this.channel.show();
                    this.channel.appendLine('IoT Hub provision succeeded.');
                }
                return true;
            }
            else if (!iothub) {
                return false;
            }
            else {
                throw new Error('IoT Hub provision failed. Please check output window for detail.');
            }
        });
    }
    updateConfigSettings(componentInfo) {
        const iotHubComponentIndex = this.azureConfigFileHandler.getComponentIndexById(this.id);
        if (iotHubComponentIndex > -1) {
            if (!componentInfo) {
                return;
            }
            this.azureConfigFileHandler.updateComponent(iotHubComponentIndex, componentInfo);
        }
        else {
            const newIoTHubConfig = {
                id: this.id,
                folder: '',
                name: '',
                dependencies: [],
                type: Component_1.ComponentType[this.componentType],
                componentInfo
            };
            this.azureConfigFileHandler.appendComponent(newIoTHubConfig);
        }
    }
}
exports.IoTHub = IoTHub;
//# sourceMappingURL=IoTHub.js.map