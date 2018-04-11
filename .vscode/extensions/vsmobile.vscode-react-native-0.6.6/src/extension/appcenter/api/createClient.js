"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../lib/app-center-node-client/index");
const appCenterClientCredentials_1 = require("./appCenterClientCredentials");
const Q = require("q");
function createAppCenterClient() {
    return {
        fromToken(token, endpoint) {
            let tokenFunc;
            if (typeof token === "string") {
                tokenFunc = () => Q.resolve(token);
            }
            else if (typeof token === "object") {
                tokenFunc = () => token;
            }
            else {
                tokenFunc = token;
            }
            return new index_1.default(new appCenterClientCredentials_1.AppCenterClientCredentials(tokenFunc), endpoint);
        },
        fromProfile(user, endpoint) {
            if (!user) {
                return null;
            }
            return new index_1.default(new appCenterClientCredentials_1.AppCenterClientCredentials(() => user.accessToken), endpoint);
        },
    };
}
exports.createAppCenterClient = createAppCenterClient;
function getQPromisifiedClientResult(action) {
    return Q.Promise((resolve, reject) => {
        action.then((result) => {
            resolve(result);
        }).catch((e) => {
            reject(e);
        });
    });
}
exports.getQPromisifiedClientResult = getQPromisifiedClientResult;

//# sourceMappingURL=createClient.js.map
