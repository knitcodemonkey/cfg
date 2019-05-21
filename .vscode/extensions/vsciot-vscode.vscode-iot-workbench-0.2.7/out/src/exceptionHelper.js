// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class ExceptionHelper {
    static logError(channel, errorValue, popupValue) {
        let _error;
        let _message;
        if (typeof errorValue === 'string') {
            _error = new Error(errorValue);
            _message = errorValue;
        }
        else {
            _error = errorValue;
            _message = errorValue.message;
        }
        if (popupValue === true) {
            vscode.window.showErrorMessage(_message);
        }
        else if (typeof popupValue === 'string') {
            vscode.window.showErrorMessage(popupValue);
        }
        if (channel) {
            let errorMessage;
            if (_error.message) {
                errorMessage = _error.message;
                // tslint:disable-next-line: no-any
            }
            else if (_error.body && _error.body.message) {
                // tslint:disable-next-line: no-any
                errorMessage = _error.body.message;
            }
            else {
                errorMessage = _error.toString();
            }
            channel.append(errorMessage);
        }
        throw _error;
    }
}
exports.ExceptionHelper = ExceptionHelper;
//# sourceMappingURL=exceptionHelper.js.map