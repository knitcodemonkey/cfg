"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const appCenterConstants_1 = require("../appCenterConstants");
const vscode_1 = require("vscode");
const utils_1 = require("./utils");
const Q = require("q");
class ButtonMessageItem {
}
exports.ButtonMessageItem = ButtonMessageItem;
class VsCodeUtils {
    static setStatusBar(statusBar, text, tooltip, commandOnClick) {
        if (statusBar !== undefined) {
            statusBar.command = commandOnClick; // undefined clears the command
            statusBar.text = text;
            statusBar.tooltip = tooltip;
            statusBar.color = appCenterConstants_1.ACConstants.AppCenterCodePushStatusBarColor;
            statusBar.show();
        }
        return Q.resolve(void 0);
    }
    static ShowInformationMessage(message, ...urlMessageItem) {
        return Q.Promise((resolve, reject) => {
            return this.showMessage(message, appCenterConstants_1.MessageTypes.Info, ...urlMessageItem).then((res) => {
                resolve(res);
                return;
            });
        });
    }
    static ShowWarningMessage(message, ...urlMessageItem) {
        return Q.Promise((resolve, reject) => {
            return this.showMessage(message, appCenterConstants_1.MessageTypes.Warn, ...urlMessageItem).then((res) => {
                resolve(res);
                return;
            });
        });
    }
    static ShowErrorMessage(message, ...urlMessageItem) {
        return Q.Promise((resolve, reject) => {
            return this.showMessage(message, appCenterConstants_1.MessageTypes.Error, ...urlMessageItem).then((res) => {
                resolve(res);
                return;
            });
        });
    }
    static showMessage(messageToDisplay, type, ...urlMessageItem) {
        return __awaiter(this, void 0, void 0, function* () {
            // The following "cast" allows us to pass our own type around (and not reference "vscode" via an import)
            const messageItems = urlMessageItem;
            let chosenItem;
            switch (type) {
                case appCenterConstants_1.MessageTypes.Error:
                    chosenItem = yield vscode_1.window.showErrorMessage(messageToDisplay, ...messageItems);
                    break;
                case appCenterConstants_1.MessageTypes.Info:
                    chosenItem = yield vscode_1.window.showInformationMessage(messageToDisplay, ...messageItems);
                    break;
                case appCenterConstants_1.MessageTypes.Warn:
                    chosenItem = yield vscode_1.window.showWarningMessage(messageToDisplay, ...messageItems);
                    break;
                default:
                    break;
            }
            if (chosenItem) {
                if (chosenItem.url) {
                    utils_1.ACUtils.OpenUrl(chosenItem.url);
                }
                if (chosenItem.command) {
                    vscode_1.commands.executeCommand(chosenItem.command);
                }
            }
            return chosenItem;
        });
    }
}
exports.VsCodeUtils = VsCodeUtils;

//# sourceMappingURL=vscodeUtils.js.map
