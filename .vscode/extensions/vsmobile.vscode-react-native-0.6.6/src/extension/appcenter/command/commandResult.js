"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
function success(res) {
    return {
        succeeded: true,
        result: res,
    };
}
exports.success = success;
// Used when there's a failure otherwise
function failure(errorCode, errorMessage) {
    return {
        succeeded: false,
        errorCode,
        errorMessage,
    };
}
exports.failure = failure;
var ErrorCodes;
(function (ErrorCodes) {
    ErrorCodes[ErrorCodes["Succeeded"] = 0] = "Succeeded";
    // Command given contained illegal characters/names
    ErrorCodes[ErrorCodes["IllegalCommand"] = 1] = "IllegalCommand";
    // Command was legal, but not found
    ErrorCodes[ErrorCodes["NoSuchCommand"] = 2] = "NoSuchCommand";
    // Unhandled exception occurred
    ErrorCodes[ErrorCodes["Exception"] = 3] = "Exception";
    // A parameter is invalid
    ErrorCodes[ErrorCodes["InvalidParameter"] = 4] = "InvalidParameter";
    // Command requires logged in user
    ErrorCodes[ErrorCodes["NotLoggedIn"] = 5] = "NotLoggedIn";
    // The requested resource was not found
    ErrorCodes[ErrorCodes["NotFound"] = 6] = "NotFound";
})(ErrorCodes = exports.ErrorCodes || (exports.ErrorCodes = {}));

//# sourceMappingURL=commandResult.js.map
