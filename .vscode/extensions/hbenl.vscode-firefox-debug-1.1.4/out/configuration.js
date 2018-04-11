"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const os = require("os");
const path = require("path");
const uuid = require("uuid");
const log_1 = require("./util/log");
const misc_1 = require("./util/misc");
const fs_1 = require("./util/fs");
const minimatch_1 = require("minimatch");
const FirefoxProfile = require("firefox-profile");
let log = log_1.Log.create('ParseConfiguration');
function parseConfiguration(config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let attach = undefined;
        let launch = undefined;
        let addon = undefined;
        let port = config.port || 6000;
        let pathMappings = [];
        if (config.request === 'launch') {
            let tmpDirs = [];
            if (config.reAttach) {
                attach = {
                    host: 'localhost', port,
                    reloadTabs: (config.reloadOnAttach !== false)
                };
            }
            let firefoxExecutable = yield findFirefoxExecutable(config.firefoxExecutable);
            let firefoxArgs = ['-start-debugger-server', String(port), '-no-remote'];
            if (config.firefoxArgs) {
                firefoxArgs.push(...config.firefoxArgs);
            }
            let { profileDir, srcProfileDir } = yield parseProfileConfiguration(config, tmpDirs);
            firefoxArgs.push('-profile', profileDir);
            let preferences = createFirefoxPreferences(config.preferences);
            if (config.file) {
                if (!path.isAbsolute(config.file)) {
                    throw 'The "file" property in the launch configuration has to be an absolute path';
                }
                let fileUrl = config.file;
                if (misc_1.isWindowsPlatform()) {
                    fileUrl = 'file:///' + fileUrl.replace(/\\/g, '/');
                }
                else {
                    fileUrl = 'file://' + fileUrl;
                }
                firefoxArgs.push(fileUrl);
            }
            else if (config.url) {
                firefoxArgs.push(config.url);
            }
            else if (config.addonType || config.addonPath) {
                firefoxArgs.push('about:blank');
            }
            else {
                throw 'You need to set either "file" or "url" in the launch configuration';
            }
            let detached = !!config.reAttach;
            launch = {
                firefoxExecutable, firefoxArgs, profileDir, srcProfileDir,
                preferences, tmpDirs, port, detached
            };
        }
        else {
            attach = {
                host: config.host || 'localhost', port,
                reloadTabs: !!config.reloadOnAttach
            };
        }
        if (config.pathMappings) {
            pathMappings.push(...config.pathMappings.map(harmonizeTrailingSlashes));
        }
        if (config.addonType || config.addonPath) {
            addon = yield parseAddonConfiguration(config, pathMappings);
        }
        const webRoot = parseWebRootConfiguration(config, pathMappings);
        if (webRoot) {
            pathMappings.push({ url: 'webpack:///~/', path: webRoot + '/node_modules/' });
            pathMappings.push({ url: 'webpack:///./~/', path: webRoot + '/node_modules/' });
            pathMappings.push({ url: 'webpack:///./', path: webRoot + '/' });
            pathMappings.push({ url: 'webpack:///src/', path: webRoot + '/src/' });
        }
        pathMappings.push({ url: (misc_1.isWindowsPlatform() ? 'webpack:///' : 'webpack://'), path: '' });
        pathMappings.push({ url: (misc_1.isWindowsPlatform() ? 'file:///' : 'file://'), path: '' });
        let filesToSkip = parseSkipFilesConfiguration(config);
        let reloadOnChange = parseReloadConfiguration(config.reloadOnChange);
        let sourceMaps = config.sourceMaps || 'server';
        let showConsoleCallLocation = config.showConsoleCallLocation || false;
        return {
            attach, launch, addon, pathMappings, filesToSkip, reloadOnChange,
            sourceMaps, showConsoleCallLocation
        };
    });
}
exports.parseConfiguration = parseConfiguration;
function harmonizeTrailingSlashes(pathMapping) {
    if ((typeof pathMapping.url === 'string') && (typeof pathMapping.path === 'string')) {
        if (pathMapping.url.endsWith('/')) {
            if (pathMapping.path.endsWith('/')) {
                return pathMapping;
            }
            else {
                return { url: pathMapping.url, path: pathMapping.path + '/' };
            }
        }
        else {
            if (pathMapping.path.endsWith('/')) {
                return { url: pathMapping.url + '/', path: pathMapping.path };
            }
            else {
                return pathMapping;
            }
        }
    }
    else {
        return pathMapping;
    }
}
function findFirefoxExecutable(configuredPath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (configuredPath) {
            if (yield fs_1.isExecutable(configuredPath)) {
                return configuredPath;
            }
            else {
                throw 'Couldn\'t find the Firefox executable. Please correct the path given in your launch configuration.';
            }
        }
        let candidates = [];
        switch (os.platform()) {
            case 'linux':
            case 'freebsd':
            case 'sunos':
                const paths = process.env.PATH.split(':');
                candidates = [
                    ...paths.map(dir => path.join(dir, 'firefox-developer')),
                    ...paths.map(dir => path.join(dir, 'firefox')),
                ];
                break;
            case 'darwin':
                candidates = [
                    '/Applications/FirefoxDeveloperEdition.app/Contents/MacOS/firefox',
                    '/Applications/Firefox.app/Contents/MacOS/firefox'
                ];
                break;
            case 'win32':
                candidates = [
                    'C:\\Program Files (x86)\\Firefox Developer Edition\\firefox.exe',
                    'C:\\Program Files\\Firefox Developer Edition\\firefox.exe',
                    'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
                    'C:\\Program Files\\Mozilla Firefox\\firefox.exe'
                ];
                break;
        }
        for (let i = 0; i < candidates.length; i++) {
            if (yield fs_1.isExecutable(candidates[i])) {
                return candidates[i];
            }
        }
        throw 'Couldn\'t find the Firefox executable. Please specify the path by setting "firefoxExecutable" in your launch configuration.';
    });
}
function parseProfileConfiguration(config, tmpDirs) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let profileDir;
        let srcProfileDir;
        if (config.profileDir) {
            if (config.profile) {
                throw 'You can set either "profile" or "profileDir", but not both';
            }
            srcProfileDir = config.profileDir;
        }
        else if (config.profile) {
            srcProfileDir = yield findFirefoxProfileDir(config.profile);
        }
        if (config.keepProfileChanges) {
            if (srcProfileDir) {
                profileDir = srcProfileDir;
                srcProfileDir = undefined;
            }
            else {
                throw 'To enable "keepProfileChanges" you need to set either "profile" or "profileDir"';
            }
        }
        else {
            profileDir = path.join(os.tmpdir(), `vscode-firefox-debug-profile-${uuid.v4()}`);
            tmpDirs.push(profileDir);
        }
        return { profileDir, srcProfileDir };
    });
}
function findFirefoxProfileDir(profileName) {
    return new Promise((resolve, reject) => {
        let finder = new FirefoxProfile.Finder();
        finder.getPath(profileName, (err, path) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(path);
            }
        });
    });
}
function createFirefoxPreferences(additionalPreferences) {
    let preferences = {};
    preferences['browser.shell.checkDefaultBrowser'] = false;
    preferences['devtools.chrome.enabled'] = true;
    preferences['devtools.debugger.prompt-connection'] = false;
    preferences['devtools.debugger.remote-enabled'] = true;
    preferences['devtools.debugger.workers'] = true;
    preferences['extensions.autoDisableScopes'] = 10;
    preferences['xpinstall.signatures.required'] = false;
    preferences['extensions.sdk.console.logLevel'] = 'all';
    preferences['toolkit.telemetry.reportingpolicy.firstRun'] = false;
    if (additionalPreferences !== undefined) {
        for (let key in additionalPreferences) {
            let value = additionalPreferences[key];
            if (value !== null) {
                preferences[key] = value;
            }
            else {
                delete preferences[key];
            }
        }
    }
    return preferences;
}
function parseWebRootConfiguration(config, pathMappings) {
    if (config.url) {
        if (!config.webRoot) {
            if (!config.pathMappings) {
                throw `If you set "url" you also have to set "webRoot" or "pathMappings" in the ${config.request} configuration`;
            }
            return undefined;
        }
        else if (!path.isAbsolute(config.webRoot)) {
            throw `The "webRoot" property in the ${config.request} configuration has to be an absolute path`;
        }
        let webRootUrl = config.url;
        if (webRootUrl.indexOf('/') >= 0) {
            webRootUrl = webRootUrl.substr(0, webRootUrl.lastIndexOf('/'));
        }
        let webRoot = path.normalize(config.webRoot);
        if (misc_1.isWindowsPlatform()) {
            webRoot = webRoot.replace(/\\/g, '/');
        }
        if (webRoot[webRoot.length - 1] === '/') {
            webRoot = webRoot.substr(0, webRoot.length - 1);
        }
        pathMappings.forEach((pathMapping) => {
            const to = pathMapping.path;
            if ((typeof to === 'string') && (to.substr(0, 10) === '${webRoot}')) {
                pathMapping.path = webRoot + to.substr(10);
            }
        });
        pathMappings.push({ url: webRootUrl, path: webRoot });
        return webRoot;
    }
    else if (config.webRoot) {
        throw `If you set "webRoot" you also have to set "url" in the ${config.request} configuration`;
    }
    return undefined;
}
function parseSkipFilesConfiguration(config) {
    let filesToSkip = [];
    if (config.skipFiles) {
        config.skipFiles.forEach((glob) => {
            let minimatch = new minimatch_1.Minimatch(glob);
            let regExp = minimatch.makeRe();
            if (regExp) {
                filesToSkip.push(regExp);
            }
            else {
                log.warn(`Invalid glob pattern "${glob}" specified in "skipFiles"`);
            }
        });
    }
    return filesToSkip;
}
function parseReloadConfiguration(reloadConfig) {
    if (reloadConfig === undefined) {
        return undefined;
    }
    const defaultDebounce = 100;
    if (typeof reloadConfig === 'string') {
        return {
            watch: [reloadConfig],
            ignore: [],
            debounce: defaultDebounce
        };
    }
    else if (Array.isArray(reloadConfig)) {
        return {
            watch: reloadConfig,
            ignore: [],
            debounce: defaultDebounce
        };
    }
    else {
        let _config = reloadConfig;
        let watch;
        if (typeof _config.watch === 'string') {
            watch = [_config.watch];
        }
        else {
            watch = _config.watch;
        }
        let ignore;
        if (_config.ignore === undefined) {
            ignore = [];
        }
        else if (typeof _config.ignore === 'string') {
            ignore = [_config.ignore];
        }
        else {
            ignore = _config.ignore;
        }
        let debounce;
        if (typeof _config.debounce === 'number') {
            debounce = _config.debounce;
        }
        else {
            debounce = (_config.debounce !== false) ? defaultDebounce : 0;
        }
        return { watch, ignore, debounce };
    }
}
function parseAddonConfiguration(config, pathMappings) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let addonType = config.addonType || 'webExtension';
        let addonPath = config.addonPath;
        if (!addonPath) {
            throw `If you set "addonType" you also have to set "addonPath" in the ${config.request} configuration`;
        }
        let addonId = yield misc_1.findAddonId(addonPath, addonType);
        let installInProfile = false;
        if (config.request === 'launch') {
            if (config.installAddonInProfile !== undefined) {
                if (config.installAddonInProfile && config.reAttach) {
                    throw '"installAddonInProfile" is not available with "reAttach"';
                }
                installInProfile = config.installAddonInProfile;
            }
            else {
                installInProfile = !config.reAttach;
            }
        }
        if (config.addonType === 'addonSdk') {
            let rewrittenAddonId = addonId.replace("@", "-at-");
            let sanitizedAddonPath = addonPath;
            if (sanitizedAddonPath[sanitizedAddonPath.length - 1] === '/') {
                sanitizedAddonPath = sanitizedAddonPath.substr(0, sanitizedAddonPath.length - 1);
            }
            pathMappings.push({
                url: 'resource://' + rewrittenAddonId,
                path: sanitizedAddonPath
            });
        }
        else if (config.addonType === 'webExtension') {
            let rewrittenAddonId = addonId.replace('{', '%7B').replace('}', '%7D');
            let sanitizedAddonPath = addonPath;
            if (sanitizedAddonPath[sanitizedAddonPath.length - 1] === '/') {
                sanitizedAddonPath = sanitizedAddonPath.substr(0, sanitizedAddonPath.length - 1);
            }
            pathMappings.push({
                url: new RegExp('^moz-extension://[0-9a-f-]*(/.*)$'),
                path: sanitizedAddonPath
            });
            pathMappings.push({
                url: new RegExp(`^jar:file:.*/extensions/${rewrittenAddonId}.xpi!(/.*)$`),
                path: sanitizedAddonPath
            });
        }
        return {
            type: addonType, path: addonPath, id: addonId, installInProfile
        };
    });
}
//# sourceMappingURL=configuration.js.map