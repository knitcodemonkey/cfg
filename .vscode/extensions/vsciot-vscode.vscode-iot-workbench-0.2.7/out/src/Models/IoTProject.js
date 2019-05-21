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
const path = require("path");
const vscode = require("vscode");
const configHandler_1 = require("../configHandler");
const constants_1 = require("../constants");
const constants_2 = require("../constants");
const telemetry_1 = require("../telemetry");
const utils_1 = require("../utils");
const Apis_1 = require("./Apis");
const Component_1 = require("./Interfaces/Component");
const ProjectTemplate_1 = require("./Interfaces/ProjectTemplate");
const impor = require('impor')(__dirname);
const az3166DeviceModule = impor('./AZ3166Device');
const azureComponentConfigModule = impor('./AzureComponentConfig');
const azureFunctionsModule = impor('./AzureFunctions');
const azureUtilityModule = impor('./AzureUtility');
const cosmosDBModule = impor('./CosmosDB');
const esp32DeviceModule = impor('./Esp32Device');
const ioTButtonDeviceModule = impor('./IoTButtonDevice');
const ioTHubModule = impor('./IoTHub');
const ioTHubDeviceModule = impor('./IoTHubDevice');
const raspberryPiDeviceModule = impor('./RaspberryPiDevice');
const streamAnalyticsJobModule = impor('./StreamAnalyticsJob');
const telemetryModule = impor('../telemetry');
const constants = {
    deviceDefaultFolderName: 'Device',
    functionDefaultFolderName: 'Functions',
    asaFolderName: 'StreamAnalytics',
    workspaceConfigExtension: '.code-workspace'
};
class IoTProject {
    constructor(context, channel, telemetryContext) {
        this.projectRootPath = '';
        this.componentList = [];
        this.extensionContext = context;
        this.channel = channel;
        this.telemetryContext = telemetryContext;
    }
    canProvision(comp) {
        return comp.provision !== undefined;
    }
    canDeploy(comp) {
        return comp.deploy !== undefined;
    }
    canCompile(comp) {
        return comp.compile !== undefined;
    }
    canUpload(comp) {
        return comp.upload !== undefined;
    }
    load(initLoad = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!vscode.workspace.workspaceFolders) {
                return false;
            }
            const devicePath = configHandler_1.ConfigHandler.get(constants_1.ConfigKey.devicePath);
            if (!devicePath) {
                return false;
            }
            this.projectRootPath =
                path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '..');
            const deviceLocation = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '..', devicePath);
            const iotWorkbenchProjectFile = path.join(deviceLocation, constants_1.FileNames.iotworkbenchprojectFileName);
            if (!fs.existsSync(iotWorkbenchProjectFile)) {
                return false;
            }
            // only send telemetry when the IoT project is load when VS Code opens
            if (initLoad) {
                const properties = {
                    result: 'Succeeded',
                    error: '',
                    errorMessage: ''
                };
                const telemetryContext = { properties, measurements: { duration: 0 } };
                try {
                    telemetry_1.TelemetryWorker.sendEvent(constants_2.EventNames.projectLoadEvent, telemetryContext);
                }
                catch (_a) {
                    // If sending telemetry failed, skip the error to avoid blocking user.
                }
            }
            const azureConfigFileHandler = new azureComponentConfigModule.AzureConfigFileHandler(this.projectRootPath);
            azureConfigFileHandler.createIfNotExists();
            if (deviceLocation !== undefined) {
                const boardId = configHandler_1.ConfigHandler.get(constants_1.ConfigKey.boardId);
                if (!boardId) {
                    return false;
                }
                let device = null;
                if (boardId === az3166DeviceModule.AZ3166Device.boardId) {
                    device = new az3166DeviceModule.AZ3166Device(this.extensionContext, this.channel, deviceLocation);
                }
                else if (boardId === ioTButtonDeviceModule.IoTButtonDevice.boardId) {
                    device = new ioTButtonDeviceModule.IoTButtonDevice(this.extensionContext, deviceLocation);
                }
                else if (boardId === esp32DeviceModule.Esp32Device.boardId) {
                    device = new esp32DeviceModule.Esp32Device(this.extensionContext, this.channel, deviceLocation);
                }
                else if (boardId === raspberryPiDeviceModule.RaspberryPiDevice.boardId) {
                    device = new raspberryPiDeviceModule.RaspberryPiDevice(this.extensionContext, deviceLocation, this.channel);
                }
                if (device) {
                    this.componentList.push(device);
                    yield device.load();
                }
            }
            const componentConfigs = azureConfigFileHandler.getSortedComponents();
            if (!componentConfigs || componentConfigs.length === 0) {
                // Support backward compact
                const iotHub = new ioTHubModule.IoTHub(this.projectRootPath, this.channel);
                yield iotHub.updateConfigSettings();
                yield iotHub.load();
                this.componentList.push(iotHub);
                const device = new ioTHubDeviceModule.IoTHubDevice(this.channel);
                this.componentList.push(device);
                const functionPath = configHandler_1.ConfigHandler.get(constants_1.ConfigKey.functionPath);
                if (functionPath) {
                    const functionLocation = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '..', functionPath);
                    const functionApp = new azureFunctionsModule.AzureFunctions(functionLocation, functionPath, this.channel, null, [{
                            component: iotHub,
                            type: azureComponentConfigModule.DependencyType.Input
                        }]);
                    yield functionApp.updateConfigSettings();
                    yield functionApp.load();
                    this.componentList.push(functionApp);
                }
                this.componentList.forEach(item => {
                    item.checkPrerequisites();
                });
                return true;
            }
            const components = {};
            for (const componentConfig of componentConfigs) {
                switch (componentConfig.type) {
                    case 'IoTHub': {
                        const iotHub = new ioTHubModule.IoTHub(this.projectRootPath, this.channel);
                        yield iotHub.load();
                        components[iotHub.id] = iotHub;
                        this.componentList.push(iotHub);
                        const device = new ioTHubDeviceModule.IoTHubDevice(this.channel);
                        this.componentList.push(device);
                        break;
                    }
                    case 'AzureFunctions': {
                        const functionPath = configHandler_1.ConfigHandler.get(constants_1.ConfigKey.functionPath);
                        if (!functionPath) {
                            return false;
                        }
                        const functionLocation = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '..', functionPath);
                        if (functionLocation) {
                            const functionApp = new azureFunctionsModule.AzureFunctions(functionLocation, functionPath, this.channel);
                            yield functionApp.load();
                            components[functionApp.id] = functionApp;
                            this.componentList.push(functionApp);
                        }
                        break;
                    }
                    case 'StreamAnalyticsJob': {
                        const dependencies = [];
                        for (const dependent of componentConfig.dependencies) {
                            const component = components[dependent.id];
                            if (!component) {
                                throw new Error(`Cannot find component with id ${dependent}.`);
                            }
                            dependencies.push({ component, type: dependent.type });
                        }
                        const queryPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '..', constants.asaFolderName, 'query.asaql');
                        const asa = new streamAnalyticsJobModule.StreamAnalyticsJob(queryPath, this.extensionContext, this.projectRootPath, this.channel, dependencies);
                        yield asa.load();
                        components[asa.id] = asa;
                        this.componentList.push(asa);
                        break;
                    }
                    case 'CosmosDB': {
                        const dependencies = [];
                        for (const dependent of componentConfig.dependencies) {
                            const component = components[dependent.id];
                            if (!component) {
                                throw new Error(`Cannot find component with id ${dependent}.`);
                            }
                            dependencies.push({ component, type: dependent.type });
                        }
                        const cosmosDB = new cosmosDBModule.CosmosDB(this.extensionContext, this.projectRootPath, this.channel, dependencies);
                        yield cosmosDB.load();
                        components[cosmosDB.id] = cosmosDB;
                        this.componentList.push(cosmosDB);
                        break;
                    }
                    default: {
                        throw new Error(`Component not supported with type of ${componentConfig.type}.`);
                    }
                }
            }
            this.componentList.forEach(item => {
                item.checkPrerequisites();
            });
            return true;
        });
    }
    handleLoadFailure() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!vscode.workspace.workspaceFolders ||
                !vscode.workspace.workspaceFolders[0]) {
                yield utils_1.askAndNewProject(this.telemetryContext);
                return;
            }
            const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const workbenchFileName = path.join(rootPath, 'Device', constants_1.FileNames.iotworkbenchprojectFileName);
            const workspaceFiles = fs.readdirSync(rootPath).filter(file => path.extname(file).endsWith(constants_1.FileNames.workspaceExtensionName));
            if (fs.existsSync(workbenchFileName) && workspaceFiles &&
                workspaceFiles[0]) {
                yield utils_1.askAndOpenProject(rootPath, workspaceFiles[0], this.telemetryContext);
            }
            else {
                yield utils_1.askAndNewProject(this.telemetryContext);
            }
        });
    }
    compile() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const item of this.componentList) {
                if (this.canCompile(item)) {
                    const isPrerequisitesAchieved = yield item.checkPrerequisites();
                    if (!isPrerequisitesAchieved) {
                        return false;
                    }
                    const res = yield item.compile();
                    if (res === false) {
                        const error = new Error('Unable to compile the device code, please check output window for detail.');
                        throw error;
                    }
                }
            }
            return true;
        });
    }
    upload() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const item of this.componentList) {
                if (this.canUpload(item)) {
                    const isPrerequisitesAchieved = yield item.checkPrerequisites();
                    if (!isPrerequisitesAchieved) {
                        return false;
                    }
                    const res = yield item.upload();
                    if (res === false) {
                        const error = new Error('Unable to upload the sketch, please check output window for detail.');
                        throw error;
                    }
                }
            }
            return true;
        });
    }
    provision() {
        return __awaiter(this, void 0, void 0, function* () {
            const devicePath = configHandler_1.ConfigHandler.get(constants_1.ConfigKey.devicePath);
            if (!devicePath) {
                throw new Error('Cannot run IoT Device Workbench command in a non-IoTWorkbench project. Please initialize an IoT Device Workbench project first.');
            }
            const provisionItemList = [];
            for (const item of this.componentList) {
                if (this.canProvision(item)) {
                    const isPrerequisitesAchieved = yield item.checkPrerequisites();
                    if (!isPrerequisitesAchieved) {
                        return false;
                    }
                    provisionItemList.push(item.name);
                }
            }
            if (provisionItemList.length === 0) {
                // nothing to provision:
                vscode.window.showInformationMessage('Congratulations! There is no Azure service to provision in this project.');
                return false;
            }
            // Ensure azure login before component provision
            let subscriptionId = '';
            let resourceGroup = '';
            if (provisionItemList.length > 0) {
                yield Apis_1.checkAzureLogin();
                azureUtilityModule.AzureUtility.init(this.extensionContext, this.channel);
                resourceGroup = yield azureUtilityModule.AzureUtility.getResourceGroup();
                subscriptionId = azureUtilityModule.AzureUtility.subscriptionId;
                if (!resourceGroup || !subscriptionId) {
                    return false;
                }
            }
            else {
                return false;
            }
            for (const item of this.componentList) {
                const _provisionItemList = [];
                if (this.canProvision(item)) {
                    for (let i = 0; i < provisionItemList.length; i++) {
                        if (provisionItemList[i] === item.name) {
                            _provisionItemList[i] = `>> ${i + 1}. ${provisionItemList[i]}`;
                        }
                        else {
                            _provisionItemList[i] = `${i + 1}. ${provisionItemList[i]}`;
                        }
                    }
                    const selection = yield vscode.window.showQuickPick([{
                            label: _provisionItemList.join('   -   '),
                            description: '',
                            detail: 'Click to continue'
                        }], { ignoreFocusOut: true, placeHolder: 'Provision process' });
                    if (!selection) {
                        return false;
                    }
                    const res = yield item.provision();
                    if (res === false) {
                        vscode.window.showWarningMessage('Provision canceled.');
                        return false;
                    }
                }
            }
            return true;
        });
    }
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            let azureLoggedIn = false;
            const deployItemList = [];
            for (const item of this.componentList) {
                if (this.canDeploy(item)) {
                    const isPrerequisitesAchieved = yield item.checkPrerequisites();
                    if (!isPrerequisitesAchieved) {
                        return false;
                    }
                    deployItemList.push(item.name);
                }
            }
            if (deployItemList && deployItemList.length <= 0) {
                yield vscode.window.showInformationMessage('Congratulations! The project does not contain any Azure components to be deployed.');
                return false;
            }
            if (!azureLoggedIn) {
                azureLoggedIn = yield Apis_1.checkAzureLogin();
            }
            for (const item of this.componentList) {
                const _deployItemList = [];
                if (this.canDeploy(item)) {
                    for (let i = 0; i < deployItemList.length; i++) {
                        if (deployItemList[i] === item.name) {
                            _deployItemList[i] = `>> ${i + 1}. ${deployItemList[i]}`;
                        }
                        else {
                            _deployItemList[i] = `${i + 1}. ${deployItemList[i]}`;
                        }
                    }
                    const selection = yield vscode.window.showQuickPick([{
                            label: _deployItemList.join('   -   '),
                            description: '',
                            detail: 'Click to continue'
                        }], { ignoreFocusOut: true, placeHolder: 'Deploy process' });
                    if (!selection) {
                        return false;
                    }
                    const res = yield item.deploy();
                    if (res === false) {
                        const error = new Error(`The deployment of ${item.name} failed.`);
                        throw error;
                    }
                }
            }
            vscode.window.showInformationMessage('Azure deploy succeeded.');
            return true;
        });
    }
    create(rootFolderPath, projectTemplateItem, boardId, openInNewWindow) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!fs.existsSync(rootFolderPath)) {
                throw new Error('Unable to find the root path, please open the folder and initialize project again.');
            }
            this.projectRootPath = rootFolderPath;
            const workspace = { folders: [], settings: {} };
            // Whatever the template is, we will always create the device.
            const deviceDir = path.join(this.projectRootPath, constants.deviceDefaultFolderName);
            if (!fs.existsSync(deviceDir)) {
                fs.mkdirSync(deviceDir);
            }
            // initialize the storage for azure component settings
            const azureConfigFileHandler = new azureComponentConfigModule.AzureConfigFileHandler(this.projectRootPath);
            azureConfigFileHandler.createIfNotExists();
            workspace.folders.push({ path: constants.deviceDefaultFolderName });
            let device;
            if (boardId === az3166DeviceModule.AZ3166Device.boardId) {
                device = new az3166DeviceModule.AZ3166Device(this.extensionContext, this.channel, deviceDir, projectTemplateItem.sketch);
            }
            else if (boardId === ioTButtonDeviceModule.IoTButtonDevice.boardId) {
                device = new ioTButtonDeviceModule.IoTButtonDevice(this.extensionContext, deviceDir, projectTemplateItem.sketch);
            }
            else if (boardId === esp32DeviceModule.Esp32Device.boardId) {
                device = new esp32DeviceModule.Esp32Device(this.extensionContext, this.channel, deviceDir, projectTemplateItem.sketch);
            }
            else if (boardId === raspberryPiDeviceModule.RaspberryPiDevice.boardId) {
                device = new raspberryPiDeviceModule.RaspberryPiDevice(this.extensionContext, deviceDir, this.channel, projectTemplateItem.sketch);
            }
            else {
                throw new Error('The specified board is not supported.');
            }
            const isPrerequisitesAchieved = yield device.checkPrerequisites();
            if (!isPrerequisitesAchieved) {
                return false;
            }
            workspace.settings[`IoTWorkbench.${constants_1.ConfigKey.boardId}`] = boardId;
            this.componentList.push(device);
            // TODO: Consider naming for project level settings.
            const settings = { projectsettings: [] };
            settings.projectsettings.push({ name: constants_1.ConfigKey.devicePath, value: constants.deviceDefaultFolderName });
            workspace.settings[`IoTWorkbench.${constants_1.ConfigKey.devicePath}`] =
                constants.deviceDefaultFolderName;
            const type = (ProjectTemplate_1.ProjectTemplateType)[projectTemplateItem.type];
            switch (type) {
                case ProjectTemplate_1.ProjectTemplateType.Basic:
                    // Save data to configFile
                    break;
                case ProjectTemplate_1.ProjectTemplateType.IotHub: {
                    const iothub = new ioTHubModule.IoTHub(this.projectRootPath, this.channel);
                    const isPrerequisitesAchieved = yield iothub.checkPrerequisites();
                    if (!isPrerequisitesAchieved) {
                        return false;
                    }
                    this.componentList.push(iothub);
                    break;
                }
                case ProjectTemplate_1.ProjectTemplateType.AzureFunctions: {
                    const iothub = new ioTHubModule.IoTHub(this.projectRootPath, this.channel);
                    const isIotHubPrerequisitesAchieved = yield iothub.checkPrerequisites();
                    if (!isIotHubPrerequisitesAchieved) {
                        return false;
                    }
                    const functionDir = path.join(this.projectRootPath, constants.functionDefaultFolderName);
                    if (!fs.existsSync(functionDir)) {
                        fs.mkdirSync(functionDir);
                    }
                    workspace.folders.push({ path: constants.functionDefaultFolderName });
                    const azureFunctions = new azureFunctionsModule.AzureFunctions(functionDir, constants.functionDefaultFolderName, this.channel, null, [{
                            component: iothub,
                            type: azureComponentConfigModule.DependencyType.Input
                        }] /*Dependencies*/);
                    const isFunctionsPrerequisitesAchieved = yield azureFunctions.checkPrerequisites();
                    if (!isFunctionsPrerequisitesAchieved) {
                        return false;
                    }
                    settings.projectsettings.push({
                        name: constants_1.ConfigKey.functionPath,
                        value: constants.functionDefaultFolderName
                    });
                    workspace.settings[`IoTWorkbench.${constants_1.ConfigKey.functionPath}`] =
                        constants.functionDefaultFolderName;
                    this.componentList.push(iothub);
                    this.componentList.push(azureFunctions);
                    break;
                }
                case ProjectTemplate_1.ProjectTemplateType.StreamAnalytics: {
                    const iothub = new ioTHubModule.IoTHub(this.projectRootPath, this.channel);
                    const isIotHubPrerequisitesAchieved = yield iothub.checkPrerequisites();
                    if (!isIotHubPrerequisitesAchieved) {
                        return false;
                    }
                    const cosmosDB = new cosmosDBModule.CosmosDB(this.extensionContext, this.projectRootPath, this.channel);
                    const isCosmosDBPrerequisitesAchieved = yield cosmosDB.checkPrerequisites();
                    if (!isCosmosDBPrerequisitesAchieved) {
                        return false;
                    }
                    const asaDir = path.join(this.projectRootPath, constants.asaFolderName);
                    if (!fs.existsSync(asaDir)) {
                        fs.mkdirSync(asaDir);
                    }
                    const asaFilePath = this.extensionContext.asAbsolutePath(path.join(constants_1.FileNames.resourcesFolderName, 'asaql', 'query.asaql'));
                    const queryPath = path.join(asaDir, 'query.asaql');
                    const asaQueryContent = fs.readFileSync(asaFilePath, 'utf8')
                        .replace(/\[input\]/, `"iothub-${iothub.id}"`)
                        .replace(/\[output\]/, `"cosmosdb-${cosmosDB.id}"`);
                    fs.writeFileSync(queryPath, asaQueryContent);
                    const asa = new streamAnalyticsJobModule.StreamAnalyticsJob(queryPath, this.extensionContext, this.projectRootPath, this.channel, [
                        {
                            component: iothub,
                            type: azureComponentConfigModule.DependencyType.Input
                        },
                        {
                            component: cosmosDB,
                            type: azureComponentConfigModule.DependencyType.Other
                        }
                    ]);
                    const isAsaPrerequisitesAchieved = yield asa.checkPrerequisites();
                    if (!isAsaPrerequisitesAchieved) {
                        return false;
                    }
                    workspace.folders.push({ path: constants.asaFolderName });
                    workspace.settings[`IoTWorkbench.${constants_1.ConfigKey.asaPath}`] =
                        constants.asaFolderName;
                    this.componentList.push(iothub);
                    this.componentList.push(cosmosDB);
                    this.componentList.push(asa);
                    break;
                }
                default:
                    break;
            }
            // Component level creation
            // we cannot use forEach here:
            // https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
            // this.componentList.forEach(async (element: Component) => {
            //   await element.create();
            // });
            try {
                for (let i = 0; i < this.componentList.length; i++) {
                    const res = yield this.componentList[i].create();
                    if (res === false) {
                        fs.removeSync(this.projectRootPath);
                        vscode.window.showWarningMessage('Project initialize canceled.');
                        return false;
                    }
                }
            }
            catch (error) {
                throw error;
            }
            const workspaceConfigFilePath = path.join(this.projectRootPath, `${path.basename(this.projectRootPath)}${constants.workspaceConfigExtension}`);
            fs.writeFileSync(workspaceConfigFilePath, JSON.stringify(workspace, null, 4));
            if (!openInNewWindow) {
                // Need to add telemetry here otherwise, after restart VSCode, no
                // telemetry data will be sent.
                try {
                    telemetryModule.TelemetryWorker.sendEvent(constants_2.EventNames.createNewProjectEvent, this.telemetryContext);
                }
                catch (_a) {
                    // If sending telemetry failed, skip the error to avoid blocking user.
                }
            }
            try {
                setTimeout(() => vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(workspaceConfigFilePath), openInNewWindow), 1000);
                return true;
            }
            catch (error) {
                throw error;
            }
        });
    }
    configDeviceSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const component of this.componentList) {
                if (component.getComponentType() === Component_1.ComponentType.Device) {
                    const device = component;
                    try {
                        yield device.configDeviceSettings();
                    }
                    catch (error) {
                        throw error;
                    }
                }
            }
            return true;
        });
    }
}
exports.IoTProject = IoTProject;
//# sourceMappingURL=IoTProject.js.map