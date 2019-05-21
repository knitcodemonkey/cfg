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
const crypto = require("crypto");
const fs = require("fs-plus");
const guid_typescript_1 = require("guid-typescript");
const path = require("path");
const vscode = require("vscode");
const request = require("request-promise");
const constants_1 = require("../constants");
const AzureComponentConfig_1 = require("./AzureComponentConfig");
const AzureUtility_1 = require("./AzureUtility");
const Component_1 = require("./Interfaces/Component");
class CosmosDB {
    constructor(context, projectRoot, channel, dependencyComponents = null) {
        this.dependencies = [];
        this.catchedCosmosDbList = [];
        this.name = 'Cosmos DB';
        this.componentType = Component_1.ComponentType.CosmosDB;
        this.channel = channel;
        this.componentId = guid_typescript_1.Guid.create().toString();
        this.projectRootPath = projectRoot;
        this.azureConfigHandler = new AzureComponentConfig_1.AzureConfigFileHandler(projectRoot);
        this.extensionContext = context;
        if (dependencyComponents && dependencyComponents.length > 0) {
            dependencyComponents.forEach(dependency => this.dependencies.push({ id: dependency.component.id, type: dependency.type }));
        }
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
                const cosmosDBConfig = azureConfigs.componentConfigs.find(config => config.type === Component_1.ComponentType[this.componentType]);
                if (cosmosDBConfig) {
                    this.componentId = cosmosDBConfig.id;
                    this.dependencies = cosmosDBConfig.dependencies;
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
        const cosmosDBComponentIndex = this.azureConfigHandler.getComponentIndexById(this.id);
        if (cosmosDBComponentIndex > -1) {
            if (!componentInfo) {
                return;
            }
            this.azureConfigHandler.updateComponent(cosmosDBComponentIndex, componentInfo);
        }
        else {
            const newCosmosDBConfig = {
                id: this.id,
                folder: '',
                name: '',
                dependencies: this.dependencies,
                type: Component_1.ComponentType[this.componentType]
            };
            this.azureConfigHandler.appendComponent(newCosmosDBConfig);
        }
    }
    provision() {
        return __awaiter(this, void 0, void 0, function* () {
            const cosmosDbList = this.getCosmosDbInResourceGroup();
            const cosmosDbNameChoose = yield vscode.window.showQuickPick(cosmosDbList, { placeHolder: 'Select Cosmos DB', ignoreFocusOut: true });
            if (!cosmosDbNameChoose) {
                return false;
            }
            let cosmosDbName = '';
            let cosmosDbKey = '';
            if (!cosmosDbNameChoose.description) {
                if (this.channel) {
                    this.channel.show();
                    this.channel.appendLine('Creating Cosmos DB...');
                }
                const cosmosDBArmTemplatePath = this.extensionContext.asAbsolutePath(path.join(constants_1.FileNames.resourcesFolderName, 'arm', 'cosmosdb.json'));
                const cosmosDBArmTemplate = JSON.parse(fs.readFileSync(cosmosDBArmTemplatePath, 'utf8'));
                const cosmosDBDeploy = yield AzureUtility_1.AzureUtility.deployARMTemplate(cosmosDBArmTemplate);
                if (!cosmosDBDeploy || !cosmosDBDeploy.properties ||
                    !cosmosDBDeploy.properties.outputs ||
                    !cosmosDBDeploy.properties.outputs.cosmosDBAccountName ||
                    !cosmosDBDeploy.properties.outputs.cosmosDBAccountKey) {
                    throw new Error('Provision Cosmos DB failed.');
                }
                this.channel.appendLine(JSON.stringify(cosmosDBDeploy, null, 4));
                for (const dependency of this.dependencies) {
                    const componentConfig = this.azureConfigHandler.getComponentById(dependency.id);
                    if (!componentConfig) {
                        throw new Error(`Cannot find component with id ${dependency.id}.`);
                    }
                    if (dependency.type === AzureComponentConfig_1.DependencyType.Input) {
                        // CosmosDB input
                    }
                    else {
                        // CosmosDB output
                    }
                }
                cosmosDbName =
                    cosmosDBDeploy.properties.outputs.cosmosDBAccountName.value;
                cosmosDbKey = cosmosDBDeploy.properties.outputs.cosmosDBAccountKey.value;
            }
            else {
                if (this.channel) {
                    this.channel.show();
                    this.channel.appendLine('Creating Cosmos DB...');
                }
                cosmosDbName = cosmosDbNameChoose.label;
                const cosmosDbDetail = this.getCosmosDbByNameFromCache(cosmosDbName);
                if (cosmosDbDetail) {
                    this.channel.appendLine(JSON.stringify(cosmosDbDetail, null, 4));
                }
                cosmosDbKey = yield this.getCosmosDbKey(cosmosDbName);
            }
            const databaseList = this.getDatabases(cosmosDbName, cosmosDbKey);
            const databaseChoose = yield vscode.window.showQuickPick(databaseList, { placeHolder: 'Select Database', ignoreFocusOut: true });
            if (!databaseChoose) {
                return false;
            }
            let database = '';
            if (!databaseChoose.description) {
                database = yield vscode.window.showInputBox({
                    prompt: `Input value for Cosmos DB Database`,
                    ignoreFocusOut: true,
                    validateInput: (value) => __awaiter(this, void 0, void 0, function* () {
                        value = value.trim();
                        if (!value) {
                            return 'Please fill this field.';
                        }
                        if (!/^[^\\\/#\?]+/.test(value)) {
                            return 'May not end with space nor contain "\\", "/", "#", "?".';
                        }
                        return;
                    })
                });
                if (!database || !database.trim()) {
                    return false;
                }
                database = database.trim();
                const cosmosDBApiRes = yield this.ensureDatabase(cosmosDbName, cosmosDbKey, database);
                if (!cosmosDBApiRes) {
                    throw new Error('Error occurred when create database.');
                }
            }
            else {
                database = databaseChoose.label;
            }
            const collectionList = this.getCollections(cosmosDbName, cosmosDbKey, database);
            const collectionChoose = yield vscode.window.showQuickPick(collectionList, { placeHolder: 'Select Collection', ignoreFocusOut: true });
            if (!collectionChoose) {
                return false;
            }
            let collection = '';
            if (!collectionChoose.description) {
                collection = yield vscode.window.showInputBox({
                    prompt: `Input value for Cosmos DB Collection`,
                    ignoreFocusOut: true,
                    validateInput: (value) => __awaiter(this, void 0, void 0, function* () {
                        value = value.trim();
                        if (!value) {
                            return 'Please fill this field.';
                        }
                        if (!/^[^\\\/#\?]+/.test(value)) {
                            return 'May not end with space nor contain "\\", "/", "#", "?".';
                        }
                        return;
                    })
                });
                if (!collection || !collection.trim()) {
                    return false;
                }
                collection = collection.trim();
                const cosmosDBApiRes = yield this.ensureCollection(cosmosDbName, cosmosDbKey, database, collection);
                if (!cosmosDBApiRes) {
                    throw new Error('Error occurred when create collection.');
                }
            }
            else {
                collection = collectionChoose.label;
            }
            this.updateConfigSettings({
                values: {
                    subscriptionId: AzureUtility_1.AzureUtility.subscriptionId,
                    resourceGroup: AzureUtility_1.AzureUtility.resourceGroup,
                    cosmosDBAccountName: cosmosDbName,
                    cosmosDBAccountKey: cosmosDbKey,
                    cosmosDBDatabase: database,
                    cosmosDBCollection: collection
                }
            });
            if (this.channel) {
                this.channel.show();
                this.channel.appendLine('Cosmos DB provision succeeded.');
            }
            return true;
        });
    }
    _getCosmosDBAuthorizationToken(key, verb, date, resourceType, resourceId) {
        const _key = Buffer.from(key, 'base64');
        const stringToSign = (`${verb}\n${resourceType}\n${resourceId}\n${date}\n\n`).toLowerCase();
        const body = Buffer.from(stringToSign, 'utf8');
        const signature = crypto.createHmac('sha256', _key).update(body).digest('base64');
        const masterToken = 'master';
        const tokenVersion = '1.0';
        return encodeURIComponent(`type=${masterToken}&ver=${tokenVersion}&sig=${signature}`);
    }
    _getRestHeaders(key, verb, resourceType, resourceId) {
        const date = new Date().toUTCString();
        const authorization = this._getCosmosDBAuthorizationToken(key, verb, date, resourceType, resourceId);
        const headers = {
            'Authorization': authorization,
            'Content-Type': 'application/json',
            'x-ms-date': date,
            'x-ms-version': '2017-02-22'
        };
        return headers;
    }
    _apiRequest(account, key, verb, path, resourceType, resourceId, body = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const apiUrl = `https://${account}.documents.azure.com/${path}`;
            const headers = this._getRestHeaders(key, verb, resourceType, resourceId);
            const apiRes = yield request({
                method: verb,
                uri: apiUrl,
                headers,
                encoding: 'utf8',
                body,
                json: true,
                resolveWithFullResponse: true,
                simple: false
            });
            if (this.channel) {
                this.channel.show();
                this.channel.appendLine(JSON.stringify(apiRes, null, 2));
            }
            return apiRes;
        });
    }
    getDatabases(account, key) {
        return __awaiter(this, void 0, void 0, function* () {
            const getDatabasesRes = yield this._apiRequest(account, key, 'GET', 'dbs', 'dbs', '');
            const listRes = getDatabasesRes.body;
            const databaseList = [{ label: '$(plus) Create New Database', description: '' }];
            for (const item of listRes.Databases) {
                databaseList.push({ label: item.id, description: account });
            }
            return databaseList;
        });
    }
    ensureDatabase(account, key, database) {
        return __awaiter(this, void 0, void 0, function* () {
            const getDatabaseRes = yield this._apiRequest(account, key, 'GET', `dbs/${database}`, 'dbs', `dbs/${database}`);
            if (getDatabaseRes.statusCode === 200) {
                return true;
            }
            const createDatabaseRes = yield this._apiRequest(account, key, 'POST', 'dbs', 'dbs', '', { id: database });
            if (createDatabaseRes.statusCode === 201) {
                return true;
            }
            return false;
        });
    }
    getCollections(account, key, database) {
        return __awaiter(this, void 0, void 0, function* () {
            const getDCollectionsRes = yield this._apiRequest(account, key, 'GET', `dbs/${database}/colls`, 'colls', `dbs/${database}`);
            const listRes = getDCollectionsRes.body;
            const collectionList = [{ label: '$(plus) Create New Collection', description: '' }];
            for (const item of listRes.DocumentCollections) {
                collectionList.push({ label: item.id, description: `${account}/${database}` });
            }
            return collectionList;
        });
    }
    ensureCollection(account, key, database, collection) {
        return __awaiter(this, void 0, void 0, function* () {
            const getCollectionRes = yield this._apiRequest(account, key, 'GET', `dbs/${database}/colls/${collection}`, 'colls', `dbs/${database}/colls/${collection}`);
            if (getCollectionRes.statusCode === 200) {
                return true;
            }
            const creatCollectionRes = yield this._apiRequest(account, key, 'POST', `dbs/${database}/colls`, 'colls', `dbs/${database}`, { id: collection });
            if (creatCollectionRes.statusCode === 201) {
                return true;
            }
            return false;
        });
    }
    getCosmosDbByNameFromCache(name) {
        return this.catchedCosmosDbList.find(item => item.name === name);
    }
    getCosmosDbInResourceGroup() {
        return __awaiter(this, void 0, void 0, function* () {
            const resource = `/subscriptions/${AzureUtility_1.AzureUtility.subscriptionId}/resourceGroups/${AzureUtility_1.AzureUtility
                .resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts?api-version=2015-04-08`;
            const cosmosDbListRes = yield AzureUtility_1.AzureUtility.getRequest(resource);
            const cosmosDbList = [{ label: '$(plus) Create New Cosmos DB', description: '' }];
            for (const item of cosmosDbListRes.value) {
                cosmosDbList.push({ label: item.name, description: item.location });
            }
            this.catchedCosmosDbList = cosmosDbListRes.value;
            return cosmosDbList;
        });
    }
    getCosmosDbKey(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const resource = `/subscriptions/${AzureUtility_1.AzureUtility.subscriptionId}/resourceGroups/${AzureUtility_1.AzureUtility
                .resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${name}/listKeys?api-version=2015-04-08`;
            const cosmosDbKeyListRes = yield AzureUtility_1.AzureUtility.postRequest(resource);
            return cosmosDbKeyListRes.primaryMasterKey;
        });
    }
}
exports.CosmosDB = CosmosDB;
//# sourceMappingURL=CosmosDB.js.map