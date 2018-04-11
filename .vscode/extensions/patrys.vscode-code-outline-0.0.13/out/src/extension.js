"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const symbolOutline_1 = require("./symbolOutline");
function activate(context) {
    const symbolOutlineProvider = new symbolOutline_1.SymbolOutlineProvider(context);
    vscode.window.registerTreeDataProvider('symbolOutline', symbolOutlineProvider);
    vscode.commands.registerCommand('symbolOutline.refresh', () => {
        symbolOutlineProvider.refresh();
    });
    vscode.commands.registerCommand('symbolOutline.revealRange', (editor, range) => {
        editor.revealRange(range, vscode.TextEditorRevealType.Default);
        editor.selection = new vscode.Selection(range.start, range.end);
        vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
    });
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map