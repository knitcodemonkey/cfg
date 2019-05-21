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
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const configHandler_1 = require("./configHandler");
class IoTWorkbenchSettings {
    constructor() {
        const homeDir = os.homedir();
        const platform = os.platform();
        if (platform === 'win32') {
            this._workbenchPath =
                path.join(homeDir, 'Documents', 'IoTWorkbenchProjects');
        }
        else if (platform === 'linux') {
            this._workbenchPath = path.join(homeDir, 'IoTWorkbenchProjects');
        }
        else if (platform === 'darwin') {
            this._workbenchPath =
                path.join(homeDir, 'Documents', 'IoTWorkbenchProjects');
        }
        else {
            this._workbenchPath = '/IoTWorkbenchProjects';
        }
    }
    workbenchPath() {
        return __awaiter(this, void 0, void 0, function* () {
            const userWorkbenchPath = configHandler_1.ConfigHandler.get('workbench');
            if (userWorkbenchPath) {
                return userWorkbenchPath;
            }
            else {
                // Use the default value for workbenchPath.
                yield configHandler_1.ConfigHandler.update('workbench', this._workbenchPath, vscode.ConfigurationTarget.Global);
                return this._workbenchPath;
            }
        });
    }
    setWorkbenchPath(showMessage = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let userWorkbenchPath = configHandler_1.ConfigHandler.get('workbench') || this._workbenchPath;
            const workbenchPicks = [
                { label: userWorkbenchPath, description: '', data: userWorkbenchPath },
                { label: '$(file-directory) Browse...', description: '', data: '$' }
            ];
            const selection = yield vscode.window.showQuickPick(workbenchPicks, {
                ignoreFocusOut: true,
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: 'Select workbench folder'
            });
            if (selection && selection.data === '$') {
                const options = {
                    canSelectMany: false,
                    openLabel: 'Select',
                    canSelectFolders: true,
                    canSelectFiles: false
                };
                const folderUri = yield vscode.window.showOpenDialog(options);
                if (folderUri && folderUri[0]) {
                    userWorkbenchPath = folderUri[0].fsPath;
                }
                else {
                    if (showMessage) {
                        yield vscode.window.showWarningMessage('Change workbench canceled.');
                    }
                    return userWorkbenchPath;
                }
            }
            else if (selection !== undefined) {
                userWorkbenchPath = selection.data;
            }
            else {
                userWorkbenchPath = undefined;
            }
            if (userWorkbenchPath) {
                yield configHandler_1.ConfigHandler.update('workbench', userWorkbenchPath, vscode.ConfigurationTarget.Global);
                if (showMessage) {
                    yield vscode.window.showInformationMessage('Change workbench successfully.');
                }
            }
            return userWorkbenchPath;
        });
    }
}
exports.IoTWorkbenchSettings = IoTWorkbenchSettings;
//# sourceMappingURL=IoTSettings.js.map