"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
//
// file-token-store - implementation of token store that stores the data in
// a JSON encoded file on dist.
//
// This doesn't secure the data in any way, relies on the directory having
// proper security settings.
//
const fs = require("fs");
const rx = require("rx-lite");
const lodash_1 = require("lodash");
const Q = require("q");
class FileTokenStore {
    constructor(filePath) {
        this.filePath = filePath;
        this.tokenStoreCache = undefined;
    }
    getStoreFilePath() {
        return this.filePath;
    }
    list() {
        this.loadTokenStoreCache();
        return rx.Observable.from(lodash_1.toPairs(this.tokenStoreCache)).map(pair => ({ key: pair[0], accessToken: pair[1] }));
    }
    get(key) {
        this.loadTokenStoreCache();
        let token;
        if (this.tokenStoreCache) {
            token = this.tokenStoreCache[key];
        }
        if (!token) {
            return Q.resolve(null);
        }
        return Q({ key: key, accessToken: token });
    }
    set(key, value) {
        this.loadTokenStoreCache();
        if (this.tokenStoreCache) {
            this.tokenStoreCache[key] = value;
        }
        this.writeTokenStoreCache();
        return Q.resolve(void 0);
    }
    remove(key) {
        this.loadTokenStoreCache();
        if (this.tokenStoreCache) {
            delete this.tokenStoreCache[key];
        }
        this.writeTokenStoreCache();
        return Q.resolve(void 0);
    }
    loadTokenStoreCache() {
        if (!this.tokenStoreCache) {
            try {
                this.tokenStoreCache = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
            }
            catch (err) {
                // No token cache file, creating new empty cache
                this.tokenStoreCache = {};
            }
        }
    }
    writeTokenStoreCache() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.tokenStoreCache));
    }
}
exports.FileTokenStore = FileTokenStore;
function createFileTokenStore(pathName) {
    return new FileTokenStore(pathName);
}
exports.createFileTokenStore = createFileTokenStore;

//# sourceMappingURL=fileTokenStore.js.map
