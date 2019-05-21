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
const fs = require("fs-plus");
const path = require("path");
const vscode = require("vscode");
const AdmZip = require("adm-zip");
const IoTSettings_1 = require("./IoTSettings");
const utils = require("./utils");
const constants_1 = require("./constants");
const ArduinoPackageManager_1 = require("./ArduinoPackageManager");
const boardProvider_1 = require("./boardProvider");
const vscode_express_1 = require("vscode-express");
const impor = require('impor')(__dirname);
const request = impor('request-promise');
class ExampleExplorer {
    constructor() {
        this._exampleName = '';
        this._exampleUrl = '';
        this._boardId = '';
    }
    moveTempFiles(fsPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const tempPath = path.join(fsPath, '.temp');
            const tempPathList = fs.listSync(tempPath);
            let examplePath = undefined;
            for (let i = 0; i < tempPathList.length; i++) {
                if (!/\.zip$/.test(tempPathList[i])) {
                    examplePath = tempPathList[i];
                    break;
                }
            }
            if (!examplePath) {
                return false;
            }
            const examplePathList = fs.readdirSync(examplePath);
            examplePathList.forEach(item => {
                if (item !== '.' && item !== '..') {
                    try {
                        fs.moveSync(path.join(examplePath, item), path.join(fsPath, item));
                    }
                    catch (error) {
                        throw error;
                    }
                }
            });
            try {
                fs.removeSync(tempPath);
            }
            catch (error) {
                throw error;
            }
            return true;
        });
    }
    downloadExamplePackage(context, channel, url, fsPath) {
        return __awaiter(this, void 0, void 0, function* () {
            channel.show();
            const loading = setInterval(() => {
                channel.append('.');
            }, 1000);
            const options = {
                method: 'GET',
                uri: url,
                encoding: null // Binary data
            };
            const zipData = yield request(options).promise();
            const tempPath = path.join(fsPath, '.temp');
            fs.writeFileSync(path.join(tempPath, 'example.zip'), zipData);
            const zip = new AdmZip(path.join(tempPath, 'example.zip'));
            try {
                zip.extractAllTo(tempPath, true);
                clearInterval(loading);
                channel.appendLine('');
                channel.appendLine('Example loaded.');
                yield this.moveTempFiles(fsPath);
                return true;
            }
            catch (error) {
                clearInterval(loading);
                channel.appendLine('');
                throw error;
            }
        });
    }
    GenerateExampleFolder(exampleName) {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = new IoTSettings_1.IoTWorkbenchSettings();
            const workbench = yield settings.workbenchPath();
            if (!utils.directoryExistsSync(workbench)) {
                utils.mkdirRecursivelySync(workbench);
            }
            const name = path.join(workbench, 'examples', exampleName);
            if (!utils.fileExistsSync(name) && !utils.directoryExistsSync(name)) {
                utils.mkdirRecursivelySync(name);
                return name;
            }
            const workspaceFiles = fs.listSync(name, [constants_1.FileNames.workspaceExtensionName]);
            if (workspaceFiles && workspaceFiles.length > 0) {
                const workspaceFile = workspaceFiles[0]; // just pick the first one
                if (fs.existsSync(workspaceFile)) {
                    const selection = yield vscode.window.showQuickPick([
                        {
                            label: `Open an existing example`,
                            description: '',
                            detail: `Example exists: ${name}`
                        },
                        {
                            label: 'Generate a new example',
                            description: '',
                            detail: 'Create a new folder to generate the example'
                        }
                    ], {
                        ignoreFocusOut: true,
                        matchOnDescription: true,
                        matchOnDetail: true,
                        placeHolder: 'Select an option',
                    });
                    if (!selection) {
                        return '';
                    }
                    if (selection.label === 'Open an existing example') {
                        return name;
                    }
                }
            }
            const customizedName = yield vscode.window.showInputBox({
                prompt: 'Input example folder name',
                ignoreFocusOut: true,
                validateInput: (exampleName) => {
                    if (exampleName === null) {
                        return;
                    }
                    const name = path.join(workbench, 'examples', exampleName);
                    if (!utils.fileExistsSync(name) && !utils.directoryExistsSync(name)) {
                        if (!/^([a-z0-9_]|[a-z0-9_][-a-z0-9_.]*[a-z0-9_])$/i.test(exampleName)) {
                            return 'Folder name can only contain letters, numbers, "-" and ".", and cannot start or end with "-" or ".".';
                        }
                        return;
                    }
                    else {
                        const items = fs.listSync(name);
                        if (items.length === 0) {
                            return;
                        }
                        return `${exampleName} exists, please use other folder name.`;
                    }
                }
            });
            if (!customizedName) {
                return '';
            }
            const customizedPath = path.join(workbench, 'examples', customizedName);
            if (!utils.fileExistsSync(customizedPath) &&
                !utils.directoryExistsSync(customizedPath)) {
                utils.mkdirRecursivelySync(customizedPath);
            }
            return customizedPath;
        });
    }
    selectBoard(context, channel, telemetryContext) {
        return __awaiter(this, void 0, void 0, function* () {
            const boardProvider = new boardProvider_1.BoardProvider(context);
            const boardItemList = [];
            const boards = boardProvider.list.filter(board => board.exampleUrl);
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
                telemetryContext.properties.errorMessage = 'Board selection canceled.';
                telemetryContext.properties.result = 'Canceled';
                return false;
            }
            else if (boardSelection.id === 'no_device') {
                yield utils.TakeNoDeviceSurvey(telemetryContext);
                return;
            }
            else {
                telemetryContext.properties.board = boardSelection.label;
                const board = boardProvider.find({ id: boardSelection.id });
                if (board) {
                    // To avoid block example gallery, use async to install board here
                    // await ArduinoPackageManager.installBoard(board);
                    ArduinoPackageManager_1.ArduinoPackageManager.installBoard(board);
                    const exampleUrl = 'example.html?board=' + board.id +
                        '&url=' + encodeURIComponent(board.exampleUrl || '');
                    ExampleExplorer._vscexpress =
                        ExampleExplorer._vscexpress || new vscode_express_1.VSCExpress(context, 'views');
                    ExampleExplorer._vscexpress.open(exampleUrl, 'Examples - Azure IoT Device Workbench', vscode.ViewColumn.One, {
                        enableScripts: true,
                        enableCommandUris: true,
                        retainContextWhenHidden: true
                    });
                    return true;
                }
            }
            return false;
        });
    }
    initializeExample(context, channel, telemetryContext, name, url, boardId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (name && url && boardId) {
                    this._exampleName = name;
                    this._exampleUrl = url;
                    this._boardId = boardId;
                }
                const res = yield this.initializeExampleInternal(context, channel, telemetryContext);
                if (res) {
                    vscode.window.showInformationMessage('Example load successfully.');
                }
                else {
                    vscode.window.showWarningMessage('Example load canceled.');
                }
            }
            catch (error) {
                vscode.window.showErrorMessage('Unable to load example. Please check output window for detailed information.');
                throw error;
            }
        });
    }
    setSelectedExample(name, url, boardId) {
        this._exampleName = name;
        this._exampleUrl = url;
        this._boardId = boardId;
    }
    initializeExampleInternal(context, channel, telemetryContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._exampleName || !this._exampleUrl) {
                return false;
            }
            const boardList = context.asAbsolutePath(path.join(constants_1.FileNames.resourcesFolderName, constants_1.FileNames.boardListFileName));
            const boardsJson = require(boardList);
            telemetryContext.properties.Example = this._exampleName;
            const board = boardsJson.boards.find(board => board.id === this._boardId);
            telemetryContext.properties.board = board ? board.name : '';
            const url = this._exampleUrl;
            const fsPath = yield this.GenerateExampleFolder(this._exampleName);
            if (!fsPath) {
                return false;
            }
            const items = fs.listSync(fsPath, [constants_1.FileNames.workspaceExtensionName]);
            if (items.length !== 0) {
                yield vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(items[0]), true);
                return true;
            }
            channel.appendLine('Downloading example package...');
            const res = yield this.downloadExamplePackage(context, channel, url, fsPath);
            if (res) {
                // Follow the same pattern in Arduino extension to open examples in new
                // VSCode instance
                const workspaceFiles = fs.listSync(fsPath, [constants_1.FileNames.workspaceExtensionName]);
                if (workspaceFiles && workspaceFiles.length > 0) {
                    yield vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(workspaceFiles[0]), true);
                    return true;
                }
                else {
                    // TODO: Add buttom to submit issue to iot-workbench repo.
                    throw new Error('The example does not contain a project for Azure IoT Device Workbench.');
                }
            }
            else {
                throw new Error('Downloading example package failed. Please check your network settings.');
            }
        });
    }
}
exports.ExampleExplorer = ExampleExplorer;
//# sourceMappingURL=exampleExplorer.js.map