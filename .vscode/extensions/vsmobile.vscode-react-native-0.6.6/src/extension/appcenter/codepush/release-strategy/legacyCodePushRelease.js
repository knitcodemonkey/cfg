"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const legacyCodePushServiceClient_1 = require("./legacyCodePushServiceClient");
function legacyCodePushRelease(params, token, serverUrl) {
    const releaseData = {
        description: params.description,
        isDisabled: params.isDisabled,
        isMandatory: params.isMandatory,
        rollout: params.rollout,
        appVersion: params.appVersion,
    };
    return new legacyCodePushServiceClient_1.default(token, params.app, serverUrl)
        .release(params.deploymentName, params.updatedContentZipPath, releaseData);
}
exports.legacyCodePushRelease = legacyCodePushRelease;

//# sourceMappingURL=legacyCodePushRelease.js.map
