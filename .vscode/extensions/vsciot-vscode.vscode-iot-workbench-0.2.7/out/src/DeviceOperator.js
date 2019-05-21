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
const ArduinoPackageManager_1 = require("./ArduinoPackageManager");
const boardProvider_1 = require("./boardProvider");
const impor = require('impor')(__dirname);
const ioTProjectModule = impor('./Models/IoTProject');
class DeviceOperator {
    compile(context, channel, telemetryContext) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = new ioTProjectModule.IoTProject(context, channel, telemetryContext);
            const result = yield project.load();
            if (!result) {
                yield project.handleLoadFailure();
                return;
            }
            yield project.compile();
        });
    }
    upload(context, channel, telemetryContext) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = new ioTProjectModule.IoTProject(context, channel, telemetryContext);
            const result = yield project.load();
            if (!result) {
                yield project.handleLoadFailure();
                return;
            }
            yield project.upload();
        });
    }
    configDeviceSettings(context, channel, telemetryContext) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = new ioTProjectModule.IoTProject(context, channel, telemetryContext);
            const result = yield project.load();
            if (!result) {
                yield project.handleLoadFailure();
                return;
            }
            yield project.configDeviceSettings();
        });
    }
    downloadPackage(context, channel, telemetryContext) {
        return __awaiter(this, void 0, void 0, function* () {
            const boardProvider = new boardProvider_1.BoardProvider(context);
            const boardItemList = [];
            const boards = boardProvider.list.filter(board => board.installation);
            boards.forEach((board) => {
                boardItemList.push({
                    name: board.name,
                    id: board.id,
                    detailInfo: board.detailInfo,
                    label: board.name,
                    description: board.detailInfo,
                });
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
            else {
                telemetryContext.properties.board = boardSelection.label;
                try {
                    const board = boardProvider.find({ id: boardSelection.id });
                    if (board) {
                        yield ArduinoPackageManager_1.ArduinoPackageManager.installBoard(board);
                    }
                }
                catch (error) {
                    throw new Error(`Device package for ${boardSelection.label} installation failed: ${error.message}`);
                }
            }
            vscode.window.showInformationMessage(`Device package for ${boardSelection.label} has been installed.`);
            return true;
        });
    }
}
exports.DeviceOperator = DeviceOperator;
//# sourceMappingURL=DeviceOperator.js.map