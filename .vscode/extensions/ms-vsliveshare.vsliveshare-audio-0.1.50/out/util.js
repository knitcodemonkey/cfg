//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const fse = require("fs-extra");
const crypto = require("crypto");
/**
 * Function to open a file asynchronously.
 *
 * @param filePath File to open.
 * @param openMode Open mode string.
 * @returns Promise with `file descriptor` if fulfills.
 */
exports.openFileAsync = (filePath, openMode) => {
    return new Promise((resolve, reject) => {
        fs.open(filePath, openMode, (err, fileDescriptior) => {
            if (err) {
                reject(err);
            }
            resolve(fileDescriptior);
        });
    });
};
function computeFileHashAsync(filename, hashType = 'sha1') {
    return new Promise((resolve) => {
        const hash = crypto.createHash(hashType);
        const input = fs.createReadStream(filename);
        input.on('error', (err) => {
            if (err.code === 'ENOENT') {
                resolve(null);
            }
            else {
                throw new Error(err);
            }
        });
        input.on('readable', () => {
            const data = input.read();
            if (data) {
                hash.update(data);
            }
            else {
                resolve(hash.digest('hex'));
            }
        });
    });
}
exports.computeFileHashAsync = computeFileHashAsync;
function fileExistsAsync(filePath) {
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (err, stats) => {
            if (stats && stats.isFile()) {
                resolve(true);
            }
            else {
                resolve(false);
            }
        });
    });
}
exports.fileExistsAsync = fileExistsAsync;
/**
 * Moves a file and then calls stat to check if the file was moved.
 * Throws if the file didn't get moved.
 */
function moveElseThrowSync(sourcePath, targetPath) {
    return __awaiter(this, void 0, void 0, function* () {
        yield fse.removeSync(targetPath);
        yield fse.move(sourcePath, targetPath);
        // Check to see if the file was moved - we've seen cases where it's not
        // (will throw if not found) and then check that it has content.
        // Check that it has content
        if (!fs.existsSync(targetPath)) {
            throw new Error(`Setup of package files failed verification tests. Source: ${sourcePath}, target: ${targetPath}`);
        }
    });
}
exports.moveElseThrowSync = moveElseThrowSync;
/**
 * Copies a file and then calls stat to check if the file was copied.
 * Throws if the file didn't get copied.
 */
function copyElseThrowSync(sourcePath, targetPath) {
    fse.copySync(sourcePath, targetPath);
    // Check to see if the file was copied - we've seen cases where it's not.
    fs.statSync(targetPath);
}
exports.copyElseThrowSync = copyElseThrowSync;
class PathUtil {
    /**
     * Path names are PII, so we need to remove all parts preceeding the filename.
     * Makes sure we don't accidentally scrub dates as well.
     */
    static removePath(filePath, replacementString = '') {
        return filePath.replace(/([A-Za-z]:)?(\S*[\\\/])+\S*/gi, (match, drive, directory, offset, whole) => {
            if (/^\d{1,4}\/\d{1,2}\/\d{1,4}$/.test(match)) { // This is a date. No need to scrub.
                return match;
            }
            else {
                const driveAndDirectoryLength = (drive ? drive.length : 0) + directory.length;
                const fileName = match.substr(driveAndDirectoryLength);
                return replacementString + fileName;
            }
        });
    }
}
exports.PathUtil = PathUtil;
//# sourceMappingURL=util.js.map