// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';
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
const path = require("path");
const vscode = require("vscode");
const utils = require("../utils");
const WebSiteManagementClient = require("azure-arm-website");
const Component_1 = require("./Interfaces/Component");
const configHandler_1 = require("../configHandler");
const constants_1 = require("../constants");
const Apis_1 = require("./Apis");
const Api_1 = require("./Interfaces/Api");
const guid_typescript_1 = require("guid-typescript");
const impor = require('impor')(__dirname);
const azureUtilityModule = impor('./AzureUtility');
class AzureFunctions {
    constructor(azureFunctionsPath, functionFolder, channel, language = null, dependencyComponents = null) {
        this.dependencies = [];
        this.azureAccountExtension = Apis_1.getExtension(Api_1.extensionName.AzureAccount);
        this.name = 'Azure Functions';
        this.componentType = Component_1.ComponentType.AzureFunctions;
        this.channel = channel;
        this.azureFunctionsPath = azureFunctionsPath;
        this.functionLanguage = language;
        this.functionFolder = functionFolder;
        this.componentId = guid_typescript_1.Guid.create().toString();
        if (dependencyComponents && dependencyComponents.length > 0) {
            dependencyComponents.forEach(dependency => this.dependencies.push({ id: dependency.component.id.toString(), type: dependency.type }));
        }
    }
    get id() {
        return this.componentId;
    }
    getCredentialFromSubscriptionId(subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.azureAccountExtension) {
                throw new Error('Azure account extension is not found.');
            }
            if (!subscriptionId) {
                throw new Error('Subscription ID is required.');
            }
            const subscriptions = this.azureAccountExtension.filters;
            for (let i = 0; i < subscriptions.length; i++) {
                const subscription = subscriptions[i];
                if (subscription.subscription.subscriptionId === subscriptionId) {
                    return subscription.session.credentials;
                }
            }
            return undefined;
        });
    }
    getComponentType() {
        return this.componentType;
    }
    static isAvailable() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!vscode.extensions.getExtension(constants_1.DependentExtensions.azureFunctions)) {
                const choice = yield vscode.window.showInformationMessage('Azure Functions extension is required for the current project. Do you want to install it from marketplace?', 'Yes', 'No');
                if (choice === 'Yes') {
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('vscode:extension/' + constants_1.DependentExtensions.azureFunctions));
                }
                return false;
            }
            return true;
        });
    }
    checkPrerequisites() {
        return __awaiter(this, void 0, void 0, function* () {
            const isFunctionsExtensionAvailable = yield AzureFunctions.isAvailable();
            if (!isFunctionsExtensionAvailable) {
                return false;
            }
            return true;
        });
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            const azureConfigFilePath = path.join(this.azureFunctionsPath, '..', constants_1.AzureComponentsStorage.folderName, constants_1.AzureComponentsStorage.fileName);
            if (!fs.existsSync(azureConfigFilePath)) {
                return false;
            }
            let azureConfigs;
            try {
                azureConfigs = JSON.parse(fs.readFileSync(azureConfigFilePath, 'utf8'));
            }
            catch (error) {
                return false;
            }
            const azureFunctionsConfig = azureConfigs.componentConfigs.find(config => config.folder === this.functionFolder);
            if (azureFunctionsConfig) {
                this.componentId = azureFunctionsConfig.id;
                this.dependencies = azureFunctionsConfig.dependencies;
                if (azureFunctionsConfig.componentInfo) {
                    this.functionLanguage =
                        azureFunctionsConfig.componentInfo.values.functionLanguage;
                }
                // Load other information from config file.
            }
            return true;
        });
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            const azureFunctionsPath = this.azureFunctionsPath;
            console.log(azureFunctionsPath);
            if (!fs.existsSync(azureFunctionsPath)) {
                throw new Error('Unable to find the Azure Functions folder inside the project.');
            }
            if (!this.functionLanguage) {
                const picks = [
                    { label: constants_1.AzureFunctionsLanguage.CSharpScript, description: '' },
                    { label: constants_1.AzureFunctionsLanguage.JavaScript, description: '' },
                    { label: constants_1.AzureFunctionsLanguage.CSharpLibrary, description: '' }
                ];
                const languageSelection = yield vscode.window.showQuickPick(picks, {
                    ignoreFocusOut: true,
                    matchOnDescription: true,
                    matchOnDetail: true,
                    placeHolder: 'Select a language for Azure Functions',
                });
                if (!languageSelection) {
                    throw new Error('Unable to get the language for Azure Functions. Creating project for Azure Functions canceled.');
                }
                this.functionLanguage = languageSelection.label;
            }
            const templateName = utils.getScriptTemplateNameFromLanguage(this.functionLanguage);
            if (!templateName) {
                throw new Error('Unable to get the template for Azure Functions.Creating project for Azure Functions canceled.');
            }
            try {
                if (this.functionLanguage === constants_1.AzureFunctionsLanguage.CSharpLibrary) {
                    yield vscode.commands.executeCommand('azureFunctions.createNewProject', azureFunctionsPath, this.functionLanguage, '~2', false /* openFolder */, templateName, 'IoTHubTrigger1', {
                        connection: 'eventHubConnectionString',
                        path: '%eventHubConnectionPath%',
                        consumerGroup: '$Default',
                        namespace: 'IoTWorkbench'
                    });
                }
                else {
                    yield vscode.commands.executeCommand('azureFunctions.createNewProject', azureFunctionsPath, this.functionLanguage, '~1', false /* openFolder */, templateName, 'IoTHubTrigger1', {
                        connection: 'eventHubConnectionString',
                        path: '%eventHubConnectionPath%',
                        consumerGroup: '$Default'
                    });
                }
                this.updateConfigSettings({ values: { functionLanguage: this.functionLanguage } });
                return true;
            }
            catch (error) {
                throw error;
            }
        });
    }
    provision() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscriptionId = azureUtilityModule.AzureUtility.subscriptionId;
                if (!subscriptionId) {
                    return false;
                }
                const resourceGroup = azureUtilityModule.AzureUtility.resourceGroup;
                if (!resourceGroup) {
                    return false;
                }
                const functionAppId = yield vscode.commands.executeCommand('azureFunctions.createFunctionApp', subscriptionId, resourceGroup);
                if (functionAppId) {
                    yield configHandler_1.ConfigHandler.update(constants_1.ConfigKey.functionAppId, functionAppId);
                    const eventHubConnectionString = configHandler_1.ConfigHandler.get(constants_1.ConfigKey.eventHubConnectionString);
                    const eventHubConnectionPath = configHandler_1.ConfigHandler.get(constants_1.ConfigKey.eventHubConnectionPath);
                    const iotHubConnectionString = configHandler_1.ConfigHandler.get(constants_1.ConfigKey.iotHubConnectionString);
                    if (!eventHubConnectionString || !eventHubConnectionPath) {
                        throw new Error('No event hub path or connection string found.');
                    }
                    const credential = yield this.getCredentialFromSubscriptionId(subscriptionId);
                    if (credential === undefined) {
                        throw new Error('Unable to get credential for the subscription.');
                    }
                    const resourceGroupMatches = functionAppId.match(/\/resourceGroups\/([^\/]*)/);
                    if (!resourceGroupMatches || resourceGroupMatches.length < 2) {
                        throw new Error('Cannot parse resource group from function app ID.');
                    }
                    const resourceGroup = resourceGroupMatches[1];
                    const siteNameMatches = functionAppId.match(/\/sites\/([^\/]*)/);
                    if (!siteNameMatches || siteNameMatches.length < 2) {
                        throw new Error('Cannot parse function app name from function app ID.');
                    }
                    const siteName = siteNameMatches[1];
                    const client = new WebSiteManagementClient(credential, subscriptionId);
                    console.log(resourceGroup, siteName);
                    const appSettings = yield client.webApps.listApplicationSettings(resourceGroup, siteName);
                    console.log(appSettings);
                    appSettings.properties = appSettings.properties || {};
                    // for c# library, use the default setting of ~2.
                    if (this.functionLanguage !==
                        constants_1.AzureFunctionsLanguage.CSharpLibrary) {
                        appSettings.properties['FUNCTIONS_EXTENSION_VERSION'] = '~1';
                    }
                    else {
                        appSettings.properties['FUNCTIONS_EXTENSION_VERSION'] = '~2';
                    }
                    appSettings.properties['eventHubConnectionString'] =
                        eventHubConnectionString || '';
                    appSettings.properties['eventHubConnectionPath'] =
                        eventHubConnectionPath || '';
                    appSettings.properties['iotHubConnectionString'] =
                        iotHubConnectionString || '';
                    // see detail:
                    // https://github.com/Microsoft/vscode-iot-workbench/issues/436
                    appSettings.properties['WEBSITE_RUN_FROM_PACKAGE'] = '0';
                    yield client.webApps.updateApplicationSettings(resourceGroup, siteName, appSettings);
                    return true;
                }
                else {
                    throw new Error('Creating Azure Functions application failed. Please check the error log in output window.');
                }
            }
            catch (error) {
                throw error;
            }
        });
    }
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            let deployPending = null;
            if (this.channel) {
                this.channel.show();
                this.channel.appendLine('Deploying Azure Functions App...');
                deployPending = setInterval(() => {
                    this.channel.append('.');
                }, 1000);
            }
            try {
                const azureFunctionsPath = this.azureFunctionsPath;
                const functionAppId = configHandler_1.ConfigHandler.get(constants_1.ConfigKey.functionAppId);
                if (this.functionLanguage !==
                    constants_1.AzureFunctionsLanguage.CSharpLibrary) {
                    yield vscode.commands.executeCommand('azureFunctions.deploy', azureFunctionsPath, functionAppId);
                }
                else {
                    const subPath = path.join(azureFunctionsPath, 'bin/Release/netcoreapp2.1/publish');
                    yield vscode.commands.executeCommand('azureFunctions.deploy', subPath, functionAppId);
                }
                console.log(azureFunctionsPath, functionAppId);
                if (this.channel && deployPending) {
                    clearInterval(deployPending);
                    this.channel.appendLine('.');
                }
                return true;
            }
            catch (error) {
                if (this.channel && deployPending) {
                    clearInterval(deployPending);
                    this.channel.appendLine('.');
                }
                throw error;
            }
        });
    }
    updateConfigSettings(componentInfo) {
        const azureConfigFilePath = path.join(this.azureFunctionsPath, '..', constants_1.AzureComponentsStorage.folderName, constants_1.AzureComponentsStorage.fileName);
        let azureConfigs = { componentConfigs: [] };
        try {
            azureConfigs = JSON.parse(fs.readFileSync(azureConfigFilePath, 'utf8'));
        }
        catch (error) {
            const e = new Error('Invalid azure components config file.');
            throw e;
        }
        const azureFunctionsConfig = azureConfigs.componentConfigs.find(config => config.id === (this.id));
        if (azureFunctionsConfig) {
            // TODO: update the existing setting for the provision result
        }
        else {
            const newAzureFunctionsConfig = {
                id: this.id,
                folder: this.functionFolder,
                name: '',
                dependencies: this.dependencies,
                type: Component_1.ComponentType[this.componentType],
                componentInfo
            };
            azureConfigs.componentConfigs.push(newAzureFunctionsConfig);
            fs.writeFileSync(azureConfigFilePath, JSON.stringify(azureConfigs, null, 4));
        }
    }
}
exports.AzureFunctions = AzureFunctions;
//# sourceMappingURL=AzureFunctions.js.map