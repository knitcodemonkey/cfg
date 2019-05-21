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
const impor = require('impor')(__dirname);
const ioTProjectModule = impor('./Models/IoTProject');
class AzureOperator {
    Provision(context, channel, telemetryContext) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = new ioTProjectModule.IoTProject(context, channel, telemetryContext);
            const result = yield project.load();
            if (!result) {
                yield project.handleLoadFailure();
                return;
            }
            const status = yield project.provision();
            if (status) {
                vscode.window.showInformationMessage('Azure provision succeeded.');
            }
            return status;
        });
    }
    Deploy(context, channel, telemetryContext) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = new ioTProjectModule.IoTProject(context, channel, telemetryContext);
            const result = yield project.load();
            if (!result) {
                yield project.handleLoadFailure();
                return;
            }
            yield project.deploy();
        });
    }
}
exports.AzureOperator = AzureOperator;
//# sourceMappingURL=AzureOperator.js.map