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
const azure_arm_resource_1 = require("azure-arm-resource");
const fs = require("fs-plus");
const ms_rest_1 = require("ms-rest");
const path = require("path");
const vscode = require("vscode");
const request = require("request-promise");
const configHandler_1 = require("../configHandler");
const Apis_1 = require("./Apis");
const Api_1 = require("./Interfaces/Api");
const telemetry_1 = require("../telemetry");
const constants_1 = require("../constants");
class AzureUtility {
    static init(context, channel, subscriptionId) {
        AzureUtility._context = context;
        AzureUtility._channel = channel;
        AzureUtility._subscriptionId = subscriptionId;
    }
    static _getSubscriptionList() {
        return __awaiter(this, void 0, void 0, function* () {
            const subscriptionList = [];
            if (!AzureUtility._azureAccountExtension) {
                throw new Error('Azure account extension is not found.');
            }
            const subscriptions = AzureUtility._azureAccountExtension.filters;
            subscriptions.forEach(item => {
                subscriptionList.push({
                    label: item.subscription.displayName,
                    description: item.subscription.subscriptionId
                });
            });
            if (subscriptionList.length === 0) {
                subscriptionList.push({
                    label: 'No subscription found',
                    description: '',
                    detail: 'Click Azure account at bottom left corner and choose Select All'
                });
            }
            return subscriptionList;
        });
    }
    static _getSessionBySubscriptionId(subscriptionId) {
        if (!AzureUtility._azureAccountExtension) {
            throw new Error('Azure account extension is not found.');
        }
        const subscriptions = AzureUtility._azureAccountExtension.filters;
        const subscription = subscriptions.find(sub => sub.subscription.subscriptionId === subscriptionId);
        if (subscription) {
            return subscription.session;
        }
        return undefined;
    }
    static _getSession() {
        return __awaiter(this, void 0, void 0, function* () {
            AzureUtility._subscriptionId = yield AzureUtility._getSubscription();
            if (!AzureUtility._subscriptionId) {
                return undefined;
            }
            return AzureUtility._getSessionBySubscriptionId(AzureUtility._subscriptionId);
        });
    }
    static _getResourceClient() {
        return __awaiter(this, void 0, void 0, function* () {
            AzureUtility._subscriptionId = yield AzureUtility._getSubscription();
            if (!AzureUtility._subscriptionId) {
                return undefined;
            }
            const session = yield AzureUtility._getSession();
            if (session) {
                const credential = session.credentials;
                const client = new azure_arm_resource_1.ResourceManagementClient(credential, AzureUtility._subscriptionId, session.environment.resourceManagerEndpointUrl);
                return client;
            }
            return undefined;
        });
    }
    static _getSubscriptionClientBySubscriptionId(substriptionId) {
        const session = AzureUtility._getSessionBySubscriptionId(substriptionId);
        if (session) {
            const credential = session.credentials;
            const client = new azure_arm_resource_1.ResourceManagementClient(credential, substriptionId, session.environment.resourceManagerEndpointUrl);
            return client;
        }
        return undefined;
    }
    static _getSubscriptionClient() {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield AzureUtility._getSession();
            if (session) {
                const credential = session.credentials;
                const client = new azure_arm_resource_1.SubscriptionClient(credential, session.environment.resourceManagerEndpointUrl);
                return client;
            }
            return undefined;
        });
    }
    static _getLocations() {
        return __awaiter(this, void 0, void 0, function* () {
            AzureUtility._subscriptionId = yield AzureUtility._getSubscription();
            if (!AzureUtility._subscriptionId) {
                return undefined;
            }
            const client = yield AzureUtility._getSubscriptionClient();
            if (!client) {
                return undefined;
            }
            const locations = yield client.subscriptions.listLocations(AzureUtility._subscriptionId);
            return locations;
        });
    }
    static _createResouceGroup() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield AzureUtility._getResourceClient();
            if (!client) {
                return undefined;
            }
            const resourceGroupName = yield vscode.window.showInputBox({
                prompt: 'Input resouce group name',
                ignoreFocusOut: true,
                validateInput: (name) => __awaiter(this, void 0, void 0, function* () {
                    if (!/^[a-z0-9_\-\.]*[a-z0-9_\-]+$/.test(name)) {
                        return 'Resource group names only allow alphanumeric characters, periods, underscores, hyphens and parenthesis and cannot end in a period.';
                    }
                    const exist = yield client.resourceGroups.checkExistence(name);
                    if (exist) {
                        return 'Azure name is unavailable';
                    }
                    return '';
                })
            });
            if (!resourceGroupName) {
                return undefined;
            }
            const locations = yield AzureUtility._getLocations();
            if (!locations) {
                return undefined;
            }
            const locationList = [];
            for (const location of locations) {
                locationList.push({
                    label: location.displayName,
                    description: location.name
                });
            }
            const resourceGroupLocation = yield vscode.window.showQuickPick(locationList, { placeHolder: 'Select Resource Group Location', ignoreFocusOut: true });
            if (!resourceGroupLocation || !resourceGroupLocation.description) {
                return undefined;
            }
            const resourceGroup = yield client.resourceGroups.createOrUpdate(resourceGroupName, { location: resourceGroupLocation.description });
            return resourceGroup.name;
        });
    }
    static _commonParameterCheck(_value, parameter) {
        let value = null;
        switch (parameter.type.toLocaleLowerCase()) {
            case 'string':
                value = _value;
                break;
            case 'int':
                value = Number(_value);
                break;
            case 'bool':
                value = _value.toLocaleLowerCase() === 'true';
                break;
            default:
                break;
        }
        if (value === null) {
            return '';
        }
        if (typeof value === 'string' && parameter.minLength !== undefined &&
            parameter.minLength > value.length) {
            return `The value does\'t meet requirement: minLength ${parameter.minLength}.`;
        }
        if (typeof value === 'string' && parameter.maxLength !== undefined &&
            parameter.maxLength < value.length) {
            return `The value does\'t meet requirement: maxLength ${parameter.maxLength}.`;
        }
        if (typeof value === 'number' && parameter.minValue !== undefined &&
            parameter.minValue > value) {
            return `The value does\'t meet requirement: minValue ${parameter.minValue}.`;
        }
        if (typeof value === 'number' && parameter.maxValue !== undefined &&
            parameter.maxValue < value) {
            return `The value does\'t meet requirement: maxValue ${parameter.maxValue}.`;
        }
        if (typeof value === 'number' && isNaN(value)) {
            return `The value is not a valid number.`;
        }
        return '';
    }
    static _getKeyDisplayName(key) {
        key = key.replace(/^\$*/, '');
        const keyDisplayName = key.replace(/([A-Z][^A-Z])/g, ' $1')
            .replace(/([a-z])([A-Z])/g, '$1 $2');
        return keyDisplayName.substr(0, 1).toUpperCase() + keyDisplayName.substr(1);
    }
    static _getARMParameters(parameterTemplate, parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            parameters = parameters || {};
            for (const key of Object.keys(parameterTemplate)) {
                if (parameters.hasOwnProperty(key)) {
                    continue;
                }
                const keyDisplayName = AzureUtility._getKeyDisplayName(key);
                const parameter = parameterTemplate[key];
                let value = null;
                let inputValue = '';
                if (parameter.allowedValues) {
                    const values = [];
                    for (const value of parameter.allowedValues) {
                        if (value !== null) {
                            values.push({ label: value.toString(), description: '' });
                        }
                    }
                    const _value = yield vscode.window.showQuickPick(values, {
                        placeHolder: `Select value of ${keyDisplayName}`,
                        ignoreFocusOut: true
                    });
                    if (!_value) {
                        return undefined;
                    }
                    inputValue = _value.label;
                }
                else if (key.substr(0, 2) === '$$') {
                    // Read value from file
                    if (!vscode.workspace.workspaceFolders) {
                        inputValue = '';
                    }
                    else {
                        const _key = key.substr(2);
                        const filePath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '..', _key);
                        AzureUtility._context.asAbsolutePath(_key);
                        if (fs.existsSync(filePath)) {
                            inputValue = fs.readFileSync(filePath, 'utf8');
                        }
                        else {
                            inputValue = '';
                        }
                    }
                }
                else if (key.substr(0, 1) === '$') {
                    // Read value from workspace config
                    const _key = key.substr(1);
                    const iothubConnectionString = configHandler_1.ConfigHandler.get('iothubConnectionString');
                    switch (_key) {
                        case 'iotHubName':
                            if (!iothubConnectionString) {
                                inputValue = '';
                            }
                            else {
                                const iotHubNameMatches = iothubConnectionString.match(/HostName=(.*?)\./);
                                if (!iotHubNameMatches) {
                                    inputValue = '';
                                }
                                else {
                                    inputValue = iotHubNameMatches[1];
                                }
                            }
                            break;
                        case 'iotHubKeyName':
                            if (!iothubConnectionString) {
                                inputValue = '';
                            }
                            else {
                                const iotHubKeyNameMatches = iothubConnectionString.match(/SharedAccessKeyName=(.*?)(;|$)/);
                                if (!iotHubKeyNameMatches) {
                                    inputValue = '';
                                }
                                else {
                                    inputValue = iotHubKeyNameMatches[1];
                                }
                            }
                            break;
                        case 'iotHubKey':
                            if (!iothubConnectionString) {
                                inputValue = '';
                            }
                            else {
                                const iotHubKeyMatches = iothubConnectionString.match(/SharedAccessKey=(.*?)(;|$)/);
                                if (!iotHubKeyMatches) {
                                    inputValue = '';
                                }
                                else {
                                    inputValue = iotHubKeyMatches[1];
                                }
                            }
                            break;
                        case 'subscription':
                            inputValue = AzureUtility._subscriptionId || '';
                            break;
                        default:
                            const _value = configHandler_1.ConfigHandler.get(_key);
                            if (!_value) {
                                inputValue = '';
                            }
                            else {
                                inputValue = _value;
                            }
                    }
                }
                else {
                    const _value = yield vscode.window.showInputBox({
                        prompt: `Input value for ${keyDisplayName}`,
                        ignoreFocusOut: true,
                        value: parameter.defaultValue ? parameter.defaultValue.toString() :
                            '',
                        validateInput: (value) => __awaiter(this, void 0, void 0, function* () {
                            return AzureUtility._commonParameterCheck(value, parameter);
                        })
                    });
                    if (!_value) {
                        return undefined;
                    }
                    inputValue = _value;
                }
                switch (parameter.type.toLocaleLowerCase()) {
                    case 'string':
                        value = inputValue;
                        break;
                    case 'int':
                        value = Number(inputValue);
                        break;
                    case 'bool':
                        value = inputValue.toLocaleLowerCase() === 'true';
                        break;
                    default:
                        break;
                }
                parameters[key] = { value };
            }
            return parameters;
        });
    }
    static _getSubscription() {
        return __awaiter(this, void 0, void 0, function* () {
            if (AzureUtility._subscriptionId) {
                return AzureUtility._subscriptionId;
            }
            const subscription = yield vscode.window.showQuickPick(AzureUtility._getSubscriptionList(), { placeHolder: 'Select Subscription', ignoreFocusOut: true });
            if (!subscription || !subscription.description) {
                return undefined;
            }
            const telemetryContext = {
                properties: {
                    result: 'Succeeded',
                    error: '',
                    errorMessage: '',
                    subscription: subscription.description
                },
                measurements: { duration: 0 }
            };
            telemetry_1.TelemetryWorker.sendEvent(constants_1.EventNames.selectSubscription, telemetryContext);
            return subscription.description;
        });
    }
    static _getResourceGroupItems() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield AzureUtility._getResourceClient();
            if (!client) {
                return [];
            }
            const resourceGrouplist = [{ label: '$(plus) Create Resource Group', description: '', detail: '' }];
            const resourceGroups = yield client.resourceGroups.list();
            for (const resourceGroup of resourceGroups) {
                resourceGrouplist.push({
                    label: resourceGroup.name,
                    description: resourceGroup.location,
                    detail: ''
                });
            }
            return resourceGrouplist;
        });
    }
    static getResourceGroup() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield AzureUtility._getResourceClient();
            if (!client) {
                AzureUtility._resourceGroup = undefined;
                return undefined;
            }
            const choice = yield vscode.window.showQuickPick(AzureUtility._getResourceGroupItems(), { placeHolder: 'Select Resource Group', ignoreFocusOut: true });
            if (!choice) {
                AzureUtility._resourceGroup = undefined;
                return undefined;
            }
            if (choice.description === '') {
                const resourceGroup = yield AzureUtility._createResouceGroup();
                AzureUtility._resourceGroup = resourceGroup;
                return resourceGroup;
            }
            else {
                AzureUtility._resourceGroup = choice.label;
                return choice.label;
            }
        });
    }
    static deployARMTemplate(template, parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield AzureUtility._getResourceClient();
            if (!client) {
                return undefined;
            }
            if (!AzureUtility._resourceGroup) {
                return undefined;
            }
            parameters =
                yield AzureUtility._getARMParameters(template.parameters, parameters);
            if (!parameters) {
                return undefined;
            }
            let deployPending = null;
            if (AzureUtility._channel) {
                AzureUtility._channel.show();
                deployPending = setInterval(() => {
                    if (AzureUtility._channel) {
                        AzureUtility._channel.append('.');
                    }
                }, 1000);
            }
            const mode = 'Incremental';
            const deploymentParameters = { properties: { parameters, template, mode } };
            try {
                const deployment = yield client.deployments.createOrUpdate(AzureUtility._resourceGroup, `IoTWorkbecnhDeploy${new Date().getTime()}`, deploymentParameters);
                if (AzureUtility._channel && deployPending) {
                    clearInterval(deployPending);
                    AzureUtility._channel.appendLine('.');
                    AzureUtility._channel.appendLine(JSON.stringify(deployment, null, 4));
                }
                return deployment;
            }
            catch (error) {
                if (AzureUtility._channel && deployPending) {
                    clearInterval(deployPending);
                    AzureUtility._channel.appendLine('.');
                    AzureUtility._channel.appendLine(error);
                }
                return undefined;
            }
        });
    }
    static get subscriptionId() {
        return AzureUtility._subscriptionId;
    }
    static get resourceGroup() {
        return AzureUtility._resourceGroup;
    }
    static getClient() {
        if (!AzureUtility._subscriptionId) {
            return undefined;
        }
        const client = AzureUtility._getSubscriptionClientBySubscriptionId(AzureUtility._subscriptionId);
        if (!client) {
            return undefined;
        }
        return client;
    }
    static request(
    // tslint:disable-next-line: no-any
    method, resource, body = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield AzureUtility._getSession();
            if (!session) {
                return undefined;
            }
            const credential = session.credentials;
            const httpRequest = new ms_rest_1.WebResource();
            httpRequest.method = method;
            httpRequest.url = 'https://management.azure.com' + resource;
            httpRequest.body = body;
            if (method === 'GET' || method === 'DELETE') {
                delete httpRequest.body;
            }
            const httpRequestOption = httpRequest;
            httpRequestOption.simple = false;
            httpRequestOption.json = true;
            return new Promise((resolve, reject) => {
                credential.signRequest(httpRequest, (err) => __awaiter(this, void 0, void 0, function* () {
                    if (!err) {
                        const res = yield request(httpRequestOption);
                        return resolve(res);
                    }
                    else {
                        throw err;
                    }
                }));
            });
        });
    }
    // tslint:disable-next-line: no-any
    static postRequest(resource, body = null) {
        return __awaiter(this, void 0, void 0, function* () {
            return AzureUtility.request('POST', resource, body);
        });
    }
    static getRequest(resource) {
        return __awaiter(this, void 0, void 0, function* () {
            return AzureUtility.request('GET', resource);
        });
    }
}
AzureUtility._azureAccountExtension = Apis_1.getExtension(Api_1.extensionName.AzureAccount);
exports.AzureUtility = AzureUtility;
//# sourceMappingURL=AzureUtility.js.map