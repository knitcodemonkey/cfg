"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const Q = require("q");
const index_1 = require("../tokenStore/index");
const getProfileDir_1 = require("./getProfileDir");
class ProfileImpl {
    constructor(fileContents) {
        this.userId = fileContents.userId || fileContents.id;
        this.userName = fileContents.userName || fileContents.name;
        this.displayName = fileContents.displayName;
        this.email = fileContents.email;
        this.defaultApp = fileContents.defaultApp;
    }
    get accessToken() {
        const getter = index_1.tokenStore.get(this.userName)
            .catch((err) => {
            // log error?
        });
        const emptyToken = "";
        return getter.then((entry) => {
            if (entry) {
                return entry.accessToken.token;
            }
            return emptyToken;
        }).catch((err) => {
            // Failed to get token from porfile, return no result
            return emptyToken;
        });
    }
    save(projectRootPath) {
        let profile = {
            userId: this.userId,
            userName: this.userName,
            displayName: this.displayName,
            email: this.email,
            defaultApp: this.defaultApp,
        };
        mkdirp.sync(getProfileDir_1.getProfileDir(projectRootPath));
        fs.writeFileSync(getProfileFilename(projectRootPath), JSON.stringify(profile, null, "\t"), { encoding: "utf8" });
        return this;
    }
    logout(projectRootPath) {
        return index_1.tokenStore.remove(this.userName).then(() => {
            try {
                fs.unlinkSync(getProfileFilename(projectRootPath));
            }
            catch (err) {
                // File not found is ok, probably doesn't exist
            }
        });
    }
}
let currentProfile;
function getProfileFilename(projectRootPath) {
    const profileDir = getProfileDir_1.getProfileDir(projectRootPath);
    return path.join(profileDir, getProfileDir_1.profileFile);
}
function loadProfile(projectRootPath) {
    const profilePath = getProfileFilename(projectRootPath);
    if (!fs.existsSync(profilePath)) {
        return null;
    }
    let profileContents = fs.readFileSync(profilePath, "utf8");
    let profile = JSON.parse(profileContents);
    return new ProfileImpl(profile);
}
function getUser(projectRootPath) {
    if (!currentProfile) {
        currentProfile = loadProfile(projectRootPath);
    }
    return currentProfile;
}
exports.getUser = getUser;
function saveUser(user, token, projectRootPath) {
    return index_1.tokenStore.set(user.name, token).then(() => {
        let profile = new ProfileImpl(user);
        profile.save(projectRootPath);
        return profile;
    });
}
exports.saveUser = saveUser;
function deleteUser(projectRootPath) {
    let profile = getUser(projectRootPath);
    if (profile) {
        currentProfile = null;
        return profile.logout(projectRootPath);
    }
    return Q.resolve(void 0);
}
exports.deleteUser = deleteUser;

//# sourceMappingURL=profile.js.map
