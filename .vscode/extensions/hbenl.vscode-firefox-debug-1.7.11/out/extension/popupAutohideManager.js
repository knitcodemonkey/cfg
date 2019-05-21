"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const vscode = require("vscode");
class PopupAutohideManager {
    constructor(sendCustomRequest) {
        this.sendCustomRequest = sendCustomRequest;
    }
    setPopupAutohide(popupAutohide) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.sendCustomRequest('setPopupAutohide', popupAutohide.toString());
            this.setButtonText(popupAutohide);
        });
    }
    togglePopupAutohide() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const popupAutohide = yield this.sendCustomRequest('togglePopupAutohide');
            this.setButtonText(popupAutohide);
        });
    }
    enableButton(popupAutohide) {
        if (!this.button) {
            this.button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            this.button.command = 'extension.firefox.togglePopupAutohide';
            this.button.text = '';
            this.button.show();
        }
        this.setButtonText(popupAutohide);
    }
    disableButton() {
        if (this.button) {
            this.button.dispose();
            this.button = undefined;
        }
    }
    setButtonText(popupAutohide) {
        if (this.button) {
            this.button.text = `Popup auto-hide ${popupAutohide ? 'enabled' : 'disabled'}`;
        }
    }
}
exports.PopupAutohideManager = PopupAutohideManager;
//# sourceMappingURL=popupAutohideManager.js.map