"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = tslib_1.__importStar(require("path"));
const fs = tslib_1.__importStar(require("fs-extra"));
const child_process_1 = require("child_process");
const firefox_profile_1 = tslib_1.__importDefault(require("firefox-profile"));
function launchFirefox(launch) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield prepareDebugProfile(launch);
        let childProc = undefined;
        if (launch.detached) {
            let forkedLauncherPath = path.join(__dirname, '../util/forkedLauncher.js');
            let forkArgs;
            switch (launch.tmpDirs.length) {
                case 0:
                    forkArgs = [
                        'spawnDetached', launch.firefoxExecutable, ...launch.firefoxArgs
                    ];
                    break;
                case 1:
                    forkArgs = [
                        'spawnDetached', process.execPath, forkedLauncherPath,
                        'spawnAndRemove', launch.tmpDirs[0], launch.firefoxExecutable, ...launch.firefoxArgs
                    ];
                    break;
                default:
                    forkArgs = [
                        'spawnDetached', process.execPath, forkedLauncherPath,
                        'spawnAndRemove2', launch.tmpDirs[0], launch.tmpDirs[1], launch.firefoxExecutable, ...launch.firefoxArgs
                    ];
                    break;
            }
            child_process_1.fork(forkedLauncherPath, forkArgs, { execArgv: [] });
        }
        else {
            childProc = child_process_1.spawn(launch.firefoxExecutable, launch.firefoxArgs, { detached: true });
            childProc.unref();
        }
        return childProc;
    });
}
exports.launchFirefox = launchFirefox;
function prepareDebugProfile(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        var profile = yield createDebugProfile(config);
        for (let key in config.preferences) {
            profile.setPreference(key, config.preferences[key]);
        }
        profile.updatePreferences();
        return profile;
    });
}
function createDebugProfile(config) {
    return new Promise((resolve, reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (config.srcProfileDir) {
            firefox_profile_1.default.copy({
                profileDirectory: config.srcProfileDir,
                destinationDirectory: config.profileDir
            }, (err, profile) => {
                if (err || !profile) {
                    reject(err);
                }
                else {
                    profile.shouldDeleteOnExit(false);
                    resolve(profile);
                }
            });
        }
        else {
            yield fs.ensureDir(config.profileDir);
            let profile = new firefox_profile_1.default({
                destinationDirectory: config.profileDir
            });
            profile.shouldDeleteOnExit(false);
            resolve(profile);
        }
    }));
}
//# sourceMappingURL=launch.js.map