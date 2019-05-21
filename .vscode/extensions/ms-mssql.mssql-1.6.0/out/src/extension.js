'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const Constants = require("./constants/constants");
const LocalizedConstants = require("./constants/localizedConstants");
const mainController_1 = require("./controllers/mainController");
const vscodeWrapper_1 = require("./controllers/vscodeWrapper");
let controller = undefined;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let vscodeWrapper = new vscodeWrapper_1.default();
    controller = new mainController_1.default(context, undefined, vscodeWrapper);
    context.subscriptions.push(controller);
    // Checking if localization should be applied
    let config = vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName);
    let applyLocalization = config[Constants.configApplyLocalization];
    if (applyLocalization) {
        LocalizedConstants.loadLocalizedConstants(vscode.env.language);
    }
    return controller.activate();
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
    if (controller) {
        controller.deactivate();
        controller.dispose();
    }
}
exports.deactivate = deactivate;
/**
 * Exposed for testing purposes
 */
function getController() {
    return controller;
}
exports.getController = getController;

//# sourceMappingURL=extension.js.map
