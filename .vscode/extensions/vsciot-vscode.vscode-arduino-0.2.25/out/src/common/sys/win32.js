"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const childProcess = require("child_process");
const path = require("path");
const WinReg = require("winreg");
const util_1 = require("../util");
function resolveArduinoPath() {
    return __awaiter(this, void 0, void 0, function* () {
        const isWin64 = process.arch === "x64" || process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432");
        let pathString = yield util_1.getRegistryValues(WinReg.HKLM, isWin64 ? "\\SOFTWARE\\WOW6432Node\\Arduino" : "\\SOFTWARE\\Arduino", "Install_Dir");
        if (util_1.directoryExistsSync(pathString)) {
            return pathString;
        }
        try {
            pathString = childProcess.execSync("where arduino", { encoding: "utf8" });
            pathString = path.resolve(pathString).trim();
            if (util_1.fileExistsSync(pathString)) {
                pathString = path.dirname(path.resolve(pathString));
            }
        }
        catch (error) {
            // when "where arduino"" execution fails, the childProcess.execSync will throw error, just ignore it
        }
        return pathString;
    });
}
exports.resolveArduinoPath = resolveArduinoPath;
function validateArduinoPath(arduinoPath) {
    return util_1.fileExistsSync(path.join(arduinoPath, "arduino_debug.exe"));
}
exports.validateArduinoPath = validateArduinoPath;
function findFile(fileName, cwd) {
    let result;
    try {
        let pathString;
        pathString = childProcess.execSync(`dir ${fileName} /S /B`, { encoding: "utf8", cwd }).split("\n");
        if (pathString && pathString[0] && util_1.fileExistsSync(pathString[0].trim())) {
            result = path.normalize(pathString[0].trim());
        }
    }
    catch (ex) {
        // Ignore the errors.
    }
    return result;
}
exports.findFile = findFile;

//# sourceMappingURL=win32.js.map
