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
const vscode = require("vscode");
const path_1 = require("path");
const fs_1 = require("./fs");
const kubectlUtils_1 = require("./kubectlUtils");
const extension_1 = require("./extension");
const kuberesources_1 = require("./kuberesources");
const errorable_1 = require("./errorable");
exports.uriScheme = 'k8sviewfiledata';
class ConfigMapTextProvider {
    constructor(kubectl) {
        this.kubectl = kubectl;
    }
    provideTextDocumentContent(uri, _token) {
        const parts = uri.path.split('/');
        const b = new Buffer(parts[1], 'base64');
        return b.toString();
    }
}
exports.ConfigMapTextProvider = ConfigMapTextProvider;
function loadConfigMapData(obj) {
    let encodedData = obj.configData[obj.id];
    if (obj.resource === kuberesources_1.allKinds.configMap.abbreviation) {
        encodedData = Buffer.from(obj.configData[obj.id]).toString('base64');
    }
    const uriStr = `${exports.uriScheme}://${obj.resource}/${encodedData}/${obj.id}`;
    const uri = vscode.Uri.parse(uriStr);
    vscode.workspace.openTextDocument(uri).then((doc) => {
        vscode.window.showTextDocument(doc);
    }, (error) => {
        vscode.window.showErrorMessage('Error loading data file: ' + error);
    });
}
exports.loadConfigMapData = loadConfigMapData;
function removeKey(dictionary, keyToDelete) {
    const newData = {};
    Object.keys(dictionary).forEach((key) => {
        if (key !== keyToDelete) {
            newData[key] = dictionary[key];
        }
    });
    return newData;
}
function deleteKubernetesConfigFile(kubectl, obj, explorer) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!obj) {
            return;
        }
        const result = yield vscode.window.showWarningMessage(`Are you sure you want to delete ${obj.id}? This can not be undone`, ...extension_1.deleteMessageItems);
        if (!result || result.title !== extension_1.deleteMessageItems[0].title) {
            return;
        }
        const currentNS = yield kubectlUtils_1.currentNamespace(kubectl);
        const json = yield kubectl.asJson(`get ${obj.resource} ${obj.parentName} --namespace=${currentNS} -o json`);
        if (errorable_1.failed(json)) {
            return;
        }
        const dataHolder = json.result;
        dataHolder.data = removeKey(dataHolder.data, obj.id);
        const out = JSON.stringify(dataHolder);
        const shellRes = yield kubectl.invokeAsync(`replace -f - --namespace=${currentNS}`, out);
        if (!shellRes || shellRes.code !== 0) {
            vscode.window.showErrorMessage('Failed to delete file: ' + (shellRes ? shellRes.stderr : "Unable to run kubectl"));
            return;
        }
        explorer.refresh();
        vscode.window.showInformationMessage(`Data '${obj.id}' deleted from resource.`);
    });
}
exports.deleteKubernetesConfigFile = deleteKubernetesConfigFile;
function addKubernetesConfigFile(kubectl, obj, explorer) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!obj) {
            return;
        }
        const fileUris = yield vscode.window.showOpenDialog({
            canSelectFolders: false,
            openLabel: "Add file(s)"
        });
        if (fileUris) {
            console.log(fileUris);
            const currentNS = yield kubectlUtils_1.currentNamespace(kubectl);
            const dataHolderJson = yield kubectl.asJson(`get ${obj.resource} ${obj.id} --namespace=${currentNS} -o json`);
            if (errorable_1.failed(dataHolderJson)) {
                return;
            }
            const dataHolder = dataHolderJson.result;
            fileUris.map((uri) => __awaiter(this, void 0, void 0, function* () {
                const filePath = uri.fsPath;
                const fileName = path_1.basename(filePath);
                if (dataHolder.data[fileName]) {
                    const response = yield vscode.window.showWarningMessage(`Are you sure you want to overwrite '${fileName}'? This can not be undone`, ...extension_1.overwriteMessageItems);
                    if (!response || response.title !== extension_1.overwriteMessageItems[0].title) {
                        return;
                    }
                }
                // TODO: I really don't like sync calls here...
                const buff = fs_1.fs.readFileToBufferSync(filePath);
                if (obj.resource === 'configmap') {
                    dataHolder.data[fileName] = buff.toString();
                }
                else {
                    dataHolder.data[fileName] = buff.toString('base64');
                }
            }));
            const out = JSON.stringify(dataHolder);
            const shellRes = yield kubectl.invokeAsync(`replace -f - --namespace=${currentNS}`, out);
            if (!shellRes || shellRes.code !== 0) {
                vscode.window.showErrorMessage('Failed to add file(s) to resource ${obj.id}: ' + (shellRes ? shellRes.stderr : "Unable to run kubectl"));
                return;
            }
            explorer.refresh();
            vscode.window.showInformationMessage(`New data added to resource ${obj.id}.`);
        }
    });
}
exports.addKubernetesConfigFile = addKubernetesConfigFile;
//# sourceMappingURL=configMap.js.map