"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-plus");
const path = require("path");
const timers_1 = require("timers");
const vscode = require("vscode");
const WinReg = require("winreg");
const constants_1 = require("./constants");
const DialogResponses_1 = require("./DialogResponses");
function delay(ms) {
    return new Promise(resolve => timers_1.setTimeout(resolve, ms));
}
exports.delay = delay;
function getRegistryValues(hive, key, name) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const regKey = new WinReg({
                hive,
                key,
            });
            regKey.valueExists(name, (e, exists) => {
                if (e) {
                    return reject(e);
                }
                if (exists) {
                    regKey.get(name, (err, result) => {
                        if (!err) {
                            return resolve(result ? result.value : '');
                        }
                        else {
                            return reject(err);
                        }
                    });
                }
                else {
                    return resolve('');
                }
            });
        }
        catch (ex) {
            return reject(ex);
        }
    }));
}
exports.getRegistryValues = getRegistryValues;
function directoryExistsSync(dirPath) {
    try {
        return fs.statSync(dirPath).isDirectory();
    }
    catch (e) {
        return false;
    }
}
exports.directoryExistsSync = directoryExistsSync;
function mkdirRecursivelySync(dirPath) {
    if (directoryExistsSync(dirPath)) {
        return;
    }
    const dirname = path.dirname(dirPath);
    if (path.normalize(dirname) === path.normalize(dirPath)) {
        fs.mkdirSync(dirPath);
    }
    else if (directoryExistsSync(dirname)) {
        fs.mkdirSync(dirPath);
    }
    else {
        mkdirRecursivelySync(dirname);
        fs.mkdirSync(dirPath);
    }
}
exports.mkdirRecursivelySync = mkdirRecursivelySync;
function fileExistsSync(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    }
    catch (e) {
        return false;
    }
}
exports.fileExistsSync = fileExistsSync;
function getScriptTemplateNameFromLanguage(language) {
    switch (language) {
        case constants_1.AzureFunctionsLanguage.CSharpScript:
            return 'IoTHubTrigger-CSharp';
        case constants_1.AzureFunctionsLanguage.JavaScript:
            return 'IoTHubTrigger-JavaScript';
        case constants_1.AzureFunctionsLanguage.CSharpLibrary:
            return 'Azure.Function.CSharp.IotHubTrigger.2.x';
        default:
            return undefined;
    }
}
exports.getScriptTemplateNameFromLanguage = getScriptTemplateNameFromLanguage;
function selectWorkspaceFolder(placeHolder, getSubPath) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield selectWorkspaceItem(placeHolder, {
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            defaultUri: vscode.workspace.workspaceFolders &&
                vscode.workspace.workspaceFolders.length > 0 ?
                vscode.workspace.workspaceFolders[0].uri :
                undefined,
            openLabel: 'Select'
        }, getSubPath);
    });
}
exports.selectWorkspaceFolder = selectWorkspaceFolder;
function showOpenDialog(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield vscode.window.showOpenDialog(options);
        if (result === undefined) {
            throw new Error('User cancelled the operation.');
        }
        else {
            return result;
        }
    });
}
exports.showOpenDialog = showOpenDialog;
function selectWorkspaceItem(placeHolder, options, getSubPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let folder;
        let folderPicks = [];
        if (vscode.workspace.workspaceFolders) {
            folderPicks =
                vscode.workspace.workspaceFolders.map((f) => {
                    let subpath;
                    if (getSubPath) {
                        subpath = getSubPath(f);
                    }
                    const fsPath = subpath ? path.join(f.uri.fsPath, subpath) : f.uri.fsPath;
                    return {
                        label: path.basename(fsPath),
                        description: fsPath,
                        data: fsPath
                    };
                });
        }
        folderPicks.push({ label: 'Browse...', description: '', data: undefined });
        folder = yield vscode.window.showQuickPick(folderPicks, { placeHolder });
        if (folder === undefined) {
            throw new Error('User cancelled the operation.');
        }
        return folder && folder.data ? folder.data :
            (yield showOpenDialog(options))[0].fsPath;
    });
}
exports.selectWorkspaceItem = selectWorkspaceItem;
function askAndNewProject(telemetryContext) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = 'An IoT project is needed to process the operation, do you want to create an IoT project?';
        const result = yield vscode.window.showInformationMessage(message, DialogResponses_1.DialogResponses.yes, DialogResponses_1.DialogResponses.no);
        if (result === DialogResponses_1.DialogResponses.yes) {
            telemetryContext.properties.errorMessage =
                'Operation failed and user create new project';
            yield vscode.commands.executeCommand('iotworkbench.initializeProject');
        }
        else {
            telemetryContext.properties.errorMessage = 'Operation failed.';
        }
    });
}
exports.askAndNewProject = askAndNewProject;
function askAndOpenProject(rootPath, workspaceFile, telemetryContext) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = `Operation failed because the IoT project is not opened. Current folder contains an IoT project '${workspaceFile}', do you want to open it?`;
        const result = yield vscode.window.showInformationMessage(message, DialogResponses_1.DialogResponses.yes, DialogResponses_1.DialogResponses.no);
        if (result === DialogResponses_1.DialogResponses.yes) {
            telemetryContext.properties.errorMessage =
                'Operation failed and user open project from folder.';
            const workspaceFilePath = path.join(rootPath, workspaceFile);
            yield vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(workspaceFilePath), false);
        }
        else {
            telemetryContext.properties.errorMessage = 'Operation failed.';
        }
    });
}
exports.askAndOpenProject = askAndOpenProject;
const noDeviceSurveyUrl = 'https://www.surveymonkey.com/r/C7NY7KJ';
function TakeNoDeviceSurvey(telemetryContext) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = 'Could you help to take a quick survey about what IoT development kit(s) you want Azure IoT Device Workbench to support?';
        const result = yield vscode.window.showWarningMessage(message, DialogResponses_1.DialogResponses.yes, DialogResponses_1.DialogResponses.cancel);
        if (result === DialogResponses_1.DialogResponses.yes) {
            // Open the survey page
            telemetryContext.properties.message = 'User takes no-device survey.';
            telemetryContext.properties.result = 'Succeeded';
            const extension = vscode.extensions.getExtension(constants_1.GlobalConstants.extensionId);
            if (!extension) {
                return;
            }
            const extensionVersion = extension.packageJSON.version || 'unknown';
            yield vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${noDeviceSurveyUrl}?o=${encodeURIComponent(process.platform)}&v=${encodeURIComponent(extensionVersion)}`));
        }
        return;
    });
}
exports.TakeNoDeviceSurvey = TakeNoDeviceSurvey;
//# sourceMappingURL=utils.js.map