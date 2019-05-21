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
class ConfigHandler {
    static update(key, value, target = vscode.ConfigurationTarget.Workspace) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!key) {
                throw new Error('Key is empty.');
            }
            return yield vscode.workspace.getConfiguration('IoTWorkbench')
                .update(key, value, target);
        });
    }
    static get(key) {
        if (!key) {
            throw new Error('Key is empty.');
        }
        return vscode.workspace.getConfiguration('IoTWorkbench').get(key);
    }
}
exports.ConfigHandler = ConfigHandler;
//# sourceMappingURL=configHandler.js.map