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
const extension_1 = require("../../extension");
const kuberesources_objectmodel_1 = require("../../kuberesources.objectmodel");
const kuberesources = require("../../kuberesources");
const yaml = require("js-yaml");
const kubectlUtils = require("../../kubectlUtils");
const logsWebview_1 = require("../../components/logs/logsWebview");
const containercontainer_1 = require("../../utils/containercontainer");
var LogsDisplayMode;
(function (LogsDisplayMode) {
    LogsDisplayMode[LogsDisplayMode["Show"] = 0] = "Show";
    LogsDisplayMode[LogsDisplayMode["Follow"] = 1] = "Follow";
})(LogsDisplayMode = exports.LogsDisplayMode || (exports.LogsDisplayMode = {}));
/**
 * Fetches logs for a Pod. Handles use cases for fetching pods
 * from an open document, or from the current namespace.
 */
function logsKubernetes(kubectl, explorerNode, displayMode) {
    return __awaiter(this, void 0, void 0, function* () {
        if (explorerNode) {
            return yield getLogsForExplorerNode(kubectl, explorerNode, displayMode);
        }
        return logsForPod(kubectl, displayMode);
    });
}
exports.logsKubernetes = logsKubernetes;
/**
 * Fetch logs from a Pod, when selected from the Explorer.
 */
function getLogsForExplorerNode(kubectl, explorerNode, displayMode) {
    return __awaiter(this, void 0, void 0, function* () {
        const resource = containercontainer_1.ContainerContainer.fromNode(explorerNode);
        if (!resource) {
            return;
        }
        return yield getLogsForResource(kubectl, resource, displayMode);
    });
}
/**
 * Fetches logs for a pod. If there are more than one containers,
 * prompts the user for which container to fetch logs for.
 */
function getLogsForPod(kubectl, pod, displayMode) {
    return __awaiter(this, void 0, void 0, function* () {
        const resource = {
            kindName: `pod/${pod.name}`,
            namespace: pod.namespace,
            containers: pod.spec ? pod.spec.containers : undefined,
            containersQueryPath: '.spec'
        };
        return getLogsForResource(kubectl, resource, displayMode);
    });
}
function getLogsForResource(kubectl, resource, displayMode) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!resource) {
            vscode.window.showErrorMessage('Can\'t find the resource to get logs from!');
            return;
        }
        const container = yield extension_1.selectContainerForResource(resource);
        if (!container) {
            return;
        }
        yield getLogsForContainer(kubectl, resource, container.name, displayMode);
    });
}
/**
 * Gets the logs for a container in a provided pod, in a provided namespace, in a provided container.
 */
function getLogsForContainer(kubectl, resource, containerName, displayMode) {
    return __awaiter(this, void 0, void 0, function* () {
        let cmd = `logs ${resource.kindName}`;
        if (resource.namespace) {
            cmd = `${cmd} --namespace=${resource.namespace}`;
        }
        if (containerName) {
            cmd = `${cmd} --container=${containerName}`;
        }
        if (displayMode === LogsDisplayMode.Follow) {
            cmd = `${cmd} -f`;
            kubectl.invokeInNewTerminal(cmd, `${resource.kindName}-${containerName}`);
            return;
        }
        const panel = logsWebview_1.LogsPanel.createOrShow('Loading...', resource.kindName);
        try {
            const result = yield kubectl.invokeAsync(cmd);
            if (!result || result.code !== 0) {
                vscode.window.showErrorMessage(`Error reading logs: ${result ? result.stderr : undefined}`);
            }
            else {
                panel.setInfo(result.stdout, resource.kindName);
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(`Error reading logs ${err}`);
        }
    });
}
/**
 * Searches for a pod yaml spec from the open document
 * or from the currently selected namespace.
 */
function logsForPod(kubectl, displayMode) {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            return yield logsForPodFromOpenDocument(kubectl, editor, displayMode);
        }
        return yield logsForPodFromCurrentNamespace(kubectl, displayMode);
    });
}
/**
 * Finds a Pod from the open editor.
 */
function logsForPodFromOpenDocument(kubectl, editor, displayMode) {
    return __awaiter(this, void 0, void 0, function* () {
        const text = editor.document.getText();
        try {
            const obj = yaml.safeLoad(text);
            if (kuberesources_objectmodel_1.isPod(obj)) {
                // document describes a pod.
                const podSummary = {
                    name: obj.metadata.name,
                    namespace: obj.metadata.namespace
                };
                return yield getLogsForPod(kubectl, podSummary, displayMode);
            }
        }
        catch (ex) {
            // pass
        }
        return yield logsForPodFromCurrentNamespace(kubectl, displayMode);
    });
}
/**
 * Alerts the user on pods available in the current namespace.
 */
function logsForPodFromCurrentNamespace(kubectl, displayMode) {
    return __awaiter(this, void 0, void 0, function* () {
        const namespace = yield kubectlUtils.currentNamespace(kubectl);
        extension_1.quickPickKindName([kuberesources.allKinds.pod], { nameOptional: false }, (pod) => __awaiter(this, void 0, void 0, function* () {
            const podSummary = {
                name: pod.split('/')[1],
                namespace: namespace // should figure out how to handle namespaces.
            };
            yield getLogsForPod(kubectl, podSummary, displayMode);
        }));
    });
}
//# sourceMappingURL=logs.js.map