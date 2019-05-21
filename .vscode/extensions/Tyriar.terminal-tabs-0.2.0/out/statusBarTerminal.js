"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class StatusBarTerminal {
    constructor(terminalIndex, name) {
        this._item = vscode.window.createStatusBarItem();
        this.setTerminalIndex(terminalIndex);
        this._item.show();
        this._terminal = vscode.window.createTerminal(name);
        this._terminal.show();
    }
    show() {
        this._terminal.show();
    }
    setTerminalIndex(i) {
        this._item.text = `$(terminal)${i + 1}`;
        this._item.command = `terminalTabs.showTerminal${i + 1}`;
    }
    hasTerminal(terminal) {
        return this._terminal === terminal;
    }
    dispose() {
        this._item.dispose();
        this._terminal.dispose();
    }
}
exports.StatusBarTerminal = StatusBarTerminal;
//# sourceMappingURL=statusBarTerminal.js.map