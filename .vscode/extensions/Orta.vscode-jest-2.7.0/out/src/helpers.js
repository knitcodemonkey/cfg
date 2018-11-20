"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Known binary names of `react-scripts` forks
*/
const createReactAppBinaryNames = ['react-scripts', 'react-native-scripts', 'react-scripts-ts', 'react-app-rewired'];
/**
 * Tries to read the test command from the scripts section within `package.json`
 *
 * Returns the test command in case of success,
 * `undefined` if there was an exception while reading and parsing `package.json`
 * `null` if there is no test script
 */
function getTestCommand(rootPath) {
    try {
        const packagePath = path_1.join(rootPath, 'package.json');
        const packageJSON = JSON.parse(fs_1.readFileSync(packagePath, 'utf8'));
        if (packageJSON && packageJSON.scripts && packageJSON.scripts.test) {
            return packageJSON.scripts.test;
        }
        return null;
    }
    catch (_a) {
        return undefined;
    }
}
exports.getTestCommand = getTestCommand;
/**
 * Checks if the supplied test command could have been generated by create-react-app
*/
function isCRATestCommand(testCommand) {
    return testCommand && createReactAppBinaryNames.some(binary => testCommand.indexOf(binary + ' test') === 0);
}
exports.isCRATestCommand = isCRATestCommand;
/**
 * Checks if the project in `rootPath` was bootstrapped by `create-react-app`.
 */
function isBootstrappedWithCRA(rootPath) {
    const testCommand = getTestCommand(rootPath);
    if (testCommand === undefined) {
        // In case parsing `package.json` failed or was unconclusive,
        // fallback to checking for the presence of the binaries in `./node_modules/.bin`
        return createReactAppBinaryNames.some(binary => hasNodeExecutable(rootPath, binary));
    }
    return isCRATestCommand(testCommand);
}
function hasNodeExecutable(rootPath, executable) {
    const ext = os_1.platform() === 'win32' ? '.cmd' : '';
    const absolutePath = path_1.join(rootPath, 'node_modules', '.bin', executable + ext);
    return fs_1.existsSync(absolutePath);
}
/**
 *  Handles getting the jest runner, handling the OS and project specific work too
 *
 * @returns {string}
 */
function pathToJest(pluginSettings) {
    const path = path_1.normalize(pluginSettings.pathToJest);
    const defaultPath = path_1.normalize('node_modules/.bin/jest');
    if (path === defaultPath && isBootstrappedWithCRA(pluginSettings.rootPath)) {
        // If it's the default, run the script instead
        return 'npm test --';
    }
    return path;
}
exports.pathToJest = pathToJest;
/**
 * Handles getting the path to config file
 *
 * @returns {string}
 */
function pathToConfig(pluginSettings) {
    if (pluginSettings.pathToConfig !== '') {
        return path_1.normalize(pluginSettings.pathToConfig);
    }
    return '';
}
exports.pathToConfig = pathToConfig;
function pathToJestPackageJSON(pluginSettings) {
    let pathToNodeModules = path_1.join(pluginSettings.rootPath, 'node_modules');
    if (pluginSettings.pathToJest) {
        const relativeJestCmd = removeSurroundingQuotes(pluginSettings.pathToJest.split(' ')[0]);
        const relativePathToNodeModules = relativeJestCmd.replace(/node_modules.+$/i, 'node_modules');
        pathToNodeModules = path_1.join(pluginSettings.rootPath, relativePathToNodeModules);
    }
    const defaultPath = path_1.normalize(path_1.join(pathToNodeModules, 'jest/package.json'));
    const cliPath = path_1.normalize(path_1.join(pathToNodeModules, 'jest-cli/package.json'));
    const craPath = path_1.normalize(path_1.join(pathToNodeModules, 'react-scripts/node_modules/jest/package.json'));
    const paths = [defaultPath, cliPath, craPath];
    for (const i in paths) {
        if (fs_1.existsSync(paths[i])) {
            return paths[i];
        }
    }
    return null;
}
exports.pathToJestPackageJSON = pathToJestPackageJSON;
function removeSurroundingQuotes(str) {
    return str.replace(/^['"`]/, '').replace(/['"`]$/, '');
}
/**
 *  Taken From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
 */
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
exports.escapeRegExp = escapeRegExp;
//# sourceMappingURL=helpers.js.map