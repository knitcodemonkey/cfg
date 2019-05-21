"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const url = require("url");
const log_1 = require("./log");
const misc_1 = require("./misc");
const net_1 = require("./net");
let log = log_1.Log.create('PathConversion');
let isWindowsPlatform = misc_1.isWindowsPlatform();
exports.urlDetector = /^[a-zA-Z][a-zA-Z0-9\+\-\.]*\:\/\//;
class PathMapper {
    constructor(pathMappings, addonConfig) {
        this.pathMappings = pathMappings;
        this.addonConfig = addonConfig;
    }
    convertFirefoxSourceToPath(source) {
        if (!source)
            return undefined;
        if (source.addonID && this.addonConfig && (source.addonID === this.addonConfig.id)) {
            let sourcePath = this.removeQueryString(path.join(this.addonConfig.path, source.addonPath));
            log.debug(`Addon script path: ${sourcePath}`);
            return sourcePath;
        }
        else if (source.isSourceMapped && source.generatedUrl && source.url && !exports.urlDetector.test(source.url)) {
            let originalPathOrUrl = source.url;
            if (path.isAbsolute(originalPathOrUrl)) {
                log.debug(`Sourcemapped absolute path: ${originalPathOrUrl}`);
                if (isWindowsPlatform) {
                    originalPathOrUrl = path.normalize(originalPathOrUrl);
                }
                return originalPathOrUrl;
            }
            else {
                let generatedUrl = source.generatedUrl;
                if ((source.introductionType === 'wasm') && generatedUrl.startsWith('wasm:')) {
                    generatedUrl = generatedUrl.substr(5);
                }
                let sourcePath;
                if (originalPathOrUrl.startsWith('../')) {
                    let generatedPath = this.convertFirefoxUrlToPath(generatedUrl);
                    if (!generatedPath)
                        return undefined;
                    sourcePath = path.join(path.dirname(generatedPath), originalPathOrUrl);
                }
                else {
                    let sourceUrl = url.resolve(net_1.urlDirname(generatedUrl), originalPathOrUrl);
                    sourcePath = this.convertFirefoxUrlToPath(sourceUrl);
                    if (!sourcePath)
                        return undefined;
                }
                sourcePath = this.removeQueryString(sourcePath);
                log.debug(`Sourcemapped path: ${sourcePath}`);
                return sourcePath;
            }
        }
        else if (source.url) {
            return this.convertFirefoxUrlToPath(source.url);
        }
        else {
            return undefined;
        }
    }
    convertFirefoxUrlToPath(url) {
        for (var i = 0; i < this.pathMappings.length; i++) {
            let { url: from, path: to } = this.pathMappings[i];
            if (typeof from === 'string') {
                if (url.substr(0, from.length) === from) {
                    if (to === null) {
                        log.debug(`Url ${url} not converted to path`);
                        return undefined;
                    }
                    let thePath = this.removeQueryString(to + decodeURIComponent(url.substr(from.length)));
                    if (isWindowsPlatform) {
                        thePath = path.normalize(thePath);
                    }
                    log.debug(`Converted url ${url} to path ${thePath}`);
                    return thePath;
                }
            }
            else {
                let match = from.exec(url);
                if (match) {
                    if (to === null) {
                        log.debug(`Url ${url} not converted to path`);
                        return undefined;
                    }
                    let thePath = this.removeQueryString(to + decodeURIComponent(match[1]));
                    if (isWindowsPlatform) {
                        thePath = path.normalize(thePath);
                    }
                    log.debug(`Converted url ${url} to path ${thePath}`);
                    return thePath;
                }
            }
        }
        log.info(`Can't convert url ${url} to path`);
        return undefined;
    }
    removeQueryString(path) {
        let queryStringIndex = path.indexOf('?');
        if (queryStringIndex >= 0) {
            return path.substr(0, queryStringIndex);
        }
        else {
            return path;
        }
    }
}
exports.PathMapper = PathMapper;
//# sourceMappingURL=pathMapper.js.map