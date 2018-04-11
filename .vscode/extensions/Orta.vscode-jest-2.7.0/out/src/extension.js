"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const jest_editor_support_1 = require("jest-editor-support");
const path = require("path");
const appGlobals_1 = require("./appGlobals");
const helpers_1 = require("./helpers");
const JestExt_1 = require("./JestExt");
const statusBar_1 = require("./statusBar");
const SnapshotCodeLens_1 = require("./SnapshotCodeLens");
const Coverage_1 = require("./Coverage");
let extensionInstance;
function activate(context) {
    // To make us VS Code agnostic outside of this file
    const pluginSettings = getExtensionSettings();
    const jestPath = helpers_1.pathToJest(pluginSettings);
    const configPath = helpers_1.pathToConfig(pluginSettings);
    const currentJestVersion = 20;
    const workspace = new jest_editor_support_1.ProjectWorkspace(pluginSettings.rootPath, jestPath, configPath, currentJestVersion);
    // Create our own console
    const channel = vscode.window.createOutputChannel('Jest');
    // We need a singleton to represent the extension
    extensionInstance = new JestExt_1.JestExt(workspace, channel, pluginSettings);
    const languages = [
        { language: 'javascript' },
        { language: 'javascriptreact' },
        { language: 'typescript' },
        { language: 'typescriptreact' },
    ];
    context.subscriptions.push(statusBar_1.registerStatusBar(channel), vscode.commands.registerTextEditorCommand(`${appGlobals_1.extensionName}.start`, () => {
        vscode.window.showInformationMessage('Started Jest, press escape to hide this message.');
        extensionInstance.startProcess();
    }), vscode.commands.registerTextEditorCommand(`${appGlobals_1.extensionName}.stop`, () => extensionInstance.stopProcess()), vscode.commands.registerTextEditorCommand(`${appGlobals_1.extensionName}.show-channel`, () => {
        channel.show();
    }), ...SnapshotCodeLens_1.registerSnapshotCodeLens(pluginSettings.enableSnapshotPreviews), ...SnapshotCodeLens_1.registerSnapshotPreview(), ...Coverage_1.registerCoverageCodeLens(extensionInstance), vscode.commands.registerCommand(`${appGlobals_1.extensionName}.coverage.toggle`, extensionInstance.toggleCoverageOverlay, extensionInstance), vscode.commands.registerCommand(`${appGlobals_1.extensionName}.run-test`, extensionInstance.runTest), vscode.languages.registerCodeLensProvider(languages, extensionInstance.debugCodeLensProvider), 
    // this provides the opportunity to inject test names into the DebugConfiguration
    vscode.debug.registerDebugConfigurationProvider('node', extensionInstance.debugConfigurationProvider), 
    // this provides the snippets generation
    vscode.debug.registerDebugConfigurationProvider('vscode-jest-tests', extensionInstance.debugConfigurationProvider), vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('jest')) {
            const updatedSettings = getExtensionSettings();
            extensionInstance.triggerUpdateSettings(updatedSettings);
        }
    }), vscode.workspace.onDidCloseTextDocument(document => {
        extensionInstance.onDidCloseTextDocument(document);
    }), vscode.window.onDidChangeActiveTextEditor(extensionInstance.onDidChangeActiveTextEditor, extensionInstance), vscode.workspace.onDidChangeTextDocument(extensionInstance.onDidChangeTextDocument, extensionInstance));
}
exports.activate = activate;
function deactivate() {
    extensionInstance.deactivate();
}
exports.deactivate = deactivate;
function getExtensionSettings() {
    const config = vscode.workspace.getConfiguration('jest');
    return {
        autoEnable: config.get('autoEnable'),
        pathToConfig: config.get('pathToConfig'),
        pathToJest: config.get('pathToJest'),
        enableCodeLens: config.get('enableCodeLens'),
        enableInlineErrorMessages: config.get('enableInlineErrorMessages'),
        enableSnapshotPreviews: config.get('enableSnapshotPreviews'),
        enableSnapshotUpdateMessages: config.get('enableSnapshotUpdateMessages'),
        rootPath: path.join(vscode.workspace.rootPath, config.get('rootPath')),
        runAllTestsFirst: config.get('runAllTestsFirst'),
        showCoverageOnLoad: config.get('showCoverageOnLoad'),
        restartJestOnSnapshotUpdate: config.get('restartJestOnSnapshotUpdate'),
    };
}
//# sourceMappingURL=extension.js.map