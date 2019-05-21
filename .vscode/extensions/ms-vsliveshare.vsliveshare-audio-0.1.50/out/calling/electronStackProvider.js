"use strict";
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const skype_calling_electron_1 = require("skype-calling-electron");
const callingLogger_1 = require("./callingLogger");
const traceSource_1 = require("../tracing/traceSource");
const callingUtils_1 = require("./callingUtils");
const logFileTraceListener_1 = require("../tracing/logFileTraceListener");
function loadSlimCore() {
    try {
        const vscodeVersion = vscode.version.split('-')[0];
        const electronVersion = semver.satisfies(vscodeVersion, '>=1.31.0') ? '3.0' :
            semver.satisfies(vscodeVersion, '>=1.26.0') ? '2.0' : '1.7';
        let slimcore = module.require(`slimcore-${electronVersion}`);
        global.SlimCore = slimcore;
        global.Enums = slimcore.Enums;
        return slimcore;
    }
    catch (e) {
        throw new Error(`Calling module not available. ${e.message}`);
    }
}
class AppHooks {
    onDisplaysChanged(callback) {
        return null;
    }
    showSharingIndicator(regionOrWindowId) {
    }
    hideSharingIndicator() {
    }
    getControlInjector() {
        return null;
    }
}
class ElectronStackProvider {
    build() {
        loadSlimCore();
        const platformId = callingUtils_1.PLATFORMS[`${process.platform}-${process.arch}`];
        if (!platformId) {
            throw new Error(`Platform ${process.platform}-${process.arch} not supported`);
        }
        let callingSessionPath = path.join(logFileTraceListener_1.LogFileTraceListener.defaultLogDirectory, 'audio-extension');
        let dataPath = path.join(callingSessionPath, 'data');
        let mediaLogsPath = path.join(callingSessionPath, 'media-stack');
        fs.existsSync(callingSessionPath) || fs.mkdirSync(callingSessionPath);
        fs.existsSync(dataPath) || fs.mkdirSync(dataPath);
        fs.existsSync(mediaLogsPath) || fs.mkdirSync(mediaLogsPath);
        let slimCoreSettings = {
            dataPath: dataPath,
            mediaLogsPath: mediaLogsPath,
            logFileName: 'log',
            version: `${platformId}/${callingUtils_1.getNormalizedVersion()}//`,
            isEncrypted: false
        };
        this.slimCoreInstance = global.SlimCore.createSlimCoreInstance(slimCoreSettings);
        traceSource_1.defaultTraceSource.info(JSON.stringify(Object.keys(this.slimCoreInstance)));
        traceSource_1.defaultTraceSource.info('Building SlimCore Electron stack');
        return skype_calling_electron_1.slimCoreElectronStackFactory.build({
            appHooks: new AppHooks(),
            logger: new callingLogger_1.VSCallingLogger(),
            settings: {
                useChromiumRenderer: false,
                usePepperRenderer: false,
                enableDXVA: false,
                autoStopLocalVideo: false
            },
            slimCoreInstance: this.slimCoreInstance
        });
    }
    dispose() {
        traceSource_1.defaultTraceSource.info('electronStackProvider: dispose()');
        if (this.slimCoreInstance) {
            this.slimCoreInstance.dispose();
            this.slimCoreInstance = null;
        }
        global.SlimCore = null;
        global.Enums = null;
    }
}
const electronStackProvider = new ElectronStackProvider();
module.exports = electronStackProvider;
//# sourceMappingURL=electronStackProvider.js.map