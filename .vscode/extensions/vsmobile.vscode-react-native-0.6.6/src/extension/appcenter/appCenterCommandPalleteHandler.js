"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const LogHelper_1 = require("../log/LogHelper");
const Q = require("q");
const commandExecutor_1 = require("./command/commandExecutor");
const auth_1 = require("../appcenter/auth/auth");
const createClient_1 = require("./api/createClient");
const settingsHelper_1 = require("../settingsHelper");
const appCenterConstants_1 = require("./appCenterConstants");
const appCenterStrings_1 = require("./appCenterStrings");
const utils_1 = require("./helpers/utils");
const vscodeUtils_1 = require("./helpers/vscodeUtils");
class AppCenterCommandPalleteHandler {
    constructor(logger) {
        this.commandExecutor = new commandExecutor_1.AppCenterCommandExecutor(logger);
        this.clientFactory = createClient_1.createAppCenterClient();
        this.logger = logger;
    }
    set AppCenterManager(manager) {
        this.appCenterManager = manager;
    }
    run(command) {
        return utils_1.ACUtils.isCodePushProject(this.appCenterManager.projectRootPath).then((isCodePush) => {
            if (!isCodePush) {
                vscodeUtils_1.VsCodeUtils.ShowWarningMessage(appCenterStrings_1.ACStrings.NoCodePushDetectedMsg);
                return Q.resolve(void 0);
            }
            else {
                // Login is special case
                if (command === appCenterConstants_1.AppCenterCommandType.Login) {
                    return this.commandExecutor.login(this.appCenterManager);
                }
                return auth_1.default.getProfile(this.appCenterManager.projectRootPath).then((profile) => {
                    if (!profile) {
                        vscodeUtils_1.VsCodeUtils.ShowWarningMessage(appCenterStrings_1.ACStrings.UserIsNotLoggedInMsg);
                        return Q.resolve(void 0);
                    }
                    else {
                        const clientOrNull = this.resolveAppCenterClient(profile);
                        if (clientOrNull) {
                            this.client = clientOrNull;
                            switch (command) {
                                case (appCenterConstants_1.AppCenterCommandType.Logout):
                                    return this.commandExecutor.logout(this.appCenterManager);
                                case (appCenterConstants_1.AppCenterCommandType.Whoami):
                                    return this.commandExecutor.whoAmI(this.appCenterManager);
                                case (appCenterConstants_1.AppCenterCommandType.SetCurrentApp):
                                    return this.commandExecutor.setCurrentApp(this.client, this.appCenterManager);
                                case (appCenterConstants_1.AppCenterCommandType.GetCurrentApp):
                                    return this.commandExecutor.getCurrentApp(this.appCenterManager);
                                case (appCenterConstants_1.AppCenterCommandType.SetCurrentDeployment):
                                    return this.commandExecutor.setCurrentDeployment(this.appCenterManager);
                                case (appCenterConstants_1.AppCenterCommandType.CodePushReleaseReact):
                                    return this.commandExecutor.releaseReact(this.client, this.appCenterManager);
                                case (appCenterConstants_1.AppCenterCommandType.ShowMenu):
                                    return this.commandExecutor.showMenu(this.client, this.appCenterManager);
                                case (appCenterConstants_1.AppCenterCommandType.SwitchMandatoryPropForRelease):
                                    return this.commandExecutor.switchIsMandatoryForRelease(this.appCenterManager);
                                case (appCenterConstants_1.AppCenterCommandType.SetTargetBinaryVersionForRelease):
                                    return this.commandExecutor.setTargetBinaryVersionForRelease(this.appCenterManager);
                                default:
                                    throw new Error("Unknown App Center command!");
                            }
                        }
                        else {
                            this.logger.log("Failed to get App Center client", LogHelper_1.LogLevel.Error);
                            throw new Error("Failed to get App Center client!");
                        }
                    }
                });
            }
        });
    }
    resolveAppCenterClient(profile) {
        if (!this.client) {
            if (profile) {
                return this.clientFactory.fromProfile(profile, settingsHelper_1.SettingsHelper.getAppCenterAPIEndpoint());
            }
            else {
                throw new Error("No App Center user specified!");
            }
        }
        return this.client;
    }
}
exports.AppCenterCommandPalleteHandler = AppCenterCommandPalleteHandler;

//# sourceMappingURL=appCenterCommandPalleteHandler.js.map
