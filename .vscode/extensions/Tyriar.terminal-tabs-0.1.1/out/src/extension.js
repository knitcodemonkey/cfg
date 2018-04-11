"use strict";
var statusBarTerminal_1 = require('./statusBarTerminal');
var vscode = require('vscode');
var MAX_TERMINALS = 10;
var _terminalCounter = 0;
var _terminals = [];
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('terminalTabs.createTerminal', function () {
        if (_terminals.length >= MAX_TERMINALS) {
            vscode.window.showInformationMessage("This extension does not support more than " + MAX_TERMINALS + " terminals.");
            return;
        }
        _terminals.push(new statusBarTerminal_1.StatusBarTerminal(_terminalCounter++));
    }));
    context.subscriptions.push(vscode.commands.registerCommand('terminalTabs.createNamedTerminal', function () {
        vscode.window.showInputBox({
            placeHolder: 'Enter the name of the new terminal'
        }).then(function (name) {
            _terminals.push(new statusBarTerminal_1.StatusBarTerminal(_terminalCounter++, name));
        });
    }));
    var _loop_1 = function(i) {
        context.subscriptions.push(vscode.commands.registerCommand("terminalTabs.showTerminal" + i, function (a) {
            _terminals[i - 1].show();
        }));
    };
    for (var i = 1; i <= MAX_TERMINALS; i++) {
        _loop_1(i);
    }
    context.subscriptions.push(vscode.window.onDidCloseTerminal(onDidCloseTerminal));
}
exports.activate = activate;
function onDidCloseTerminal(terminal) {
    var terminalIndex;
    _terminals.forEach(function (statusBarTerminal, i) {
        if (statusBarTerminal.hasTerminal(terminal)) {
            terminalIndex = i;
        }
    });
    _terminals[terminalIndex].dispose();
    // Push all terminals ahead of it back 1 index
    _terminals.splice(terminalIndex, 1);
    _terminals.forEach(function (statusBarTerminal, i) {
        _terminals[i].setTerminalIndex(i);
    });
    _terminalCounter--;
}
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map