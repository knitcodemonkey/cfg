"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const createClient_1 = require("../../api/createClient");
const fs = require("fs");
function appcenterCodePushRelease(client, params) {
    const app = params.app;
    return createClient_1.getQPromisifiedClientResult(client.codepush.codePushDeploymentReleases.create(app.appName, params.deploymentName, app.ownerName, params.appVersion, {
        packageProperty: fs.createReadStream(params.updatedContentZipPath),
        deploymentName: params.deploymentName,
        description: params.description,
        disabled: params.isDisabled,
        mandatory: params.isMandatory,
        noDuplicateReleaseError: false,
        rollout: params.rollout,
    }));
}
exports.appcenterCodePushRelease = appcenterCodePushRelease;

//# sourceMappingURL=appcenterCodePushRelease.js.map
