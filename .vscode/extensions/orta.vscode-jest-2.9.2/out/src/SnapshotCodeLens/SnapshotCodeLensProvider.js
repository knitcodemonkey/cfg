"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const jest_editor_support_1 = require("jest-editor-support");
const appGlobals_1 = require("../appGlobals");
const SnapshotPreviewProvider_1 = require("./SnapshotPreviewProvider");
const missingSnapshotCommand = `${appGlobals_1.extensionName}.snapshot.missing`;
function registerSnapshotCodeLens(enableSnapshotPreviews) {
    if (!enableSnapshotPreviews) {
        return [];
    }
    return [
        vscode.languages.registerCodeLensProvider({ pattern: '**/*.{ts,tsx,js,jsx}' }, new SnapshotCodeLensProvider()),
        vscode.commands.registerCommand(missingSnapshotCommand, () => {
            vscode.window.showInformationMessage('Run test to generate snapshot.');
        }),
    ];
}
exports.registerSnapshotCodeLens = registerSnapshotCodeLens;
class SnapshotCodeLensProvider {
    provideCodeLenses(document, _token) {
        const snapshots = new jest_editor_support_1.Snapshot();
        return snapshots.getMetadata(document.uri.fsPath).map(snapshot => {
            const { line } = snapshot.node.loc.start;
            const range = new vscode.Range(line - 1, 0, line - 1, 0);
            let command;
            if (snapshot.exists) {
                command = {
                    title: 'view snapshot',
                    command: SnapshotPreviewProvider_1.previewCommand,
                    arguments: [snapshot],
                };
            }
            else {
                command = {
                    title: 'snapshot missing',
                    command: missingSnapshotCommand,
                };
            }
            return new vscode.CodeLens(range, command);
        });
    }
}
//# sourceMappingURL=SnapshotCodeLensProvider.js.map