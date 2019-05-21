"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const index_1 = require("../firefox/index");
exports.popupAutohidePreferenceKey = 'ui.popup.disable_autohide';
class AddonManager {
    constructor(debugSession) {
        this.debugSession = debugSession;
        this.addonAttached = false;
        this.addonActor = undefined;
        this.config = debugSession.config.addon;
    }
    sessionStarted(rootActor, addonsActor, preferenceActor, debugSession) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let result = yield addonsActor.installAddon(this.config.path);
            if (!this.config.id) {
                this.config.id = result.addon.id;
            }
            this.fetchAddonsAndAttach(rootActor);
            if (this.config.popupAutohideButton) {
                const popupAutohide = !(yield preferenceActor.getBoolPref(exports.popupAutohidePreferenceKey));
                debugSession.sendCustomEvent('popupAutohide', { popupAutohide });
            }
        });
    }
    reloadAddon() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.addonActor) {
                throw 'Addon isn\'t attached';
            }
            yield this.addonActor.reload();
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
                        let webExtensionActor = new index_1.WebExtensionActorProxy(addon, sourceMaps, this.debugSession.pathMapper, this.debugSession.firefoxDebugConnection);
                        [this.addonActor, consoleActor] = yield webExtensionActor.connect();
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
}
exports.AddonManager = AddonManager;
//# sourceMappingURL=addonManager.js.map