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
const vscode = require("vscode");
class ArduinoPackageManager {
    static setAdditionalUrl(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const existedUrls = vscode.workspace.getConfiguration().get('arduino.additionalUrls');
            if (!existedUrls || existedUrls.length === 0) {
                yield vscode.workspace.getConfiguration().update('arduino.additionalUrls', url, vscode.ConfigurationTarget.Global);
            }
            else {
                let _existedUrls;
                if (typeof existedUrls === 'string') {
                    _existedUrls = existedUrls.split(',').map((url) => url.trim());
                }
                else {
                    _existedUrls = existedUrls;
                }
                for (const additionalUrl of _existedUrls) {
                    if (additionalUrl === url) {
                        return;
                    }
                }
                _existedUrls.push(url);
                if (typeof existedUrls === 'string') {
                    yield vscode.workspace.getConfiguration().update('arduino.additionalUrls', _existedUrls.join(','), vscode.ConfigurationTarget.Global);
                }
                else {
                    yield vscode.workspace.getConfiguration().update('arduino.additionalUrls', _existedUrls, vscode.ConfigurationTarget.Global);
                }
            }
        });
    }
    static installBoard(board) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!board || !board.installation) {
                return;
            }
            const cachedBoard = ArduinoPackageManager.INSTALLED_BOARDS.find(_board => {
                const _installation = _board.installation;
                const installation = board.installation;
                return _installation.packageName === installation.packageName &&
                    _installation.architecture === installation.architecture;
            });
            if (cachedBoard) {
                return;
            }
            try {
                yield ArduinoPackageManager.setAdditionalUrl(board.installation.additionalUrl);
                yield vscode.commands.executeCommand('arduino.installBoard', board.installation.packageName, board.installation.architecture);
                ArduinoPackageManager.INSTALLED_BOARDS.push(board);
            }
            catch (ignore) {
                // If we fail to install board package,
                // it may because the user hasn't installed
                // Arduino extension. Let's just ignore
                // that. We should have asked the the user
                // to install Arduino extension somewhere
                // else already
            }
            return;
        });
    }
}
ArduinoPackageManager.INSTALLED_BOARDS = [];
exports.ArduinoPackageManager = ArduinoPackageManager;
//# sourceMappingURL=ArduinoPackageManager.js.map