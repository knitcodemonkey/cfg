"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const auth_1 = require("../appcenter/auth/auth");
const appCenterStrings_1 = require("./appCenterStrings");
const Q = require("q");
const appCenterConstants_1 = require("./appCenterConstants");
const utils_1 = require("./helpers/utils");
const vscodeUtils_1 = require("./helpers/vscodeUtils");
class AppCenterExtensionManager {
    constructor(projectRootPath) {
        this._projectRootPath = projectRootPath;
    }
    get projectRootPath() {
        return this._projectRootPath;
    }
    setup() {
        return utils_1.ACUtils.isCodePushProject(this._projectRootPath).then((isCodePush) => {
            if (!isCodePush) {
                return Q.resolve(void 0);
            }
            else {
                this.appCenterStatusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left, 12);
                return auth_1.default.getProfile(this._projectRootPath).then((profile) => {
                    return this.setupAppCenterStatusBar(profile);
                });
            }
        });
    }
    dispose() {
        if (this.appCenterStatusBarItem) {
            this.appCenterStatusBarItem.dispose();
        }
    }
    setupAppCenterStatusBar(profile) {
        if (profile && profile.userName) {
            return vscodeUtils_1.VsCodeUtils.setStatusBar(this.appCenterStatusBarItem, `$(icon octicon-person) ${profile.userName}`, appCenterStrings_1.ACStrings.YouAreLoggedInMsg(profile.userName), `${appCenterConstants_1.ACConstants.ExtensionPrefixName}.${appCenterConstants_1.ACCommandNames.ShowMenu}`);
        }
        return vscodeUtils_1.VsCodeUtils.setStatusBar(this.appCenterStatusBarItem, `$(icon octicon-sign-in) ${appCenterStrings_1.ACStrings.LoginToAppCenterButton}`, appCenterStrings_1.ACStrings.UserMustSignIn, `${appCenterConstants_1.ACConstants.ExtensionPrefixName}.${appCenterConstants_1.ACCommandNames.Login}`);
    }
}
exports.AppCenterExtensionManager = AppCenterExtensionManager;

//# sourceMappingURL=appCenterExtensionManager.js.map
