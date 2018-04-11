"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const appGlobals_1 = require("../appGlobals");
exports.previewCommand = `${appGlobals_1.extensionName}.snapshot.preview`;
function registerSnapshotPreview() {
    const previewUri = vscode.Uri.parse(`${appGlobals_1.extensionName}.snapshot.preview://snapshot-preview`);
    const provider = new SnapshotPreviewProvider();
    return [
        vscode.commands.registerCommand(exports.previewCommand, (snapshot) => {
            vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, snapshot.name);
            provider.update(previewUri, snapshot.content);
        }),
        vscode.workspace.registerTextDocumentContentProvider(`${appGlobals_1.extensionName}.snapshot.preview`, provider),
    ];
}
exports.registerSnapshotPreview = registerSnapshotPreview;
class SnapshotPreviewProvider {
    constructor() {
        this._onDidChange = new vscode.EventEmitter();
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    update(uri, snapshot) {
        this.snapshot = snapshot;
        this._onDidChange.fire(uri);
    }
    provideTextDocumentContent() {
        if (this.snapshot) {
            const escaped = this.snapshot
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            return `<pre>${escaped}</pre>`;
        }
    }
}
//# sourceMappingURL=SnapshotPreviewProvider.js.map