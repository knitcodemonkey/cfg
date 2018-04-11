"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const fileTokenStore_1 = require("./fileTokenStore");
const path = require("path");
const fs = require("fs");
const os = require("os");
exports.tokenFile = "VSCodeAppCenterTokens.json";
let store;
const tokenDirName = ".vscode-react-native";
function getTokenDir() {
    const tokenDir = path.join(getTokenDirParent(), tokenDirName);
    return tokenDir;
}
function getTokenDirParent() {
    if (os.platform() === "win32") {
        return process.env.AppData;
    }
    else {
        return os.homedir();
    }
}
// Currently only support file-base token store
const tokenFilePath = path.join(getTokenDir(), exports.tokenFile);
if (!fs.existsSync(tokenFilePath)) {
    if (!fs.existsSync(getTokenDir())) {
        fs.mkdirSync(getTokenDir());
    }
    fs.writeFileSync(tokenFilePath, /* create empty */ "");
}
store = fileTokenStore_1.createFileTokenStore(tokenFilePath);
exports.tokenStore = store;

//# sourceMappingURL=index.js.map
