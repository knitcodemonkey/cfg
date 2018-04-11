"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = require("path");
const vscode = require("vscode");
function addPathMapping(treeNode) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const debugSession = vscode.debug.activeDebugSession;
        if (!debugSession) {
            vscode.window.showErrorMessage('No active debug session');
            return;
        }
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No open folder');
            return;
        }
        const launchConfigReference = findLaunchConfig(workspaceFolders, debugSession);
        if (!launchConfigReference) {
            vscode.window.showErrorMessage(`Couldn't find configuration for active debug session '${debugSession.name}'`);
            return;
        }
        const openDialogResult = yield vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            defaultUri: launchConfigReference.workspaceFolder.uri,
            openLabel: 'Map to this directory'
        });
        if (!openDialogResult || (openDialogResult.length === 0)) {
            return;
        }
        const path = openDialogResult[0].fsPath;
        addPathMappingToLaunchConfig(launchConfigReference, treeNode.getFullPath(), path + '/');
        yield showLaunchConfig(launchConfigReference.workspaceFolder);
        vscode.window.showWarningMessage('Configuration was modified - please restart your debug session for the changes to take effect');
    });
}
exports.addPathMapping = addPathMapping;
function findLaunchConfig(workspaceFolders, activeDebugSession) {
    for (const workspaceFolder of workspaceFolders) {
        const launchConfigFile = vscode.workspace.getConfiguration('launch', workspaceFolder.uri);
        const launchConfigs = launchConfigFile.get('configurations');
        if (launchConfigs) {
            for (let index = 0; index < launchConfigs.length; index++) {
                if ((launchConfigs[index].type === activeDebugSession.type) &&
                    (launchConfigs[index].name === activeDebugSession.name)) {
                    return { workspaceFolder, launchConfigFile, index };
                }
            }
        }
    }
    return undefined;
}
function addPathMappingToLaunchConfig(launchConfigReference, url, path) {
    const configurations = launchConfigReference.launchConfigFile.get('configurations');
    const configuration = configurations[launchConfigReference.index];
    if (!configuration.pathMappings) {
        configuration.pathMappings = [];
    }
    const workspacePath = launchConfigReference.workspaceFolder.uri.fsPath;
    if (path.startsWith(workspacePath)) {
        path = '${workspaceFolder}' + path.substr(workspacePath.length);
    }
    const pathMappings = configuration.pathMappings;
    pathMappings.unshift({ url, path });
    launchConfigReference.launchConfigFile.update('configurations', configurations, vscode.ConfigurationTarget.WorkspaceFolder);
}
function showLaunchConfig(workspaceFolder) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const file = path.join(workspaceFolder.uri.fsPath, '.vscode/launch.json');
        const document = yield vscode.workspace.openTextDocument(file);
        yield vscode.window.showTextDocument(document);
    });
}
//# sourceMappingURL=addPathMapping.js.map