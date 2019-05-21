"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vs = require("vscode");
const path = require("path");
const documenter_1 = require("./documenter");
const vscode_1 = require("vscode");
const languages = [
    "javascript",
    "typescript",
    "vue",
    "javascriptreact",
    "typescriptreact"
];
let documenter;
function lazyInitializeDocumenter() {
    if (!documenter) {
        documenter = new documenter_1.Documenter();
    }
}
function languageIsSupported(document) {
    return (languages.findIndex(l => document.languageId === l) !== -1 ||
        path.extname(document.fileName) === ".vue");
}
function verifyLanguageSupport(document, commandName) {
    if (!languageIsSupported(document)) {
        vs.window.showWarningMessage(`Sorry! '${commandName}' currently only supports JavaScript and TypeScript.`);
        return false;
    }
    return true;
}
function runCommand(commandName, document, implFunc) {
    if (!verifyLanguageSupport(document, commandName)) {
        return;
    }
    try {
        lazyInitializeDocumenter();
        implFunc();
    }
    catch (e) {
        debugger;
        console.error(e);
    }
}
// Thanks, @mjbvz!
class DocThisCompletionItem extends vscode_1.CompletionItem {
    constructor(document, position) {
        super("/** Document This */", vscode_1.CompletionItemKind.Snippet);
        this.insertText = "";
        this.sortText = "\0";
        const line = document.lineAt(position.line).text;
        const prefix = line.slice(0, position.character).match(/\/\**\s*$/);
        const suffix = line.slice(position.character).match(/^\s*\**\//);
        const start = position.translate(0, prefix ? -prefix[0].length : 0);
        this.range = new vscode_1.Range(start, position.translate(0, suffix ? suffix[0].length : 0));
        this.command = {
            title: "Document This",
            command: "docthis.documentThis",
            arguments: [true]
        };
    }
}
function activate(context) {
    context.subscriptions.push(vs.languages.registerCompletionItemProvider(languages, {
        provideCompletionItems: (document, position, token) => {
            const line = document.lineAt(position.line).text;
            const prefix = line.slice(0, position.character);
            if (prefix.match(/^\s*$|\/\*\*\s*$|^\s*\/\*\*+\s*$/)) {
                return [new DocThisCompletionItem(document, position)];
            }
            return;
        }
    }, "/", "*"));
    context.subscriptions.push(vs.commands.registerCommand("docthis.documentThis", (forCompletion) => {
        const commandName = "Document This";
        runCommand(commandName, vs.window.activeTextEditor.document, () => {
            documenter.documentThis(vs.window.activeTextEditor, commandName, forCompletion);
        });
    }));
    context.subscriptions.push(vs.commands.registerCommand("docthis.traceTypeScriptSyntaxNode", () => {
        const commandName = "Trace TypeScript Syntax Node";
        runCommand(commandName, vs.window.activeTextEditor.document, () => {
            documenter.traceNode(vs.window.activeTextEditor);
        });
    }));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map