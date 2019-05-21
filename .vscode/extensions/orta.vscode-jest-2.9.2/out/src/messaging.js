"use strict";
/**
 * collection of functions to show messages with actions in a consistent manner
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function systemErrorMessage(message, ...actions) {
    vscode.window.showErrorMessage(message, ..._extractActionTitles(actions)).then(_handleMessageActions(actions));
}
exports.systemErrorMessage = systemErrorMessage;
function systemWarningMessage(message, ...actions) {
    vscode.window.showWarningMessage(message, ..._extractActionTitles(actions)).then(_handleMessageActions(actions));
}
exports.systemWarningMessage = systemWarningMessage;
// common actions
exports.showTroubleshootingAction = {
    title: 'Help',
    action: () => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(exports.TroubleShootingURL)),
};
exports.TroubleShootingURL = 'https://github.com/jest-community/vscode-jest/blob/master/README.md#troubleshooting';
//
// internal methods
//
function _extractActionTitles(actions) {
    return actions ? actions.map(a => a.title) : [];
}
// expose the internal function so we can unit testing it
function _handleMessageActions(actions) {
    return (action) => {
        if (!action) {
            return;
        }
        const found = actions.filter(a => a.title === action);
        if (found.length === 1) {
            found[0].action();
        }
        else {
            throw Error(`expect exactly one matched action '${action}' but found ${found.length} match(es)`);
        }
    };
}
exports._handleMessageActions = _handleMessageActions;
//# sourceMappingURL=messaging.js.map