"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const os = require("os");
const path = require("path");
const fs = require("fs-extra");
const FirefoxProfile = require("firefox-profile");
const stripJsonComments = require("strip-json-comments");
function concatArrays(arrays) {
    return [].concat.apply([], arrays);
}
exports.concatArrays = concatArrays;
function delay(timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}
exports.delay = delay;
function isWindowsPlatform() {
    return (os.platform() === 'win32');
}
exports.isWindowsPlatform = isWindowsPlatform;
function pathsAreEqual(path1, path2) {
    if (path2 === undefined)
        return false;
    if (isWindowsPlatform()) {
        return path1.toUpperCase() === path2.toUpperCase();
    }
    else {
        return path1 === path2;
    }
}
exports.pathsAreEqual = pathsAreEqual;
function normalizePath(rawPath) {
    let normalized = path.normalize(rawPath);
    if (isWindowsPlatform()) {
        normalized = normalized.replace(/\\/g, '/');
    }
    if (normalized[normalized.length - 1] === '/') {
        normalized = normalized.substr(0, normalized.length - 1);
    }
    return normalized;
}
exports.normalizePath = normalizePath;
function exceptionGripToString(grip) {
    if ((typeof grip === 'object') && (grip !== null) && (grip.type === 'object')) {
        let preview = grip.preview;
        if (preview && (preview.kind === 'Error')) {
            if (preview.name === 'ReferenceError') {
                return 'not available';
            }
            let str = (preview.name !== undefined) ? (preview.name + ': ') : '';
            str += (preview.message !== undefined) ? preview.message : '';
            if (str !== '') {
                return str;
            }
        }
    }
    else if (typeof grip === 'string') {
        return grip;
    }
    return 'unknown error';
}
exports.exceptionGripToString = exceptionGripToString;
const identifierExpression = /^[a-zA-Z_$][a-zA-Z_$]*$/;
function accessorExpression(objectExpression, propertyName) {
    if (objectExpression === undefined) {
        return undefined;
    }
    else if (objectExpression === '') {
        return propertyName;
    }
    else if (identifierExpression.test(propertyName)) {
        return `${objectExpression}.${propertyName}`;
    }
    else {
        const escapedPropertyName = propertyName.replace('\\', '\\\\').replace('\'', '\\\'');
        return `${objectExpression}['${escapedPropertyName}']`;
    }
}
exports.accessorExpression = accessorExpression;
function findAddonId(addonPath, addonType) {
    if (addonType === 'webExtension') {
        return findWebExtensionId(addonPath);
    }
    else {
        return new Promise((resolve, reject) => {
            var dummyProfile = new FirefoxProfile();
            dummyProfile._addonDetails(addonPath, (addonDetails) => {
                if (typeof addonDetails.id === 'string') {
                    resolve(addonDetails.id);
                }
                else {
                    reject('This debugger currently requires add-ons to specify an ID in their manifest');
                }
                dummyProfile.deleteDir(() => { });
            });
        });
    }
}
exports.findAddonId = findAddonId;
function findWebExtensionId(addonPath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const rawManifest = yield fs.readFile(path.join(addonPath, 'manifest.json'), { encoding: 'utf8' });
            const manifest = JSON.parse(stripJsonComments(rawManifest));
            const id = ((manifest.applications || {}).gecko || {}).id;
            return id;
        }
        catch (err) {
            throw `Couldn't parse manifest.json: ${err}`;
        }
    });
}
//# sourceMappingURL=misc.js.map