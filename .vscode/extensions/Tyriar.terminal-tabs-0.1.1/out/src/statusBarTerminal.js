"use strict";
var vscode = require('vscode');
var StatusBarTerminal = (function () {
    function StatusBarTerminal(terminalIndex, name) {
        this._item = vscode.window.createStatusBarItem();
        this.setTerminalIndex(terminalIndex);
        this._item.show();
        this._terminal = vscode.window.createTerminal(name);
        this._terminal.show();
    }
    StatusBarTerminal.prototype.show = function () {
        this._terminal.show();
    };
    StatusBarTerminal.prototype.setTerminalIndex = function (i) {
        this._item.text = "$(terminal)" + (i + 1);
        this._item.command = "terminalTabs.showTerminal" + (i + 1);
    };
    StatusBarTerminal.prototype.hasTerminal = function (terminal) {
        return this._terminal === terminal;
    };
    StatusBarTerminal.prototype.dispose = function () {
        this._item.dispose();
        this._terminal.dispose();
    };
    return StatusBarTerminal;
}());
exports.StatusBarTerminal = StatusBarTerminal;
//# sourceMappingURL=statusBarTerminal.js.map