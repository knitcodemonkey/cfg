"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const log_1 = require("../util/log");
const misc_1 = require("../util/misc");
let log = log_1.Log.create('SkipFilesManager');
class SkipFilesManager {
    constructor(configuredFilesToSkip, threads) {
        this.configuredFilesToSkip = configuredFilesToSkip;
        this.threads = threads;
        this.isWindowsPlatform = misc_1.isWindowsPlatform();
        this.dynamicFiles = new Map();
    }
    shouldSkipPath(path) {
        return this.shouldSkip(path, true);
    }
    shouldSkipUrl(url) {
        return this.shouldSkip(url, false);
    }
    toggleSkippingPath(path) {
        return this.toggleSkipping(path, true);
    }
    toggleSkippingUrl(url) {
        return this.toggleSkipping(url, false);
    }
    shouldSkip(pathOrUrl, isPath) {
        if (this.dynamicFiles.has(pathOrUrl)) {
            let result = this.dynamicFiles.get(pathOrUrl);
            if (log.isDebugEnabled) {
                log.debug(`skipFile is set dynamically to ${result} for ${pathOrUrl}`);
            }
            return result;
        }
        let testee = pathOrUrl;
        if (isPath && this.isWindowsPlatform) {
            testee = testee.replace(/\\/g, '/');
        }
        for (let regExp of this.configuredFilesToSkip) {
            if (regExp.test(testee)) {
                if (log.isDebugEnabled) {
                    log.debug(`skipFile is set per configuration to true for ${pathOrUrl}`);
                }
                return true;
            }
        }
        if (log.isDebugEnabled) {
            log.debug(`skipFile is not set for ${pathOrUrl}`);
        }
        return false;
    }
    toggleSkipping(pathOrUrl, isPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const skipFile = !this.shouldSkip(pathOrUrl, isPath);
            this.dynamicFiles.set(pathOrUrl, skipFile);
            log.info(`Setting skipFile to ${skipFile} for ${pathOrUrl}`);
            let promises = [];
            for (const [, thread] of this.threads) {
                let sourceAdapters = thread.findSourceAdaptersForPathOrUrl(pathOrUrl);
                for (const sourceAdapter of sourceAdapters) {
                    if (sourceAdapter.actor.source.isBlackBoxed !== skipFile) {
                        promises.push(sourceAdapter.actor.setBlackbox(skipFile));
                    }
                }
                thread.triggerStackframeRefresh();
            }
            yield Promise.all(promises);
        });
    }
}
exports.SkipFilesManager = SkipFilesManager;
//# sourceMappingURL=skipFilesManager.js.map