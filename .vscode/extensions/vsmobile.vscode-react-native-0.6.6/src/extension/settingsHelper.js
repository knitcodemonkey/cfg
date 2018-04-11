"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const configurationReader_1 = require("../common/configurationReader");
const packager_1 = require("../common/packager");
const LogHelper_1 = require("./log/LogHelper");
const appCenterConstants_1 = require("./appcenter/appCenterConstants");
class SettingsHelper {
    /**
     * We get the packager port configured by the user
     */
    static getPackagerPort(fsPath) {
        const projectRoot = SettingsHelper.getReactNativeProjectRoot(fsPath);
        let uri = vscode.Uri.file(projectRoot);
        const workspaceConfiguration = vscode.workspace.getConfiguration("react-native.packager", uri);
        if (workspaceConfiguration.has("port")) {
            return configurationReader_1.ConfigurationReader.readInt(workspaceConfiguration.get("port"));
        }
        return packager_1.Packager.DEFAULT_PORT;
    }
    /**
     * Get logLevel setting
     */
    static getLogLevel() {
        const workspaceConfiguration = vscode.workspace.getConfiguration();
        if (workspaceConfiguration.has("react-native-tools.logLevel")) {
            let logLevelString = configurationReader_1.ConfigurationReader.readString(workspaceConfiguration.get("react-native-tools.logLevel"));
            return parseInt(LogHelper_1.LogLevel[logLevelString], 10);
        }
        return LogHelper_1.LogLevel.Info;
    }
    /**
     * Get the React Native project root path
     */
    static getReactNativeProjectRoot(fsPath) {
        const uri = vscode.Uri.file(fsPath);
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        const workspaceConfiguration = vscode.workspace.getConfiguration("react-native-tools", uri);
        if (workspaceConfiguration.has("projectRoot")) {
            let projectRoot = configurationReader_1.ConfigurationReader.readString(workspaceConfiguration.get("projectRoot"));
            if (path.isAbsolute(projectRoot)) {
                return projectRoot;
            }
            else {
                return path.resolve(workspaceFolder.uri.fsPath, projectRoot);
            }
        }
        return workspaceFolder.uri.fsPath;
    }
    /**
     * Get command line run arguments from settings.json
     */
    static getRunArgs(platform, target, uri) {
        const workspaceConfiguration = vscode.workspace.getConfiguration("react-native", uri);
        const configKey = `${platform}.runArguments.${target}`;
        if (workspaceConfiguration.has(configKey)) {
            return configurationReader_1.ConfigurationReader.readArray(workspaceConfiguration.get(configKey));
        }
        return [];
    }
    /**
     * Get appcenter login endpoint setting
     */
    static getAppCenterLoginEndpoint() {
        const workspaceConfiguration = vscode.workspace.getConfiguration();
        if (workspaceConfiguration.has("react-native-tools.appcenter.loginendpoint")) {
            let loginEndpoint = configurationReader_1.ConfigurationReader.readString(workspaceConfiguration.get("react-native-tools.appcenter.loginendpoint"));
            return loginEndpoint;
        }
        return appCenterConstants_1.ACConstants.DefaultLoginEndPoint;
    }
    /**
     * Get appcenter api endpoint setting
     */
    static getAppCenterAPIEndpoint() {
        const workspaceConfiguration = vscode.workspace.getConfiguration();
        if (workspaceConfiguration.has("react-native-tools.appcenter.api.endpoint")) {
            let apiEndpoint = configurationReader_1.ConfigurationReader.readString(workspaceConfiguration.get("react-native-tools.appcenter.api.endpoint"));
            return apiEndpoint;
        }
        return appCenterConstants_1.ACConstants.DefaulAPIEndPoint;
    }
    /**
     * Get old codepush endpoint setting
     */
    static getLegacyCodePushEndpoint() {
        const workspaceConfiguration = vscode.workspace.getConfiguration();
        if (workspaceConfiguration.has("react-native-tools.appcenter.legacycodepushservice")) {
            let apiEndpoint = configurationReader_1.ConfigurationReader.readString(workspaceConfiguration.get("react-native-tools.appcenter.legacycodepushservice"));
            return apiEndpoint;
        }
        return appCenterConstants_1.ACConstants.DefaultLegacyCodePushService;
    }
    static getLegacyCodePushServiceEnabled() {
        const workspaceConfiguration = vscode.workspace.getConfiguration();
        if (workspaceConfiguration.has("react-native-tools.appcenter.legacycodepushserviceenabled")) {
            let enabled = configurationReader_1.ConfigurationReader.readBoolean(workspaceConfiguration.get("react-native-tools.appcenter.legacycodepushserviceenabled"));
            return enabled;
        }
        return true;
    }
    static getEnvArgs(platform, target, uri) {
        const workspaceConfiguration = vscode.workspace.getConfiguration("react-native", uri);
        const configKey = `${platform}.env.${target}`;
        if (workspaceConfiguration.has(configKey)) {
            return configurationReader_1.ConfigurationReader.readObject(workspaceConfiguration.get(configKey));
        }
        return {};
    }
    static getEnvFile(platform, target, uri) {
        const workspaceConfiguration = vscode.workspace.getConfiguration("react-native", uri);
        const configKey = `${platform}.envFile.${target}`;
        if (workspaceConfiguration.has(configKey)) {
            return configurationReader_1.ConfigurationReader.readString(workspaceConfiguration.get(configKey));
        }
        return "";
    }
}
exports.SettingsHelper = SettingsHelper;

//# sourceMappingURL=settingsHelper.js.map
