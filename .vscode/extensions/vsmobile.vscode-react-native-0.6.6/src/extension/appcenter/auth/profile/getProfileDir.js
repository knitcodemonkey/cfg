"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
exports.profileDirName = ".vscode";
exports.profileFile = "codepush.json";
function getProfileDir(projectRootPath) {
    const profileDir = path.join(projectRootPath, exports.profileDirName);
    return profileDir;
}
exports.getProfileDir = getProfileDir;

//# sourceMappingURL=getProfileDir.js.map
