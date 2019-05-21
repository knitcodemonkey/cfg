"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const statusBarTerminal_1 = require("./statusBarTerminal");
const MAX_TERMINALS = 10;
let _terminalCounter = 0;
let _terminals = [];
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('terminalTabs.createTerminal', () => {
        if (_terminals.length >= MAX_TERMINALS) {
            vscode.window.showInformationMessage(`This extension does not support more than ${MAX_TERMINALS} terminals.`);
            return;
        }
        _terminals.push(new statusBarTerminal_1.StatusBarTerminal(_terminalCounter++));
    }));
    context.subscriptions.push(vscode.commands.registerCommand('terminalTabs.createNamedTerminal', () => {
        vscode.window.showInputBox({
            placeHolder: 'Enter the name of the new terminal'
        }).then(name => {
            _terminals.push(new statusBarTerminal_1.StatusBarTerminal(_terminalCounter++, name));
        });
    }));
    for (let i = 1; i <= MAX_TERMINALS; i++) {
        context.subscriptions.push(vscode.commands.registerCommand(`terminalTabs.showTerminal${i}`, (a) => {
            _terminals[i - 1].show();
        }));
    }
    context.subscriptions.push(vscode.window.onDidCloseTerminal(onDidCloseTerminal));
}
exports.activate = activate;
function onDidCloseTerminal(terminal) {
    let terminalIndex;
    _terminals.forEach((statusBarTerminal, i) => {
        if (statusBarTerminal.hasTerminal(terminal)) {
            terminalIndex = i;
        }
    });
    _terminals[terminalIndex].dispose();
    // Push all terminals ahead of it back 1 index
    _terminals.splice(terminalIndex, 1);
    _terminals.forEach((statusBarTerminal, i) => {
        _terminals[i].setTerminalIndex(i);
    });
    _terminalCounter--;
}
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map