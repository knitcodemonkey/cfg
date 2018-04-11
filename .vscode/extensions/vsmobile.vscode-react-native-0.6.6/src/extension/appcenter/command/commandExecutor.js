"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const Q = require("q");
const qs = require("qs");
const os = require("os");
const LogHelper_1 = require("../../log/LogHelper");
const auth_1 = require("../../appcenter/auth/auth");
const appCenterConstants_1 = require("../appCenterConstants");
const settingsHelper_1 = require("../../settingsHelper");
const appCenterStrings_1 = require("../appCenterStrings");
const release_1 = require("../codepush/release");
const utils_1 = require("../helpers/utils");
const index_1 = require("../codepush/codepush-sdk/src/index");
const createClient_1 = require("../api/createClient");
const semver_1 = require("semver");
const vscodeUtils_1 = require("../helpers/vscodeUtils");
class AppCenterCommandExecutor {
    constructor(logger) {
        this.logger = logger;
    }
    login(appCenterManager) {
        const appCenterLoginOptions = Object.keys(appCenterConstants_1.AppCenterLoginType).filter(k => typeof appCenterConstants_1.AppCenterLoginType[k] === "number");
        vscode.window.showQuickPick(appCenterLoginOptions, { placeHolder: appCenterStrings_1.ACStrings.SelectLoginTypeMsg })
            .then((loginType) => {
            switch (loginType) {
                case (appCenterConstants_1.AppCenterLoginType[appCenterConstants_1.AppCenterLoginType.Interactive]):
                    const messageItems = [];
                    const loginUrl = `${settingsHelper_1.SettingsHelper.getAppCenterLoginEndpoint()}?${qs.stringify({ hostname: os.hostname() })}`;
                    messageItems.push({ title: appCenterStrings_1.ACStrings.OkBtnLabel,
                        url: loginUrl });
                    return vscodeUtils_1.VsCodeUtils.ShowInformationMessage(appCenterStrings_1.ACStrings.PleaseLoginViaBrowser, ...messageItems)
                        .then((selection) => {
                        if (selection) {
                            return vscode.window.showInputBox({ prompt: appCenterStrings_1.ACStrings.PleaseProvideToken, ignoreFocusOut: true })
                                .then(token => {
                                this.loginWithToken(token, appCenterManager);
                            });
                        }
                        else
                            return Q.resolve(void 0);
                    });
                case (appCenterConstants_1.AppCenterLoginType[appCenterConstants_1.AppCenterLoginType.Token]):
                    return vscode.window.showInputBox({ prompt: appCenterStrings_1.ACStrings.PleaseProvideToken, ignoreFocusOut: true })
                        .then(token => {
                        return this.loginWithToken(token, appCenterManager);
                    });
                default:
                    // User canel login otherwise
                    return Q.resolve(void 0);
            }
        });
        return Q.resolve(void 0);
    }
    logout(appCenterManager) {
        return auth_1.default.doLogout(appCenterManager.projectRootPath).then(() => {
            vscodeUtils_1.VsCodeUtils.ShowInformationMessage(appCenterStrings_1.ACStrings.UserLoggedOutMsg);
            return appCenterManager.setupAppCenterStatusBar(null);
        }).catch(() => {
            this.logger.log("An errro occured on logout", LogHelper_1.LogLevel.Error);
        });
    }
    whoAmI(appCenterManager) {
        return auth_1.default.getProfile(appCenterManager.projectRootPath).then((profile) => {
            if (profile && profile.displayName) {
                vscodeUtils_1.VsCodeUtils.ShowInformationMessage(appCenterStrings_1.ACStrings.YouAreLoggedInMsg(profile.displayName));
            }
            else {
                vscodeUtils_1.VsCodeUtils.ShowInformationMessage(appCenterStrings_1.ACStrings.UserIsNotLoggedInMsg);
            }
            return Q.resolve(void 0);
        });
    }
    setCurrentDeployment(appCenterManager) {
        this.restoreCurrentApp(appCenterManager.projectRootPath)
            .then((currentApp) => {
            if (currentApp && currentApp.currentAppDeployments && currentApp.currentAppDeployments.codePushDeployments) {
                const deploymentOptions = currentApp.currentAppDeployments.codePushDeployments.map((deployment) => {
                    return deployment.name;
                });
                vscode.window.showQuickPick(deploymentOptions, { placeHolder: appCenterStrings_1.ACStrings.SelectCurrentDeploymentMsg })
                    .then((deploymentName) => {
                    if (deploymentName) {
                        this.saveCurrentApp(appCenterManager.projectRootPath, currentApp.identifier, appCenterConstants_1.AppCenterOS[currentApp.os], {
                            currentDeploymentName: deploymentName,
                            codePushDeployments: currentApp.currentAppDeployments.codePushDeployments,
                        }, currentApp.targetBinaryVersion, currentApp.isMandatory);
                        vscodeUtils_1.VsCodeUtils.ShowInformationMessage(appCenterStrings_1.ACStrings.YourCurrentDeploymentMsg(deploymentName));
                    }
                });
            }
            else {
                vscodeUtils_1.VsCodeUtils.ShowInformationMessage(appCenterStrings_1.ACStrings.NoCurrentAppSetMsg);
            }
        });
        return Q.resolve(void 0);
    }
    getCurrentApp(appCenterManager) {
        this.restoreCurrentApp(appCenterManager.projectRootPath).then((app) => {
            if (app) {
                vscodeUtils_1.VsCodeUtils.ShowInformationMessage(appCenterStrings_1.ACStrings.YourCurrentAppMsg(app.identifier));
            }
            else {
                vscodeUtils_1.VsCodeUtils.ShowInformationMessage(appCenterStrings_1.ACStrings.NoCurrentAppSetMsg);
            }
        });
        return Q.resolve(void 0);
    }
    setCurrentApp(client, appCenterManager) {
        vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: "Get Apps" }, p => {
            return new Promise((resolve, reject) => {
                p.report({ message: appCenterStrings_1.ACStrings.FetchAppsStatusBarMessage });
                createClient_1.getQPromisifiedClientResult(client.account.apps.list()).then((apps) => {
                    const appsList = apps;
                    const reactNativeApps = appsList.filter(app => app.platform === appCenterConstants_1.ACConstants.AppCenterReactNativePlatformName);
                    resolve(reactNativeApps);
                });
            });
        }).then((rnApps) => {
            let options = rnApps.map(app => {
                return {
                    label: `${app.name} (${app.os})`,
                    description: app.displayName,
                    target: app.name,
                };
            });
            vscode.window.showQuickPick(options, { placeHolder: appCenterStrings_1.ACStrings.ProvideCurrentAppPromptMsg })
                .then((selected) => {
                if (selected) {
                    const selectedApps = rnApps.filter(app => app.name === selected.target);
                    if (selectedApps && selectedApps.length === 1) {
                        const selectedApp = selectedApps[0];
                        const selectedAppName = `${selectedApp.owner.name}/${selectedApp.name}`;
                        const OS = appCenterConstants_1.AppCenterOS[selectedApp.os.toLowerCase()];
                        vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: "Get Deployments" }, p => {
                            return new Promise((resolve, reject) => {
                                p.report({ message: appCenterStrings_1.ACStrings.FetchDeploymentsStatusBarMessage });
                                createClient_1.getQPromisifiedClientResult(client.codepush.codePushDeployments.list(selectedApp.name, selectedApp.owner.name))
                                    .then((deployments) => {
                                    resolve(deployments.sort((a, b) => {
                                        return a.name < b.name; // sort alphabetically
                                    }));
                                });
                            });
                        })
                            .then((appDeployments) => {
                            let currentDeployments = null;
                            if (appDeployments.length > 0) {
                                const deployments = appDeployments.map((d) => {
                                    return {
                                        name: d.name,
                                    };
                                });
                                currentDeployments = {
                                    codePushDeployments: deployments,
                                    currentDeploymentName: appDeployments[0].name,
                                };
                            }
                            this.saveCurrentApp(appCenterManager.projectRootPath, selectedAppName, OS, currentDeployments, appCenterConstants_1.ACConstants.AppCenterDefaultTargetBinaryVersion, appCenterConstants_1.ACConstants.AppCenterDefaultIsMandatoryParam)
                                .then((app) => {
                                if (app) {
                                    return vscodeUtils_1.VsCodeUtils.ShowInformationMessage(appCenterStrings_1.ACStrings.YourCurrentAppAndDeployemntMsg(selected.target, app.currentAppDeployments.currentDeploymentName));
                                }
                                else {
                                    this.logger.error("Failed to save current app");
                                    return Q.resolve(void 0);
                                }
                            });
                        });
                    }
                }
            });
        });
        return Q.resolve(void 0);
    }
    releaseReact(client, appCenterManager) {
        let codePushRelaseParams = {};
        const projectRootPath = appCenterManager.projectRootPath;
        return Q.Promise((resolve, reject) => {
            let updateContentsDirectory;
            let isMandatory;
            vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: "Get Apps" }, p => {
                return new Promise((appResolve, appReject) => {
                    p.report({ message: appCenterStrings_1.ACStrings.GettingAppInfoMessage });
                    this.restoreCurrentApp(appCenterManager.projectRootPath)
                        .then((currentApp) => appResolve(currentApp))
                        .catch(err => appReject(err));
                }).then((currentApp) => {
                    p.report({ message: appCenterStrings_1.ACStrings.DetectingAppVersionMessage });
                    if (!currentApp) {
                        throw new Error(`No current app has been specified.`);
                    }
                    if (!currentApp.os || !index_1.reactNative.isValidOS(currentApp.os)) {
                        throw new Error(`OS must be "android", "ios", or "windows".`);
                    }
                    codePushRelaseParams.app = currentApp;
                    codePushRelaseParams.deploymentName = currentApp.currentAppDeployments.currentDeploymentName;
                    currentApp.os = currentApp.os.toLowerCase();
                    isMandatory = !!currentApp.isMandatory;
                    if (currentApp.targetBinaryVersion !== appCenterConstants_1.ACConstants.AppCenterDefaultTargetBinaryVersion) {
                        return currentApp.targetBinaryVersion;
                    }
                    else {
                        switch (currentApp.os) {
                            case "android": return index_1.reactNative.getAndroidAppVersion(projectRootPath);
                            case "ios": return index_1.reactNative.getiOSAppVersion(projectRootPath);
                            case "windows": return index_1.reactNative.getWindowsAppVersion(projectRootPath);
                            default: throw new Error(`OS must be "android", "ios", or "windows".`);
                        }
                    }
                }).then((appVersion) => {
                    p.report({ message: appCenterStrings_1.ACStrings.RunningBundleCommandMessage });
                    codePushRelaseParams.appVersion = appVersion;
                    return index_1.reactNative.makeUpdateContents({
                        os: codePushRelaseParams.app.os,
                        projectRootPath: projectRootPath,
                    });
                }).then((pathToUpdateContents) => {
                    p.report({ message: appCenterStrings_1.ACStrings.ArchivingUpdateContentsMessage });
                    updateContentsDirectory = pathToUpdateContents;
                    this.logger.log(`CodePush updated contents directory path: ${updateContentsDirectory}`, LogHelper_1.LogLevel.Debug);
                    return index_1.updateContents.zip(pathToUpdateContents, projectRootPath);
                }).then((pathToZippedBundle) => {
                    p.report({ message: appCenterStrings_1.ACStrings.ReleasingUpdateContentsMessage });
                    codePushRelaseParams.updatedContentZipPath = pathToZippedBundle;
                    codePushRelaseParams.isMandatory = isMandatory;
                    return new Promise((publishResolve, publishReject) => {
                        auth_1.default.getProfile(projectRootPath)
                            .then((profile) => {
                            return profile.accessToken;
                        }).then((token) => {
                            codePushRelaseParams.token = token;
                            return release_1.default.exec(client, codePushRelaseParams, this.logger);
                        }).then((response) => publishResolve(response))
                            .catch((error) => publishReject(error));
                    });
                }).then((response) => {
                    if (response.succeeded && response.result) {
                        vscodeUtils_1.VsCodeUtils.ShowInformationMessage(`Successfully released an update to the "${codePushRelaseParams.deploymentName}" deployment of the "${codePushRelaseParams.app.appName}" app`);
                        resolve(response.result);
                    }
                    else {
                        vscodeUtils_1.VsCodeUtils.ShowErrorMessage(response.errorMessage);
                    }
                    index_1.fileUtils.rmDir(codePushRelaseParams.updatedContentZipPath);
                }).catch((error) => {
                    if (error && error.message) {
                        vscodeUtils_1.VsCodeUtils.ShowErrorMessage(`An error occured on doing Code Push release. ${error.message}`);
                    }
                    else {
                        vscodeUtils_1.VsCodeUtils.ShowErrorMessage("An error occured on doing Code Push release");
                    }
                    index_1.fileUtils.rmDir(codePushRelaseParams.updatedContentZipPath);
                });
            });
        });
    }
    showMenu(client, appCenterManager) {
        return auth_1.default.getProfile(appCenterManager.projectRootPath).then((profile) => {
            let defaultApp = null;
            if (profile && profile.defaultApp) {
                defaultApp = profile.defaultApp;
            }
            let menuPlaceHolederTitle = appCenterStrings_1.ACStrings.MenuTitlePlaceholder;
            let appCenterMenuOptions = [
                {
                    label: appCenterStrings_1.ACStrings.ReleaseReactMenuText(defaultApp),
                    description: "",
                    target: appCenterConstants_1.ACCommandNames.CodePushReleaseReact,
                },
                {
                    label: appCenterStrings_1.ACStrings.SetCurrentAppMenuText(defaultApp),
                    description: "",
                    target: appCenterConstants_1.ACCommandNames.SetCurrentApp,
                },
                {
                    label: appCenterStrings_1.ACStrings.LogoutMenuLabel,
                    description: "",
                    target: appCenterConstants_1.ACCommandNames.Logout,
                },
            ];
            // This item is avaliable only if we have specified app already
            if (defaultApp && defaultApp.currentAppDeployments) {
                // Let logout command be always the last one in the list
                appCenterMenuOptions.splice(appCenterMenuOptions.length - 1, 0, {
                    label: appCenterStrings_1.ACStrings.SetCurrentAppDeploymentText(defaultApp),
                    description: "",
                    target: appCenterConstants_1.ACCommandNames.SetCurrentDeployment,
                });
                appCenterMenuOptions.splice(appCenterMenuOptions.length - 1, 0, {
                    label: appCenterStrings_1.ACStrings.SetCurrentAppTargetBinaryVersionText(defaultApp),
                    description: "",
                    target: appCenterConstants_1.ACCommandNames.SetTargetBinaryVersionForRelease,
                });
                appCenterMenuOptions.splice(appCenterMenuOptions.length - 1, 0, {
                    label: appCenterStrings_1.ACStrings.SetCurrentAppIsMandatoryText(defaultApp),
                    description: "",
                    target: appCenterConstants_1.ACCommandNames.SwitchMandatoryPropertyForRelease,
                });
            }
            return vscode.window.showQuickPick(appCenterMenuOptions, { placeHolder: menuPlaceHolederTitle })
                .then((selected) => {
                if (!selected) {
                    // user cancel selection
                    return Q.resolve(void 0);
                }
                switch (selected.target) {
                    case (appCenterConstants_1.ACCommandNames.SetCurrentApp):
                        return this.setCurrentApp(client, appCenterManager);
                    case (appCenterConstants_1.ACCommandNames.SetCurrentDeployment):
                        return this.setCurrentDeployment(appCenterManager);
                    case (appCenterConstants_1.ACCommandNames.CodePushReleaseReact):
                        return this.releaseReact(client, appCenterManager);
                    case (appCenterConstants_1.ACCommandNames.SetTargetBinaryVersionForRelease):
                        return this.setTargetBinaryVersionForRelease(appCenterManager);
                    case (appCenterConstants_1.ACCommandNames.SwitchMandatoryPropertyForRelease):
                        return this.switchIsMandatoryForRelease(appCenterManager);
                    case (appCenterConstants_1.ACCommandNames.Logout):
                        return this.logout(appCenterManager);
                    default:
                        // Ideally shouldn't be there :)
                        this.logger.error("Unknown appcenter show menu command");
                        return Q.resolve(void 0);
                }
            });
        });
    }
    switchIsMandatoryForRelease(appCenterManager) {
        this.restoreCurrentApp(appCenterManager.projectRootPath).then((app) => {
            if (app) {
                const newMandatoryValue = !!!app.isMandatory;
                const osVal = appCenterConstants_1.AppCenterOS[app.os];
                this.saveCurrentApp(appCenterManager.projectRootPath, app.identifier, osVal, {
                    currentDeploymentName: app.currentAppDeployments.currentDeploymentName,
                    codePushDeployments: app.currentAppDeployments.codePushDeployments,
                }, app.targetBinaryVersion, newMandatoryValue).then(() => {
                    vscodeUtils_1.VsCodeUtils.ShowInformationMessage(`Changed release to ${newMandatoryValue ? "Mandatory" : "NOT Mandatory"}`);
                });
            }
            else {
                vscodeUtils_1.VsCodeUtils.ShowInformationMessage(appCenterStrings_1.ACStrings.NoCurrentAppSetMsg);
            }
        });
        return Q.resolve(void 0);
    }
    setTargetBinaryVersionForRelease(appCenterManager) {
        vscode.window.showInputBox({ prompt: appCenterStrings_1.ACStrings.PleaseProvideTargetBinaryVersion, ignoreFocusOut: true })
            .then(appVersion => {
            if (appVersion === appCenterConstants_1.ACConstants.AppCenterDefaultTargetBinaryVersion || (appVersion && !!semver_1.validRange(appVersion))) {
                return this.restoreCurrentApp(appCenterManager.projectRootPath).then((app) => {
                    if (app) {
                        return this.saveCurrentApp(appCenterManager.projectRootPath, app.identifier, appCenterConstants_1.AppCenterOS[app.os], {
                            currentDeploymentName: app.currentAppDeployments.currentDeploymentName,
                            codePushDeployments: app.currentAppDeployments.codePushDeployments,
                        }, appVersion, app.isMandatory).then(() => {
                            if (appVersion) {
                                vscodeUtils_1.VsCodeUtils.ShowInformationMessage(`Changed target binary version to '${appVersion}'`);
                            }
                            else {
                                vscodeUtils_1.VsCodeUtils.ShowInformationMessage(`Changed target binary version to automatically fetched`);
                            }
                        });
                    }
                    else {
                        vscodeUtils_1.VsCodeUtils.ShowInformationMessage(appCenterStrings_1.ACStrings.NoCurrentAppSetMsg);
                        return Q.resolve(void 0);
                    }
                });
            }
            else if (appVersion === undefined) {
                // if user press esc do nothing then
                return Q.resolve(void 0);
            }
            else {
                vscodeUtils_1.VsCodeUtils.ShowWarningMessage(appCenterStrings_1.ACStrings.InvalidAppVersionParamMsg);
                return Q.resolve(void 0);
            }
        });
        return Q.resolve(void 0);
    }
    saveCurrentApp(projectRootPath, currentAppName, appOS, currentAppDeployments, targetBinaryVersion, isMandatory) {
        const defaultApp = utils_1.ACUtils.toDefaultApp(currentAppName, appOS, currentAppDeployments, targetBinaryVersion, isMandatory);
        if (!defaultApp) {
            vscodeUtils_1.VsCodeUtils.ShowWarningMessage(appCenterStrings_1.ACStrings.InvalidCurrentAppNameMsg);
            return Q.resolve(null);
        }
        return auth_1.default.getProfile(projectRootPath).then((profile) => {
            if (profile) {
                profile.defaultApp = defaultApp;
                profile.save(projectRootPath);
                return Q.resolve(defaultApp);
            }
            else {
                // No profile - not logged in?
                vscodeUtils_1.VsCodeUtils.ShowWarningMessage(appCenterStrings_1.ACStrings.UserIsNotLoggedInMsg);
                return Q.resolve(null);
            }
        });
    }
    restoreCurrentApp(projectRootPath) {
        return auth_1.default.getProfile(projectRootPath).then((profile) => {
            if (profile && profile.defaultApp) {
                return Q.resolve(profile.defaultApp);
            }
            return Q.resolve(null);
        });
    }
    loginWithToken(token, appCenterManager) {
        if (!token) {
            return;
        }
        return auth_1.default.doTokenLogin(token, appCenterManager.projectRootPath).then((profile) => {
            if (!profile) {
                this.logger.log("Failed to fetch user info from server", LogHelper_1.LogLevel.Error);
                vscodeUtils_1.VsCodeUtils.ShowWarningMessage(appCenterStrings_1.ACStrings.FailedToExecuteLoginMsg);
                return;
            }
            vscodeUtils_1.VsCodeUtils.ShowInformationMessage(appCenterStrings_1.ACStrings.YouAreLoggedInMsg(profile.displayName));
            return appCenterManager.setupAppCenterStatusBar(profile);
        });
    }
}
exports.AppCenterCommandExecutor = AppCenterCommandExecutor;

//# sourceMappingURL=commandExecutor.js.map
