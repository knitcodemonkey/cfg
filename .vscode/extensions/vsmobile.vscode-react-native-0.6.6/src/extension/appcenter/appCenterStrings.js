"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
class ACStrings {
}
ACStrings.OkBtnLabel = "Ok";
ACStrings.UserMustSignIn = "You are signed out. Please login to App Center";
ACStrings.SelectLoginTypeMsg = "Select the way you would like to authenticate with App Center";
ACStrings.PleaseProvideToken = "Please provide token to authenticate";
ACStrings.PleaseLoginViaBrowser = "We are about to launch a browser window so you can automatically create an App Center API token";
ACStrings.UserLoggedOutMsg = "Successfully logged out of App Center";
ACStrings.UserIsNotLoggedInMsg = "You are not logged into App Center";
ACStrings.LogoutPrompt = "Please execute logout to signoff from App Center";
ACStrings.NoCodePushDetectedMsg = "Please install React Native Code Push package to run this command!";
ACStrings.NoCurrentAppSetMsg = "No current app specified";
ACStrings.NoCurrentDeploymentSetMsg = "No current deployment";
ACStrings.PleaseProvideCurrentAppMsg = "Please click here to specify current app";
ACStrings.PleaseProvideCurrentDeploymentMsg = "Please click here to specify current deployment";
ACStrings.ProvideCurrentAppPromptMsg = "Please specify an App Center app";
ACStrings.InvalidCurrentAppNameMsg = "Sorry, provided app name is invalid";
ACStrings.InvalidAppVersionParamMsg = "Sorry, provided app version is invalid";
ACStrings.FailedToExecuteLoginMsg = "Failed to execute login to App Center";
ACStrings.SelectCurrentDeploymentMsg = "Please select current deployment";
ACStrings.FetchAppsStatusBarMessage = "Fetching current apps for you...";
ACStrings.FetchDeploymentsStatusBarMessage = "Fetching app deployments for you...";
ACStrings.GettingAppInfoMessage = "Getting app info...";
ACStrings.DetectingAppVersionMessage = "Detecting app version...";
ACStrings.RunningBundleCommandMessage = "Running bundle command...";
ACStrings.ArchivingUpdateContentsMessage = "Archiving update contents...";
ACStrings.ReleasingUpdateContentsMessage = "Releasing update contents to CodePush...";
ACStrings.LoginToAppCenterButton = "Login to App Center";
ACStrings.PleaseProvideTargetBinaryVersion = "Please provide semver compliant version";
ACStrings.LogoutMenuLabel = "Logout";
ACStrings.MenuTitlePlaceholder = "Please select action";
ACStrings.YouAreLoggedInMsg = (name) => {
    return `You are logged into App Center as '${name}'`;
};
ACStrings.YourCurrentAppMsg = (appName) => {
    return `Your current app is '${appName}'`;
};
ACStrings.YourCurrentAppAndDeployemntMsg = (appName, deploymentName) => {
    if (deploymentName) {
        return `Your current app is '${appName}', current deployment is '${deploymentName}'`;
    }
    else {
        return `Your current app is '${appName}', you have no deployments specified`;
    }
};
ACStrings.YourCurrentDeploymentMsg = (deploymentName) => {
    return `Your current deployment is '${deploymentName}'`;
};
ACStrings.ReleaseReactMenuText = (app) => {
    if (app) {
        return `Release '${app.appName}' to '${app.currentAppDeployments.currentDeploymentName}' deployment`;
    }
    else {
        return `Release react (please specify current app first)`;
    }
};
ACStrings.SetCurrentAppMenuText = (app) => {
    if (app) {
        return `Change '${app.appName}' to a different app`;
    }
    else {
        return `Set current app`;
    }
};
ACStrings.SetCurrentAppDeploymentText = (app) => {
    return `Change '${app.currentAppDeployments.currentDeploymentName}' to a different deployment`;
};
ACStrings.SetCurrentAppTargetBinaryVersionText = (app) => {
    const targetBinaryVersionProvided = app.targetBinaryVersion !== undefined && app.targetBinaryVersion;
    return `Change ${targetBinaryVersionProvided ? `'${app.targetBinaryVersion}'` : "automatically fetched"} target binary version`;
};
ACStrings.SetCurrentAppIsMandatoryText = (app) => {
    const isMandatory = app.isMandatory !== undefined && app.isMandatory;
    return `Change release to ${isMandatory ? "be not Mandatory" : "be Mandatory"}`;
};
exports.ACStrings = ACStrings;

//# sourceMappingURL=appCenterStrings.js.map
