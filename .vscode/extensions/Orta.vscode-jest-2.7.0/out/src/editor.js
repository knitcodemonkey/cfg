"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function hasDocument(editor) {
    return !!editor && !!editor.document;
}
exports.hasDocument = hasDocument;
function isOpenInMultipleEditors(document) {
    if (!document || !document.fileName) {
        return false;
    }
    let count = 0;
    for (const editor of vscode.window.visibleTextEditors) {
        if (editor && editor.document && editor.document.fileName === document.fileName) {
            count += 1;
        }
        if (count > 1) {
            break;
        }
    }
    return count > 1;
}
exports.isOpenInMultipleEditors = isOpenInMultipleEditors;
//# sourceMappingURL=editor.js.map