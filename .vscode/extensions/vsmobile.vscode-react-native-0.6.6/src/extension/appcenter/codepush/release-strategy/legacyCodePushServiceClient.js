"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const fs = require("fs");
const Q = require("q");
class LegacyCodePushServiceClient {
    constructor(accessKey, app, serverUrl) {
        this.accessKey = accessKey;
        this.app = app;
        this.serverUrl = serverUrl;
        if (!accessKey)
            throw new Error("A token must be specified to execute server calls.");
        if (!serverUrl)
            throw new Error("A server url must be specified to execute server calls.");
    }
    release(deploymentName, filePath, updateMetadata) {
        const appName = this.app.identifier;
        return Q.Promise((resolve, reject) => {
            const options = {
                url: this.serverUrl + this.urlEncode(`/apps/${this.appNameParam(appName)}/deployments/${deploymentName}/release`),
                headers: {
                    "Accept": `application/vnd.code-push.v${LegacyCodePushServiceClient.API_VERSION}+json`,
                    "Authorization": `Bearer ${this.accessKey}`,
                },
                formData: {
                    "packageInfo": JSON.stringify(updateMetadata),
                    "package": fs.createReadStream(filePath),
                },
            };
            request.post(options, (err, httpResponse) => {
                if (err) {
                    reject(this.getErrorMessage(err, httpResponse));
                    return;
                }
                if (httpResponse.statusCode === 201) {
                    resolve(JSON.parse(httpResponse.body).package);
                }
                else {
                    reject(this.getErrorMessage(null, httpResponse));
                    return;
                }
            });
        });
    }
    // A template string tag function that URL encodes the substituted values
    urlEncode(strings, ...values) {
        let result = "";
        for (let i = 0; i < strings.length; i++) {
            result += strings[i];
            if (i < values.length) {
                result += encodeURIComponent(values[i]);
            }
        }
        return result;
    }
    // IIS and Azure web apps have this annoying behavior where %2F (URL encoded slashes) in the URL are URL decoded
    // BEFORE the requests reach node. That essentially means there's no good way to encode a "/" in the app name--
    // URL encodeing will work when running locally but when running on Azure it gets decoded before express sees it,
    // so app names with slashes don't get routed properly. See https://github.com/tjanczuk/iisnode/issues/343 (or other sites
    // that complain about the same) for some more info. I explored some IIS config based workarounds, but the previous
    // link seems to say they won't work, so I eventually gave up on that.
    // Anyway, to workaround this issue, we now allow the client to encode / characters as ~~ (two tildes, URL encoded).
    // The CLI now converts / to ~~ if / appears in an app name, before passing that as part of the URL. This code below
    // does the encoding. It's hack, but seems like the least bad option here.
    // Eventually, this service will go away & we'll all be on Max's new service. That's hosted in docker, no more IIS,
    // so this issue should go away then.
    appNameParam(appName) {
        return appName.replace("/", "~~");
    }
    getErrorMessage(error, response) {
        return response && response.body ? response.body : (error ? error.message : "");
    }
}
LegacyCodePushServiceClient.API_VERSION = 2;
exports.default = LegacyCodePushServiceClient;

//# sourceMappingURL=legacyCodePushServiceClient.js.map
