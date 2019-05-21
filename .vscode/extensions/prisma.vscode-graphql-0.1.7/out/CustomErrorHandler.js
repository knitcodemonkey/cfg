"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
class CustomErrorHandler {
    constructor(name, outputChannel) {
        this.name = name;
        this.outputChannel = outputChannel;
        this.restarts = [];
        this.outputChannel = outputChannel;
    }
    error(_error, _message, count) {
        this.outputChannel.appendLine(`ZEBRA: ${_error} ${_message}`);
        if (count && count <= 3) {
            return vscode_languageclient_1.ErrorAction.Continue;
        }
        return vscode_languageclient_1.ErrorAction.Shutdown;
    }
    closed() {
        this.restarts.push(Date.now());
        if (this.restarts.length < 5) {
            return vscode_languageclient_1.CloseAction.Restart;
        }
        else {
            let diff = this.restarts[this.restarts.length - 1] - this.restarts[0];
            if (diff <= 3 * 60 * 1000) {
                vscode_1.window.showErrorMessage(`The ${this.name} server crashed 5 times in the last 3 minutes. The server will not be restarted.`);
                return vscode_languageclient_1.CloseAction.DoNotRestart;
            }
            else {
                this.restarts.shift();
                return vscode_languageclient_1.CloseAction.Restart;
            }
        }
    }
}
exports.CustomErrorHandler = CustomErrorHandler;
//# sourceMappingURL=CustomErrorHandler.js.map