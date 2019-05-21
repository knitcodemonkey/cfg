"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vscode_1 = require("vscode");
var path = require("path");
var micromatch = require("micromatch");
var child_process_1 = require("child_process");
var dash_1 = require("./dash");
var os_1 = require("os");
var OS = os_1.platform();
function activate(context) {
    context.subscriptions.push(vscode_1.commands.registerCommand('extension.dash.specific', function () {
        searchSpecific();
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('extension.dash.all', function () {
        searchAll();
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('extension.dash.emptySyntax', function () {
        searchEmptySyntax();
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('extension.dash.customSyntax', function () {
        searchCustomWithSyntax();
    }));
}
exports.activate = activate;
/**
 * Search in dash for selection syntax documentation
 */
function searchSpecific() {
    var editor = getEditor();
    var query = getSelectedText(editor);
    var docsets = getDocsets();
    var dash = new dash_1.Dash(OS, getDashOption());
    child_process_1.exec(dash.getCommand(query, docsets));
}
/**
 * Search in dash for all documentation
 */
function searchAll() {
    var editor = getEditor();
    var query = getSelectedText(editor);
    var dash = new dash_1.Dash(OS, getDashOption());
    child_process_1.exec(dash.getCommand(query));
}
/**
 * Search in dash for editor syntax documentation
 */
function searchEmptySyntax() {
    var query = '';
    var docsets = getDocsets();
    var dash = new dash_1.Dash(OS, getDashOption());
    child_process_1.exec(dash.getCommand(query, docsets));
}
/**
 * Search in dash for editor syntax documentation with a custom query
 */
function searchCustomWithSyntax() {
    var docsets = getDocsets();
    var dash = new dash_1.Dash(OS, getDashOption());
    var inputOptions = {
        placeHolder: 'Something to search in Dash.',
        prompt: 'Enter something to search for in Dash.',
    };
    vscode_1.window.showInputBox(inputOptions).then(function (query) {
        if (query) {
            // If they actually input code
            child_process_1.exec(dash.getCommand(query, docsets)); // Open it in dash
        }
    });
}
/**
 * Get vscode active editor
 *
 * @return {TextEditor}
 */
function getEditor() {
    var editor = vscode_1.window.activeTextEditor;
    if (!editor) {
        return;
    }
    return editor;
}
/**
 * Get selected text by selection or by cursor position
 *
 * @param {TextEditor} active editor
 * @return {string}
 */
function getSelectedText(editor) {
    var selection = editor.selection;
    var text = editor.document.getText(selection);
    if (!text) {
        var range = editor.document.getWordRangeAtPosition(selection.active);
        text = editor.document.getText(range);
    }
    return text;
}
/**
 * Get docset configuration
 *
 * @param {string} languageId e.g javascript, ruby
 * @return {string}
 */
function getDocsets() {
    var editor = getEditor();
    var fileName = path.basename(editor.document.fileName);
    var languageId = editor.document.languageId;
    var fileNameDocsets = getFileNameDocsets(fileName);
    var languageIdDocsets = getLanguageIdDocsets(languageId);
    // prioritize docset matching by file name then language id
    return fileNameDocsets.concat(languageIdDocsets);
}
/**
 * Get docsets based on file name
 * @param {string} fileName
 * @return {string}
 */
function getFileNameDocsets(fileName) {
    var fileNameConfig = vscode_1.workspace.getConfiguration('dash.fileNameToDocsetMap');
    var matchedFileNameConfigKey = Object.keys(fileNameConfig).find(function (config) {
        return micromatch.isMatch(fileName, config);
    });
    return matchedFileNameConfigKey
        ? fileNameConfig[matchedFileNameConfigKey]
        : [];
}
/**
 * Get docsets based on languge id
 * @param languageId
 * @return {string}
 */
function getLanguageIdDocsets(languageId) {
    var languageIdConfig = vscode_1.workspace.getConfiguration('dash.languageIdToDocsetMap');
    return languageIdConfig[languageId] || [];
}
function getDashOption() {
    var exactDocset = vscode_1.workspace.getConfiguration('dash').get('exactDocset');
    return {
        exactDocset: exactDocset
    };
}
//# sourceMappingURL=extension.js.map