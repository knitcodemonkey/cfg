// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const path = require("path");
const utils = require("./utils");
const ArduinoPackageManager_1 = require("./ArduinoPackageManager");
const constants_1 = require("./constants");
const boardProvider_1 = require("./boardProvider");
const impor = require('impor')(__dirname);
const azureFunctionsModule = impor('./Models/AzureFunctions');
const ioTProjectModule = impor('./Models/IoTProject');
const constants = {
    defaultProjectName: 'IoTproject'
};
class ProjectInitializer {
    InitializeProject(context, channel, telemetryContext) {
        return __awaiter(this, void 0, void 0, function* () {
            let rootPath;
            let openInNewWindow = false;
            // If current window contains other project, open the created project in new
            // window.
            if (vscode.workspace.workspaceFolders &&
                vscode.workspace.workspaceFolders.length > 0) {
                openInNewWindow = true;
            }
            // Initial project
            yield vscode.window.withProgress({
                title: 'Project initialization',
                location: vscode.ProgressLocation.Window,
            }, (progress) => __awaiter(this, void 0, void 0, function* () {
                progress.report({
                    message: 'Updating a list of available template',
                });
                try {
                    // Select board
                    const boardProvider = new boardProvider_1.BoardProvider(context);
                    const boardItemList = [];
                    const boards = boardProvider.list;
                    boards.forEach((board) => {
                        boardItemList.push({
                            name: board.name,
                            id: board.id,
                            detailInfo: board.detailInfo,
                            label: board.name,
                            description: board.detailInfo,
                        });
                    });
                    // add the selection of 'device not in the list'
                    boardItemList.push({
                        name: '',
                        id: 'no_device',
                        detailInfo: '',
                        label: '$(issue-opened) My device is not in the list...',
                        description: '',
                    });
                    const boardSelection = yield vscode.window.showQuickPick(boardItemList, {
                        ignoreFocusOut: true,
                        matchOnDescription: true,
                        matchOnDetail: true,
                        placeHolder: 'Select a board',
                    });
                    if (!boardSelection) {
                        telemetryContext.properties.errorMessage =
                            'Board selection canceled.';
                        telemetryContext.properties.result = 'Canceled';
                        return;
                    }
                    else if (boardSelection.id === 'no_device') {
                        yield utils.TakeNoDeviceSurvey(telemetryContext);
                        return;
                    }
                    else {
                        telemetryContext.properties.board = boardSelection.label;
                        const board = boardProvider.find({ id: boardSelection.id });
                        if (board) {
                            yield ArduinoPackageManager_1.ArduinoPackageManager.installBoard(board);
                        }
                    }
                    // Template select
                    const template = context.asAbsolutePath(path.join(constants_1.FileNames.resourcesFolderName, boardSelection.id, constants_1.FileNames.templateFileName));
                    const templateJson = require(template);
                    const projectTemplateList = [];
                    templateJson.templates.forEach((element) => {
                        projectTemplateList.push({
                            label: element.label,
                            description: element.description,
                            detail: element.detail
                        });
                    });
                    const selection = yield vscode.window.showQuickPick(projectTemplateList, {
                        ignoreFocusOut: true,
                        matchOnDescription: true,
                        matchOnDetail: true,
                        placeHolder: 'Select a project template',
                    });
                    if (!selection) {
                        telemetryContext.properties.errorMessage =
                            'Project template selection canceled.';
                        telemetryContext.properties.result = 'Canceled';
                        return;
                    }
                    else {
                        telemetryContext.properties.template = selection.label;
                    }
                    const result = templateJson.templates.find((template) => {
                        return template.label === selection.label;
                    });
                    if (!result) {
                        throw new Error('Unable to load project template.');
                    }
                    if (result.type === 'AzureFunctions') {
                        const isFunctionsExtensionAvailable = yield azureFunctionsModule.AzureFunctions.isAvailable();
                        if (!isFunctionsExtensionAvailable) {
                            return false;
                        }
                    }
                    try {
                        rootPath = yield utils.selectWorkspaceItem('Please select a folder to contain your IoT Project:', {
                            canSelectFiles: false,
                            canSelectFolders: true,
                            canSelectMany: false,
                            defaultUri: vscode.workspace.workspaceFolders &&
                                vscode.workspace.workspaceFolders.length > 0 ?
                                vscode.workspace.workspaceFolders[0].uri :
                                undefined,
                            openLabel: 'Select'
                        });
                        if (!rootPath) {
                            throw new Error('User cancelled folder selection.');
                        }
                        const projectFolder = yield this.GenerateProjectFolder(rootPath);
                        if (!projectFolder) {
                            throw new Error('Generate Project Folder canceled');
                        }
                        rootPath = projectFolder;
                    }
                    catch (error) {
                        telemetryContext.properties.errorMessage =
                            `Folder selection canceled. ${error}`;
                        telemetryContext.properties.result = 'Canceled';
                        return;
                    }
                    const project = new ioTProjectModule.IoTProject(context, channel, telemetryContext);
                    return yield project.create(rootPath, result, boardSelection.id, openInNewWindow);
                }
                catch (error) {
                    throw error;
                }
            }));
        });
    }
    GenerateProjectFolder(rootPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let counter = 0;
            const name = constants.defaultProjectName;
            let candidateName = name;
            while (true) {
                const projectPath = path.join(rootPath, candidateName);
                if (!utils.fileExistsSync(projectPath) &&
                    !utils.directoryExistsSync(projectPath)) {
                    break;
                }
                counter++;
                candidateName = `${name}_${counter}`;
            }
            const projectName = yield vscode.window.showInputBox({
                value: candidateName,
                prompt: 'Input project name.',
                ignoreFocusOut: true,
                validateInput: (projectName) => {
                    if (!/^([a-z0-9_]|[a-z0-9_][-a-z0-9_.]*[a-z0-9_])(\.ino)?$/i.test(projectName)) {
                        return 'Project name can only contain letters, numbers, "-" and ".", and cannot start or end with "-" or ".".';
                    }
                    const projectPath = path.join(rootPath, projectName);
                    if (!utils.fileExistsSync(projectPath) &&
                        !utils.directoryExistsSync(projectPath)) {
                        return;
                    }
                    else {
                        return `${projectPath} exists, please choose another name.`;
                    }
                }
            });
            const projectPath = projectName ? path.join(rootPath, projectName) : undefined;
            if (projectPath) {
                utils.mkdirRecursivelySync(projectPath);
            }
            return projectPath;
        });
    }
}
exports.ProjectInitializer = ProjectInitializer;
//# sourceMappingURL=projectInitializer.js.map