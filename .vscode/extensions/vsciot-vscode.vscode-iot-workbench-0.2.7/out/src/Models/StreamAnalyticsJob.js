"use strict";
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
const constants_1 = require("../constants");
const AzureComponentConfig_1 = require("./AzureComponentConfig");
const AzureUtility_1 = require("./AzureUtility");
const Component_1 = require("./Interfaces/Component");
var StreamAnalyticsAction;
(function (StreamAnalyticsAction) {
    StreamAnalyticsAction[StreamAnalyticsAction["Start"] = 1] = "Start";
    StreamAnalyticsAction[StreamAnalyticsAction["Stop"] = 2] = "Stop";
})(StreamAnalyticsAction || (StreamAnalyticsAction = {}));
class StreamAnalyticsJob {
    constructor(queryPath, context, projectRoot, channel, dependencyComponents = null) {
        this.dependencies = [];
        this.subscriptionId = null;
        this.resourceGroup = null;
        this.streamAnalyticsJobName = null;
        this.azureClient = null;
        this.catchedStreamAnalyticsList = [];
        this.name = 'Stream Analytics Job';
        this.queryPath = queryPath;
        this.componentType = Component_1.ComponentType.StreamAnalyticsJob;
        this.channel = channel;
        this.componentId = guid_typescript_1.Guid.create().toString();
        this.projectRootPath = projectRoot;
        this.azureConfigHandler = new AzureComponentConfig_1.AzureConfigFileHandler(projectRoot);
        this.extensionContext = context;
        if (dependencyComponents && dependencyComponents.length > 0) {
            dependencyComponents.forEach(dependency => this.dependencies.push({ id: dependency.component.id, type: dependency.type }));
        }
    }
    initAzureClient() {
        if (this.subscriptionId && this.resourceGroup &&
            this.streamAnalyticsJobName && this.azureClient) {
            return this.azureClient;
        }
        const componentConfig = this.azureConfigHandler.getComponentById(this.id);
        if (!componentConfig) {
            throw new Error(`Cannot find Azure Stream Analytics component with id ${this.id}.`);
        }
        const componentInfo = componentConfig.componentInfo;
        if (!componentInfo) {
            throw new Error(`You must provision Stream Analytics Job first.`);
        }
        const subscriptionId = componentInfo.values.subscriptionId;
        const resourceGroup = componentInfo.values.resourceGroup;
        const streamAnalyticsJobName = componentInfo.values.streamAnalyticsJobName;
        AzureUtility_1.AzureUtility.init(this.extensionContext, this.channel, subscriptionId);
        const azureClient = AzureUtility_1.AzureUtility.getClient();
        if (!azureClient) {
            throw new Error('Initialize Azure client failed.');
        }
        this.subscriptionId = subscriptionId;
        this.resourceGroup = resourceGroup;
        this.streamAnalyticsJobName = streamAnalyticsJobName;
        this.azureClient = azureClient;
        return azureClient;
    }
    callAction(action) {
        return __awaiter(this, void 0, void 0, function* () {
            const actionResource = `/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroup}/providers/Microsoft.StreamAnalytics/streamingjobs/${this.streamAnalyticsJobName}/${StreamAnalyticsAction[action].toLowerCase()}?api-version=2015-10-01`;
            yield AzureUtility_1.AzureUtility.postRequest(actionResource);
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    clearTimeout(timer);
                    return resolve(false);
                }, 10 * 60 * 1000);
                const timer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    const state = yield this.getState();
                    if (action === StreamAnalyticsAction.Start && state === 'Running' ||
                        action === StreamAnalyticsAction.Stop && state === 'Stopped' ||
                        action === StreamAnalyticsAction.Stop && state === 'Created') {
                        clearTimeout(timeout);
                        clearInterval(timer);
                        return resolve(true);
                    }
                }), 5000);
            });
        });
    }
    getStreamAnalyticsByNameFromCache(name) {
        return this.catchedStreamAnalyticsList.find(item => item.name === name);
    }
    getStreamAnalyticsInResourceGroup() {
        return __awaiter(this, void 0, void 0, function* () {
            const resource = `/subscriptions/${AzureUtility_1.AzureUtility.subscriptionId}/resourceGroups/${AzureUtility_1.AzureUtility
                .resourceGroup}/providers/Microsoft.StreamAnalytics/streamingjobs?api-version=2015-10-01`;
            const asaListRes = yield AzureUtility_1.AzureUtility.getRequest(resource);
            const asaList = [{ label: '$(plus) Create New Stream Analytics Job', description: '' }];
            for (const item of asaListRes.value) {
                asaList.push({ label: item.name, description: item.properties.jobState });
            }
            this.catchedStreamAnalyticsList = asaListRes.value;
            return asaList;
        });
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
                const asaConfig = azureConfigs.componentConfigs.find(config => config.type === Component_1.ComponentType[this.componentType]);
                if (asaConfig) {
                    this.componentId = asaConfig.id;
                    this.dependencies = asaConfig.dependencies;
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
    updateConfigSettings(componentInfo) {
        const asaComponentIndex = this.azureConfigHandler.getComponentIndexById(this.id);
        if (asaComponentIndex > -1) {
            if (!componentInfo) {
                return;
            }
            this.azureConfigHandler.updateComponent(asaComponentIndex, componentInfo);
        }
        else {
            const newAsaConfig = {
                id: this.id,
                folder: '',
                name: '',
                dependencies: this.dependencies,
                type: Component_1.ComponentType[this.componentType]
            };
            this.azureConfigHandler.appendComponent(newAsaConfig);
        }
    }
    provision() {
        return __awaiter(this, void 0, void 0, function* () {
            const asaList = this.getStreamAnalyticsInResourceGroup();
            const asaNameChoose = yield vscode.window.showQuickPick(asaList, { placeHolder: 'Select Stream Analytics Job', ignoreFocusOut: true });
            if (!asaNameChoose) {
                return false;
            }
            let streamAnalyticsJobName = '';
            if (!asaNameChoose.description) {
                if (this.channel) {
                    this.channel.show();
                    this.channel.appendLine('Creating Stream Analytics Job...');
                }
                const asaArmTemplatePath = this.extensionContext.asAbsolutePath(path.join(constants_1.FileNames.resourcesFolderName, 'arm', 'streamanalytics.json'));
                const asaArmTemplate = JSON.parse(fs.readFileSync(asaArmTemplatePath, 'utf8'));
                const asaDeploy = yield AzureUtility_1.AzureUtility.deployARMTemplate(asaArmTemplate);
                if (!asaDeploy || !asaDeploy.properties ||
                    !asaDeploy.properties.outputs ||
                    !asaDeploy.properties.outputs.streamAnalyticsJobName) {
                    throw new Error('Provision Stream Analytics Job failed.');
                }
                this.channel.appendLine(JSON.stringify(asaDeploy, null, 4));
                streamAnalyticsJobName =
                    asaDeploy.properties.outputs.streamAnalyticsJobName.value;
            }
            else {
                if (this.channel) {
                    this.channel.show();
                    this.channel.appendLine('Creating Stream Analytics Job...');
                }
                streamAnalyticsJobName = asaNameChoose.label;
                const asaDetail = this.getStreamAnalyticsByNameFromCache(streamAnalyticsJobName);
                if (asaDetail) {
                    this.channel.appendLine(JSON.stringify(asaDetail, null, 4));
                }
            }
            for (const dependency of this.dependencies) {
                const componentConfig = this.azureConfigHandler.getComponentById(dependency.id);
                if (!componentConfig) {
                    throw new Error(`Cannot find component with id ${dependency.id}.`);
                }
                if (dependency.type === AzureComponentConfig_1.DependencyType.Input) {
                    switch (componentConfig.type) {
                        case 'IoTHub': {
                            if (!componentConfig.componentInfo) {
                                return false;
                            }
                            const iotHubConnectionString = componentConfig.componentInfo.values.iotHubConnectionString;
                            let iotHubName = '';
                            let iotHubKeyName = '';
                            let iotHubKey = '';
                            const iotHubNameMatches = iotHubConnectionString.match(/HostName=(.*?)\./);
                            const iotHubKeyMatches = iotHubConnectionString.match(/SharedAccessKey=(.*?)(;|$)/);
                            const iotHubKeyNameMatches = iotHubConnectionString.match(/SharedAccessKeyName=(.*?)(;|$)/);
                            if (iotHubNameMatches) {
                                iotHubName = iotHubNameMatches[1];
                            }
                            if (iotHubKeyMatches) {
                                iotHubKey = iotHubKeyMatches[1];
                            }
                            if (iotHubKeyNameMatches) {
                                iotHubKeyName = iotHubKeyNameMatches[1];
                            }
                            if (!iotHubName || !iotHubKeyName || !iotHubKey) {
                                throw new Error('Cannot parse IoT Hub connection string.');
                            }
                            const asaIoTHubArmTemplatePath = this.extensionContext.asAbsolutePath(path.join(constants_1.FileNames.resourcesFolderName, 'arm', 'streamanalytics-input-iothub.json'));
                            const asaIoTHubArmTemplate = JSON.parse(fs.readFileSync(asaIoTHubArmTemplatePath, 'utf8'));
                            const asaIotHubArmParameters = {
                                streamAnalyticsJobName: { value: streamAnalyticsJobName },
                                inputName: { value: `iothub-${componentConfig.id}` },
                                iotHubName: { value: iotHubName },
                                iotHubKeyName: { value: iotHubKeyName },
                                iotHubKey: { value: iotHubKey }
                            };
                            const asaInputDeploy = yield AzureUtility_1.AzureUtility.deployARMTemplate(asaIoTHubArmTemplate, asaIotHubArmParameters);
                            if (!asaInputDeploy) {
                                throw new Error('Provision Stream Analytics Job failed.');
                            }
                            break;
                        }
                        default: {
                            throw new Error(`Not supported ASA input type: ${componentConfig.type}.`);
                        }
                    }
                }
                else {
                    switch (componentConfig.type) {
                        case 'CosmosDB': {
                            if (!componentConfig.componentInfo) {
                                return false;
                            }
                            const cosmosDBAccountName = componentConfig.componentInfo.values.cosmosDBAccountName;
                            const cosmosDBDatabase = componentConfig.componentInfo.values.cosmosDBDatabase;
                            const cosmosDBCollection = componentConfig.componentInfo.values.cosmosDBCollection;
                            if (!cosmosDBAccountName || !cosmosDBDatabase ||
                                !cosmosDBCollection) {
                                throw new Error('Cannot get Cosmos DB connection information.');
                            }
                            const asaCosmosDBArmTemplatePath = this.extensionContext.asAbsolutePath(path.join(constants_1.FileNames.resourcesFolderName, 'arm', 'streamanalytics-output-cosmosdb.json'));
                            const asaCosmosDBArmTemplate = JSON.parse(fs.readFileSync(asaCosmosDBArmTemplatePath, 'utf8'));
                            const asaCosmosArmParameters = {
                                streamAnalyticsJobName: { value: streamAnalyticsJobName },
                                outputName: { value: `cosmosdb-${componentConfig.id}` },
                                cosmosDBName: { value: cosmosDBAccountName },
                                cosmosDBDatabase: { value: cosmosDBDatabase },
                                cosmosDBCollection: { value: cosmosDBCollection }
                            };
                            const asaOutputDeploy = yield AzureUtility_1.AzureUtility.deployARMTemplate(asaCosmosDBArmTemplate, asaCosmosArmParameters);
                            if (!asaOutputDeploy) {
                                throw new Error('Provision Stream Analytics Job failed.');
                            }
                            break;
                        }
                        default: {
                            throw new Error(`Not supported ASA output type: ${componentConfig.type}.`);
                        }
                    }
                }
            }
            this.updateConfigSettings({
                values: {
                    subscriptionId: AzureUtility_1.AzureUtility.subscriptionId,
                    resourceGroup: AzureUtility_1.AzureUtility.resourceGroup,
                    streamAnalyticsJobName
                }
            });
            if (this.channel) {
                this.channel.show();
                this.channel.appendLine('Stream Analytics Job provision succeeded.');
            }
            return true;
        });
    }
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            const azureClient = this.azureClient || this.initAzureClient();
            // Stop Job
            let stopPending = null;
            if (this.channel) {
                this.channel.show();
                this.channel.appendLine('Stopping Stream Analytics Job...');
                stopPending = setInterval(() => {
                    this.channel.append('.');
                }, 1000);
            }
            const jobStopped = yield this.stop();
            if (!jobStopped) {
                if (this.channel) {
                    this.channel.show();
                    this.channel.appendLine('Stop Stream Analytics Job failed.');
                }
                return false;
            }
            else {
                if (this.channel && stopPending) {
                    clearInterval(stopPending);
                    this.channel.appendLine('.');
                    this.channel.appendLine('Stop Stream Analytics Job succeeded.');
                }
            }
            const resourceId = `/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroup}/providers/Microsoft.StreamAnalytics/streamingjobs/${this.streamAnalyticsJobName}/transformations/Transformation`;
            const apiVersion = '2015-10-01';
            if (!fs.existsSync(this.queryPath)) {
                throw new Error(`Cannot find query file at ${this.queryPath}`);
            }
            const query = fs.readFileSync(this.queryPath, 'utf8');
            const parameters = { properties: { streamingUnits: 1, query } };
            let deployPending = null;
            try {
                if (this.channel) {
                    this.channel.show();
                    this.channel.appendLine('Deploying Stream Analytics Job...');
                    deployPending = setInterval(() => {
                        this.channel.append('.');
                    }, 1000);
                }
                const deployment = yield azureClient.resources.createOrUpdateById(resourceId, apiVersion, parameters);
                if (this.channel && deployPending) {
                    clearInterval(deployPending);
                    this.channel.appendLine('.');
                    this.channel.appendLine(JSON.stringify(deployment, null, 4));
                    this.channel.appendLine('Stream Analytics Job query deploy succeeded.');
                }
                // Start Job
                let startPending = null;
                if (this.channel) {
                    this.channel.show();
                    this.channel.appendLine('Starting Stream Analytics Job...');
                    startPending = setInterval(() => {
                        this.channel.append('.');
                    }, 1000);
                }
                const jobStarted = yield this.start();
                if (!jobStarted) {
                    if (this.channel) {
                        this.channel.show();
                        this.channel.appendLine('Start Stream Analytics Job failed.');
                    }
                    return false;
                }
                else {
                    if (this.channel && startPending) {
                        clearInterval(startPending);
                        this.channel.appendLine('.');
                        this.channel.appendLine('Start Stream Analytics Job succeeded.');
                    }
                }
            }
            catch (error) {
                if (this.channel && deployPending) {
                    clearInterval(deployPending);
                    this.channel.appendLine('.');
                }
                throw error;
            }
            return true;
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.callAction(StreamAnalyticsAction.Stop);
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.callAction(StreamAnalyticsAction.Start);
        });
    }
    getState() {
        return __awaiter(this, void 0, void 0, function* () {
            const azureClient = this.azureClient || this.initAzureClient();
            const resourceId = `/subscriptions/${this.subscriptionId}/resourceGroups/${this.resourceGroup}/providers/Microsoft.StreamAnalytics/streamingjobs/${this.streamAnalyticsJobName}`;
            const apiVersion = '2015-10-01';
            const res = yield azureClient.resources.getById(resourceId, apiVersion);
            return res.properties.jobState;
        });
    }
}
exports.StreamAnalyticsJob = StreamAnalyticsJob;
//# sourceMappingURL=StreamAnalyticsJob.js.map