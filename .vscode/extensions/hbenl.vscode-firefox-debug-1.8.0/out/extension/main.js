"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
const provider_1 = require("./loadedScripts/provider");
const customEvents_1 = require("./customEvents");
const addPathMapping_1 = require("./addPathMapping");
const popupAutohideManager_1 = require("./popupAutohideManager");
const debugConfigurationProvider_1 = require("./debugConfigurationProvider");
function activate(context) {
    const loadedScriptsProvider = new provider_1.LoadedScriptsProvider();
    const popupAutohideManager = new popupAutohideManager_1.PopupAutohideManager(sendCustomRequest);
    const debugConfigurationProvider = new debugConfigurationProvider_1.DebugConfigurationProvider();
    context.subscriptions.push(vscode.window.registerTreeDataProvider('extension.firefox.loadedScripts', loadedScriptsProvider));
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('firefox', debugConfigurationProvider));
    context.subscriptions.push(vscode.commands.registerCommand('extension.firefox.reloadAddon', () => sendCustomRequest('reloadAddon')));
    context.subscriptions.push(vscode.commands.registerCommand('extension.firefox.toggleSkippingFile', (url) => sendCustomRequest('toggleSkippingFile', url)));
    context.subscriptions.push(vscode.commands.registerCommand('extension.firefox.openScript', openScript));
    context.subscriptions.push(vscode.commands.registerCommand('extension.firefox.addPathMapping', addPathMapping_1.addPathMapping));
    context.subscriptions.push(vscode.commands.registerCommand('extension.firefox.enablePopupAutohide', () => popupAutohideManager.setPopupAutohide(true)));
    context.subscriptions.push(vscode.commands.registerCommand('extension.firefox.disablePopupAutohide', () => popupAutohideManager.setPopupAutohide(false)));
    context.subscriptions.push(vscode.commands.registerCommand('extension.firefox.togglePopupAutohide', () => popupAutohideManager.togglePopupAutohide()));
    context.subscriptions.push(vscode.debug.onDidReceiveDebugSessionCustomEvent((event) => customEvents_1.onCustomEvent(event, loadedScriptsProvider, popupAutohideManager)));
    context.subscriptions.push(vscode.debug.onDidStartDebugSession((session) => onDidStartSession(session, loadedScriptsProvider)));
    context.subscriptions.push(vscode.debug.onDidTerminateDebugSession((session) => onDidTerminateSession(session, loadedScriptsProvider, popupAutohideManager)));
}
exports.activate = activate;
function sendCustomRequest(command, args) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let debugSession = vscode.debug.activeDebugSession;
        if (debugSession && (debugSession.type === 'firefox')) {
            return yield debugSession.customRequest(command, args);
        }
        else {
            if (debugSession) {
                vscode.window.showErrorMessage('The active debug session is not of type "firefox"');
            }
            else {
                vscode.window.showErrorMessage('There is no active debug session');
            }
        }
    });
}
let activeFirefoxDebugSessions = 0;
function onDidStartSession(session, loadedScriptsProvider) {
    if (session.type === 'firefox') {
        loadedScriptsProvider.addSession(session);
        activeFirefoxDebugSessions++;
    }
}
function onDidTerminateSession(session, loadedScriptsProvider, popupAutohideManager) {
    if (session.type === 'firefox') {
        loadedScriptsProvider.removeSession(session.id);
        activeFirefoxDebugSessions--;
        if (activeFirefoxDebugSessions === 0) {
            popupAutohideManager.disableButton();
        }
    }
}
function openScript(pathOrUri) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let uri;
        if (pathOrUri.startsWith('debug:')) {
            uri = vscode.Uri.parse(pathOrUri);
        }
        else {
            uri = vscode.Uri.file(pathOrUri);
        }
        const doc = yield vscode.workspace.openTextDocument(uri);
        vscode.window.showTextDocument(doc);
    });
}
//# sourceMappingURL=main.js.map