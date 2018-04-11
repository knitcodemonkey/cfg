"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../../typings/index.d.ts" />
const fs = require("fs");
const path = require("path");
const yazl = require("yazl");
const fileUtils = require("../utils/file-utils");
function zip(updateContentsPath, outputDir) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        const releaseFiles = [];
        try {
            if (!fileUtils.isDirectory(updateContentsPath)) {
                releaseFiles.push({
                    sourceLocation: updateContentsPath,
                    targetLocation: fileUtils.normalizePath(path.basename(updateContentsPath)),
                });
            }
        }
        catch (error) {
            error.message = error.message + " Make sure you have added the platform you are making a release to.`.";
            reject(error);
        }
        const directoryPath = updateContentsPath;
        const baseDirectoryPath = path.join(directoryPath, ".."); // For legacy reasons, put the root directory in the zip
        const files = yield fileUtils.walk(updateContentsPath);
        files.forEach((filePath) => {
            const relativePath = path.relative(baseDirectoryPath, filePath);
            releaseFiles.push({
                sourceLocation: filePath,
                targetLocation: fileUtils.normalizePath(relativePath),
            });
        });
        if (!outputDir) {
            outputDir = process.cwd();
        }
        const packagePath = path.join(outputDir, fileUtils.generateRandomFilename(15) + ".zip");
        const zipFile = new yazl.ZipFile();
        const writeStream = fs.createWriteStream(packagePath);
        zipFile.outputStream.pipe(writeStream)
            .on("error", (error) => {
            reject(error);
        })
            .on("close", () => {
            resolve(packagePath);
        });
        releaseFiles.forEach((releaseFile) => {
            zipFile.addFile(releaseFile.sourceLocation, releaseFile.targetLocation);
        });
        zipFile.end();
    }));
}
exports.default = zip;

//# sourceMappingURL=zip.js.map
