"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const settingsHelper_1 = require("../../../extension/settingsHelper");
const index_1 = require("../api/index");
const profile_1 = require("../auth/profile/profile");
class Auth {
    static getProfile(projectRootPath) {
        const profile = profile_1.getUser(projectRootPath);
        if (profile) {
            return Q.resolve(profile);
        }
        else {
            return Q.resolve(null);
        }
    }
    static doTokenLogin(token, projectRootPath) {
        if (!token) {
            return Q.resolve(null);
        }
        return this.removeLoggedInUser(projectRootPath).then(() => {
            return Auth.fetchUserInfoByTokenAndSave(token, projectRootPath).then((profile) => {
                return Q.resolve(profile);
            }).catch((e) => {
                return Q.resolve(null);
            });
        });
    }
    static doLogout(projectRootPath) {
        // TODO: Probably we need to delete token from server also?
        return this.removeLoggedInUser(projectRootPath);
    }
    static fetchUserInfoByTokenAndSave(token, projectRootPath) {
        return Auth.getUserInfo(token).then(userResponse => {
            return profile_1.saveUser(userResponse, { token: token }, projectRootPath).then((profile) => {
                return Q.resolve(profile);
            });
        }).catch((e) => {
            throw e;
        });
    }
    static getUserInfo(token) {
        const client = index_1.createAppCenterClient().fromToken(token, settingsHelper_1.SettingsHelper.getAppCenterAPIEndpoint());
        return index_1.getQPromisifiedClientResult(client.account.users.get());
    }
    static removeLoggedInUser(projectRootPath) {
        return profile_1.deleteUser(projectRootPath).then(() => {
            return Q.resolve(void 0);
        }).catch(() => { }); // Noop, it's ok if deletion fails
    }
}
exports.default = Auth;

//# sourceMappingURL=auth.js.map
