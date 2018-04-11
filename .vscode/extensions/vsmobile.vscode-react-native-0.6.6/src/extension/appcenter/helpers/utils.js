"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line:no-var-requires
const opener = require("opener");
// tslint:disable-next-line:no-var-requires
const open = require("open");
const Q = require("q");
const fs = require("fs");
const path = require("path");
const package_1 = require("../../../common/node/package");
const appCenterConstants_1 = require("../appCenterConstants");
class ACUtils {
    // Use open for Windows and Mac, opener for Linux
    static OpenUrl(url) {
        switch (process.platform) {
            case "win32":
            case "darwin":
                open(url);
                break;
            default:
                opener(url);
                break;
        }
    }
    static isCodePushProject(projectRoot) {
        if (!projectRoot || !fs.existsSync(path.join(projectRoot, "package.json"))) {
            return Q(false);
        }
        return new package_1.Package(projectRoot).parsePackageInformation().then((packageInfo) => {
            if (packageInfo.dependencies && packageInfo.dependencies[appCenterConstants_1.ACConstants.CodePushNpmPackageName]) {
                return Q(true);
            }
            else {
                return Q(false);
            }
        });
    }
    static formatDeploymentNameForStatusBar(deployment) {
        return deployment.currentDeploymentName;
    }
    static formatAppName(app) {
        if (app) {
            return `${app.appName} (${app.os})`;
        }
        return null;
    }
    static toDefaultApp(app, appOS, appDeployment, targetBinaryVersion, isMandatory) {
        const matches = app.match(this.validApp);
        if (matches !== null) {
            return {
                ownerName: matches[1],
                appName: matches[2],
                identifier: `${matches[1]}/${matches[2]}`,
                os: appOS,
                targetBinaryVersion: targetBinaryVersion,
                isMandatory: isMandatory,
                currentAppDeployments: appDeployment ? appDeployment : {
                    codePushDeployments: new Array(),
                    currentDeploymentName: "",
                },
            };
        }
        return null;
    }
}
ACUtils.validApp = /^([a-zA-Z0-9-_.]{1,100})\/([a-zA-Z0-9-_.]{1,100})$/;
exports.ACUtils = ACUtils;

//# sourceMappingURL=utils.js.map
