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
const Api_1 = require("./Interfaces/Api");
function getExtension(name) {
    switch (name) {
        case Api_1.extensionName.Toolkit:
            const toolkit = vscode.extensions.getExtension('vsciot-vscode.azure-iot-toolkit');
            return toolkit ? toolkit.exports : undefined;
        case Api_1.extensionName.AzureAccount:
            const azureAccount = vscode.extensions.getExtension('ms-vscode.azure-account');
            return azureAccount ? azureAccount.exports : undefined;
        default:
            return undefined;
    }
}
exports.getExtension = getExtension;
function checkAzureLogin() {
    return __awaiter(this, void 0, void 0, function* () {
        const azureAccount = getExtension(Api_1.extensionName.AzureAccount);
        if (azureAccount === undefined) {
            throw new Error('Azure account extension is not found. Please install it from Marketplace.');
        }
        // Sign in Azure
        if (azureAccount.status !== 'LoggedIn') {
            try {
                yield vscode.commands.executeCommand('azure-account.login');
            }
            catch (error) {
                throw error;
            }
        }
        return true;
    });
}
exports.checkAzureLogin = checkAzureLogin;
//# sourceMappingURL=Apis.js.map