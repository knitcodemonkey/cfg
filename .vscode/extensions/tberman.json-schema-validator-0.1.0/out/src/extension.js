'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var Ajv = require("ajv"), $RefParser = require('json-schema-ref-parser'), ajv = new Ajv();
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "json-schema-validator" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    var disposable = vscode.commands.registerCommand('extension.validateJsonSchema', function () {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        //vscode.window.showInformationMessage('Hello World!');
        var docText = vscode.window.activeTextEditor.document.getText();
        try {
            var schema = JSON.parse(docText);
            var base = vscode.window.activeTextEditor.document.fileName.replace(/[^\/]+$/, "");
            //vscode.window.showInformationMessage(base);
            // see https://github.com/BigstickCarpet/json-schema-ref-parser/issues/13
            $RefParser.dereference(base, schema, {})
                .then(function (derefedSchema) {
                var valid = ajv.validateSchema(derefedSchema);
                if (valid) {
                    vscode.window.showInformationMessage("Valid schema");
                }
                else {
                    vscode.window.showErrorMessage("Invalid schema", "Click for details")
                        .then(function (selection) {
                        if (selection === "Click for details") {
                            ajv.errors.forEach(function (value) {
                                vscode.window.showErrorMessage("data" + value.dataPath + " " + value.message);
                            });
                        }
                    });
                }
            })
                .catch(function (err) {
                vscode.window.showInformationMessage("Invalid schema: dereference error - " + err);
            });
        }
        catch (error) {
            vscode.window.showInformationMessage("Failed validation: not valid JSON");
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map