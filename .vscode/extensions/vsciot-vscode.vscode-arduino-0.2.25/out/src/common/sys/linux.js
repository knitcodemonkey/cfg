"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
const childProcess = require("child_process");
const path = require("path");
const util_1 = require("../util");
function resolveArduinoPath() {
    let pathString;
    try {
        pathString = childProcess.execSync("readlink -f $(which arduino)", { encoding: "utf8" });
        pathString = path.resolve(pathString).trim();
        if (util_1.fileExistsSync(pathString)) {
            pathString = path.dirname(path.resolve(pathString));
        }
    }
    catch (ex) {
        // Ignore the errors.
    }
    return pathString || "";
}
exports.resolveArduinoPath = resolveArduinoPath;
function validateArduinoPath(arduinoPath) {
    return util_1.fileExistsSync(path.join(arduinoPath, "arduino"));
}
exports.validateArduinoPath = validateArduinoPath;
function findFile(fileName, cwd) {
    let pathString;
    try {
        pathString = childProcess.execSync(`find ${cwd} -name ${fileName} -type f`, { encoding: "utf8" }).split("\n");
        if (pathString && pathString[0] && util_1.fileExistsSync(pathString[0].trim())) {
            pathString = path.normalize(pathString[0].trim());
        }
        else {
            pathString = null;
        }
    }
    catch (ex) {
        // Ignore the errors.
    }
    return pathString;
}
exports.findFile = findFile;

//# sourceMappingURL=linux.js.map
