"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const vscode = require("vscode");
const provider_1 = require("./loadedScripts/provider");
const customEvents_1 = require("./customEvents");
const addPathMapping_1 = require("./addPathMapping");
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.firefox.reloadAddon', () => sendCustomRequest('reloadAddon')));
    context.subscriptions.push(vscode.commands.registerCommand('extension.firefox.rebuildAndReloadAddon', () => sendCustomRequest('rebuildAndReloadAddon')));
    context.subscriptions.push(vscode.commands.registerCommand('extension.firefox.toggleSkippingFile', (url) => sendCustomRequest('toggleSkippingFile', url)));
    context.subscriptions.push(vscode.commands.registerCommand('extension.firefox.openScript', openScript));
    context.subscriptions.push(vscode.commands.registerCommand('extension.firefox.addPathMapping', addPathMapping_1.addPathMapping));
    let loadedScriptsProvider = new provider_1.LoadedScriptsProvider();
    context.subscriptions.push(vscode.debug.onDidReceiveDebugSessionCustomEvent((event) => customEvents_1.onCustomEvent(event, loadedScriptsProvider)));
    context.subscriptions.push(vscode.debug.onDidStartDebugSession((session) => onDidStartSession(session, loadedScriptsProvider)));
    context.subscriptions.push(vscode.debug.onDidTerminateDebugSession((session) => onDidTerminateSession(session, loadedScriptsProvider)));
    context.subscriptions.push(vscode.window.registerTreeDataProvider('extension.firefox.loadedScripts', loadedScriptsProvider));
}
exports.activate = activate;
function sendCustomRequest(command, args) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let debugSession = vscode.debug.activeDebugSession;
        if (debugSession && (debugSession.type === 'firefox')) {
            yield debugSession.customRequest(command, args);
        }
        else {
            if (debugSession) {
                throw 'The active debug session is not of type "firefox"';
            }
            else {
                throw 'There is no active debug session';
            }
        }
    });
}
function onDidStartSession(session, loadedScriptsProvider) {
    if (session.type === 'firefox') {
        loadedScriptsProvider.addSession(session);
    }
}
function onDidTerminateSession(session, loadedScriptsProvider) {
    if (session.type === 'firefox') {
        loadedScriptsProvider.removeSession(session.id);
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