"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
class ACConstants {
}
ACConstants.ExtensionPrefixName = "reactNative";
ACConstants.AppCenterExtensionName = "appcenter";
ACConstants.DefaulAPIEndPoint = "https://api.appcenter.ms";
ACConstants.DefaultLoginEndPoint = "https://appcenter.ms/cli-login";
ACConstants.DefaultLegacyCodePushService = "https://codepush-management.azurewebsites.net/";
ACConstants.CodePushNpmPackageName = "react-native-code-push";
ACConstants.AppCenterReactNativePlatformName = "React-Native";
ACConstants.AppCenterCodePushStatusBarColor = "#F3F3B2";
ACConstants.AppCenterDefaultTargetBinaryVersion = "";
ACConstants.AppCenterDefaultIsMandatoryParam = false;
exports.ACConstants = ACConstants;
class ACCommandNames {
}
ACCommandNames.CommandPrefix = ACConstants.AppCenterExtensionName + ".";
ACCommandNames.Login = ACCommandNames.CommandPrefix + "login";
ACCommandNames.Logout = ACCommandNames.CommandPrefix + "logout";
ACCommandNames.WhoAmI = ACCommandNames.CommandPrefix + "whoami";
ACCommandNames.SetCurrentApp = ACCommandNames.CommandPrefix + "setcurrentapp";
ACCommandNames.GetCurrentApp = ACCommandNames.CommandPrefix + "getcurrentapp";
ACCommandNames.SetCurrentDeployment = ACCommandNames.CommandPrefix + "setcurrentdeployment";
ACCommandNames.CodePushReleaseReact = ACCommandNames.CommandPrefix + "releasereact";
ACCommandNames.ShowMenu = ACCommandNames.CommandPrefix + "showmenu";
ACCommandNames.SwitchMandatoryPropertyForRelease = ACCommandNames.CommandPrefix + "switchMandatoryPropForRelease";
ACCommandNames.SetTargetBinaryVersionForRelease = ACCommandNames.CommandPrefix + "setTargetBinaryVersion";
exports.ACCommandNames = ACCommandNames;
var AppCenterOS;
(function (AppCenterOS) {
    AppCenterOS["ios"] = "ios";
    AppCenterOS["android"] = "android";
})(AppCenterOS = exports.AppCenterOS || (exports.AppCenterOS = {}));
var AppCenterLoginType;
(function (AppCenterLoginType) {
    AppCenterLoginType[AppCenterLoginType["Interactive"] = 0] = "Interactive";
    AppCenterLoginType[AppCenterLoginType["Token"] = 1] = "Token";
})(AppCenterLoginType = exports.AppCenterLoginType || (exports.AppCenterLoginType = {}));
var AppCenterCommandType;
(function (AppCenterCommandType) {
    // Auth commands
    AppCenterCommandType[AppCenterCommandType["Login"] = 1] = "Login";
    AppCenterCommandType[AppCenterCommandType["Logout"] = 2] = "Logout";
    AppCenterCommandType[AppCenterCommandType["Whoami"] = 3] = "Whoami";
    // App commands
    AppCenterCommandType[AppCenterCommandType["SetCurrentApp"] = 4] = "SetCurrentApp";
    AppCenterCommandType[AppCenterCommandType["GetCurrentApp"] = 5] = "GetCurrentApp";
    // Deployment commands
    AppCenterCommandType[AppCenterCommandType["SetCurrentDeployment"] = 6] = "SetCurrentDeployment";
    // CodePush commands
    AppCenterCommandType[AppCenterCommandType["CodePushReleaseReact"] = 7] = "CodePushReleaseReact";
    AppCenterCommandType[AppCenterCommandType["SwitchMandatoryPropForRelease"] = 8] = "SwitchMandatoryPropForRelease";
    AppCenterCommandType[AppCenterCommandType["SetTargetBinaryVersionForRelease"] = 9] = "SetTargetBinaryVersionForRelease";
    // Common commands
    AppCenterCommandType[AppCenterCommandType["ShowMenu"] = 10] = "ShowMenu";
})(AppCenterCommandType = exports.AppCenterCommandType || (exports.AppCenterCommandType = {}));
var MessageTypes;
(function (MessageTypes) {
    MessageTypes[MessageTypes["Error"] = 0] = "Error";
    MessageTypes[MessageTypes["Warn"] = 1] = "Warn";
    MessageTypes[MessageTypes["Info"] = 2] = "Info";
})(MessageTypes = exports.MessageTypes || (exports.MessageTypes = {}));

//# sourceMappingURL=appCenterConstants.js.map
