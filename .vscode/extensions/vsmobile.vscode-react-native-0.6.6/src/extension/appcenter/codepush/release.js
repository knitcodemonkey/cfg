"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const LogHelper_1 = require("../../log/LogHelper");
const commandResult_1 = require("../command/commandResult");
const appcenterCodePushRelease_1 = require("./release-strategy/appcenterCodePushRelease");
const legacyCodePushRelease_1 = require("./release-strategy/legacyCodePushRelease");
const settingsHelper_1 = require("../../settingsHelper");
// Use old service endpoint unless we will fix issue with 1MB payload limitation for new one
const useLegacyCodePushServer = settingsHelper_1.SettingsHelper.getLegacyCodePushServiceEnabled();
class CodePushRelease {
    static exec(client, params, logger) {
        return (() => {
            if (useLegacyCodePushServer) {
                return legacyCodePushRelease_1.legacyCodePushRelease(params, params.token, settingsHelper_1.SettingsHelper.getLegacyCodePushEndpoint());
            }
            else {
                return appcenterCodePushRelease_1.appcenterCodePushRelease(client, params);
            }
        })().then((result) => {
            return commandResult_1.success(result);
        }).catch((error) => {
            if (error && error.reposnse && error.response.statusCode === 409) {
                logger.log(error.response.body, LogHelper_1.LogLevel.Error);
                return commandResult_1.failure(commandResult_1.ErrorCodes.Exception, error.response.body);
            }
            logger.log("An error occured on doing Code Push release", LogHelper_1.LogLevel.Error);
            if (typeof error === "string") {
                return commandResult_1.failure(commandResult_1.ErrorCodes.Exception, error);
            }
            else {
                return commandResult_1.failure(commandResult_1.ErrorCodes.Exception, "An error occured on doing Code Push release");
            }
        });
    }
}
exports.default = CodePushRelease;

//# sourceMappingURL=release.js.map
