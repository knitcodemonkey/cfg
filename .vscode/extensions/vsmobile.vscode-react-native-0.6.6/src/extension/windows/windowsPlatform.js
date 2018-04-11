"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const generalMobilePlatform_1 = require("../generalMobilePlatform");
const outputVerifier_1 = require("../../common/outputVerifier");
const telemetryHelper_1 = require("../../common/telemetryHelper");
const commandExecutor_1 = require("../../common/commandExecutor");
const reactNativeProjectHelper_1 = require("../../common/reactNativeProjectHelper");
/**
 * Windows specific platform implementation for debugging RN applications.
 */
class WindowsPlatform extends generalMobilePlatform_1.GeneralMobilePlatform {
    constructor(runOptions, platformDeps = {}) {
        super(runOptions, platformDeps);
        this.runOptions = runOptions;
    }
    runApp(enableDebug = true) {
        return telemetryHelper_1.TelemetryHelper.generate("WindowsPlatform.runApp", () => {
            const runArguments = this.getRunArgument();
            const env = this.getEnvArgument();
            if (enableDebug) {
                runArguments.push("--proxy");
            }
            return reactNativeProjectHelper_1.ReactNativeProjectHelper.getReactNativeVersion(this.runOptions.projectRoot)
                .then(version => {
                // TODO Uncomment when it will be implemented in `react-native-windows`
                // if (semver.gte(version, WindowsPlatform.NO_PACKAGER_VERSION)) {
                //     runArguments.push("--no-packager");
                // }
                const runWindowsSpawn = new commandExecutor_1.CommandExecutor(this.projectPath, this.logger).spawnReactCommand("run-windows", runArguments, { env });
                return new outputVerifier_1.OutputVerifier(() => Q(WindowsPlatform.SUCCESS_PATTERNS), () => Q(WindowsPlatform.FAILURE_PATTERNS))
                    .process(runWindowsSpawn);
            });
        });
    }
    prewarmBundleCache() {
        return this.packager.prewarmBundleCache("windows");
    }
    getRunArgument() {
        let runArguments = [];
        if (this.runOptions.runArguments && this.runOptions.runArguments.length > 0) {
            runArguments.push(...this.runOptions.runArguments);
        }
        else {
            if (this.runOptions.target) {
                runArguments.push(this.runOptions.target === "device" ? this.runOptions.target : "emulator");
            }
        }
        return runArguments;
    }
}
WindowsPlatform.SUCCESS_PATTERNS = [
    "Installing new version of the app",
    "Starting the app",
];
WindowsPlatform.FAILURE_PATTERNS = [
    {
        pattern: "Unrecognized command 'run-windows'",
        message: "'rnpm-plugin-windows' doesn't install",
    },
];
exports.WindowsPlatform = WindowsPlatform;

//# sourceMappingURL=windowsPlatform.js.map
