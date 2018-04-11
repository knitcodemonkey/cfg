"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const os = require("os");
const path = require("path");
const fs = require("fs-extra");
const uuid = require("uuid");
const child_process_1 = require("child_process");
const semver = require("semver");
const zipdir = require("zip-dir");
const unzip_1 = require("unzip");
const index_1 = require("../firefox/index");
class AddonManager {
    constructor(debugSession) {
        this.debugSession = debugSession;
        this.addonAttached = false;
        this.addonActor = undefined;
        this.config = debugSession.config.addon;
    }
    profilePrepared(profile) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.config.installInProfile) {
                let tempXpiDir = path.join(os.tmpdir(), `vscode-firefox-debug-${uuid.v4()}`);
                yield fs.mkdir(tempXpiDir);
                let tempXpiPath = yield this.createXpi(this.config.type, this.config.path, tempXpiDir);
                yield new Promise((resolve, reject) => {
                    profile.addExtension(tempXpiPath, (err, addonDetails) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        yield fs.remove(tempXpiDir);
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    }));
                });
            }
            else if (this.config.type === 'addonSdk') {
                this.addonBuildPath = path.join(os.tmpdir(), `vscode-firefox-debug-addon-${uuid.v4()}`);
            }
        });
    }
    sessionStarted(rootActor, addonsActor, preferenceActor, debugSession) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            switch (this.config.type) {
                case 'legacy':
                    if (addonsActor && !this.config.installInProfile) {
                        yield addonsActor.installAddon(this.config.path);
                    }
                    let [addonActor, consoleActor] = yield rootActor.fetchProcess();
                    let tabId = debugSession.tabs.register(addonActor);
                    debugSession.attachTabOrAddon(addonActor, consoleActor, 'Browser', tabId);
                    break;
                case 'addonSdk':
                    if (addonsActor && !this.config.installInProfile) {
                        if (this.addonBuildPath) {
                            yield this.buildAddonDir(this.config.path, this.addonBuildPath);
                            yield addonsActor.installAddon(this.addonBuildPath);
                            yield preferenceActor.setCharPref('vscode.debug.temporaryAddonPath', this.addonBuildPath);
                        }
                        else {
                            try {
                                this.addonBuildPath = yield preferenceActor.getCharPref('vscode.debug.temporaryAddonPath');
                                yield fs.copy(this.config.path, this.addonBuildPath);
                            }
                            catch (err) {
                            }
                        }
                    }
                    this.fetchAddonsAndAttach(rootActor);
                    break;
                case 'webExtension':
                    if (addonsActor && !this.config.installInProfile) {
                        yield addonsActor.installAddon(this.config.path);
                    }
                    this.fetchAddonsAndAttach(rootActor);
                    break;
            }
        });
    }
    reloadAddon() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.addonActor) {
                throw 'Addon isn\'t attached';
            }
            if (this.addonBuildPath) {
                yield fs.copy(this.config.path, this.addonBuildPath);
            }
            yield this.addonActor.reload();
        });
    }
    rebuildAddon() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.addonBuildPath) {
                throw 'This command is only available when debugging an addon of type "addonSdk"';
            }
            yield this.buildAddonDir(this.config.path, this.addonBuildPath);
        });
    }
    fetchAddonsAndAttach(rootActor) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.addonAttached)
                return;
            let addons = yield rootActor.fetchAddons();
            if (this.addonAttached)
                return;
            const sourceMaps = this.debugSession.config.sourceMaps;
            addons.forEach((addon) => {
                if (addon.id === this.config.id) {
                    (() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        let consoleActor;
                        if (addon.isWebExtension) {
                            let webExtensionActor = new index_1.WebExtensionActorProxy(addon, sourceMaps, this.debugSession.firefoxDebugConnection);
                            [this.addonActor, consoleActor] = yield webExtensionActor.connect();
                        }
                        else {
                            this.addonActor = new index_1.TabActorProxy(addon.actor, addon.name, '', sourceMaps, this.debugSession.firefoxDebugConnection);
                            consoleActor = new index_1.ConsoleActorProxy(addon.consoleActor, this.debugSession.firefoxDebugConnection);
                        }
                        let threadAdapter = yield this.debugSession.attachTabOrAddon(this.addonActor, consoleActor, 'Addon');
                        if (threadAdapter !== undefined) {
                            this.debugSession.attachConsole(consoleActor, threadAdapter);
                        }
                        this.addonAttached = true;
                    }))();
                }
            });
        });
    }
    createXpi(addonType, addonPath, destDir) {
        return new Promise((resolve, reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            switch (addonType) {
                case 'legacy':
                case 'webExtension':
                    let destFile = path.join(destDir, 'addon.xpi');
                    zipdir(addonPath, { saveTo: destFile }, (err, buffer) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(destFile);
                        }
                    });
                    break;
                case 'addonSdk':
                    try {
                        let jpmVersion = child_process_1.execSync('jpm -V', { encoding: 'utf8' });
                        jpmVersion = jpmVersion.trim();
                        if (semver.lt(jpmVersion, '1.2.0')) {
                            reject(`Please install a newer version of jpm (You have ${jpmVersion}, but 1.2.0 or newer is required)`);
                            return;
                        }
                        child_process_1.execSync(`jpm xpi --dest-dir "${destDir}"`, { cwd: addonPath });
                        resolve(path.join(destDir, (yield fs.readdir(destDir))[0]));
                    }
                    catch (err) {
                        reject(`Couldn't run jpm: ${err.stderr}`);
                    }
                    break;
            }
        }));
    }
    buildAddonDir(addonPath, destDir) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield fs.mkdir(destDir);
            let xpiPath = yield this.createXpi('addonSdk', addonPath, destDir);
            yield this.unzip(xpiPath, destDir);
            yield fs.unlink(xpiPath);
        });
    }
    unzip(srcFile, destDir) {
        return new Promise((resolve, reject) => {
            let extractor = unzip_1.Extract({ path: destDir });
            extractor.on('close', resolve);
            extractor.on('error', reject);
            fs.createReadStream(srcFile).pipe(extractor);
        });
    }
}
exports.AddonManager = AddonManager;
//# sourceMappingURL=addonManager.js.map