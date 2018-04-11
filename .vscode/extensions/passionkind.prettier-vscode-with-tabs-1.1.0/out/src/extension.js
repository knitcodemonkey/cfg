"use strict";
const vscode_1 = require("vscode");
const PrettierEditProvider_1 = require("./PrettierEditProvider");
const VALID_LANG = ['javascript', 'javascriptreact'];
function checkConfig() {
    const config = vscode_1.workspace.getConfiguration('prettier');
    if (config.useFlowParser) {
        vscode_1.window.showWarningMessage("Option 'useFlowParser' has been deprecated. Use 'parser: \"flow\"' instead.");
    }
    if (typeof config.trailingComma === 'boolean') {
        vscode_1.window.showWarningMessage("Option 'trailingComma' as a boolean value has been deprecated. Use 'none', 'es5' or 'all' instead.");
    }
}
function activate(context) {
    const editProvider = new PrettierEditProvider_1.default();
    checkConfig();
    context.subscriptions.push(vscode_1.languages.registerDocumentRangeFormattingEditProvider(VALID_LANG, editProvider));
    context.subscriptions.push(vscode_1.languages.registerDocumentFormattingEditProvider(VALID_LANG, editProvider));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map