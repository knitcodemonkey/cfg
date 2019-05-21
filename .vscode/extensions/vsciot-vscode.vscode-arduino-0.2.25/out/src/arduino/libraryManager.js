"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
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
const path = require("path");
const util = require("../common/util");
class LibraryManager {
    constructor(_settings, _arduinoApp) {
        this._settings = _settings;
        this._arduinoApp = _arduinoApp;
    }
    get libraries() {
        return this._libraries;
    }
    loadLibraries(update = false) {
        return __awaiter(this, void 0, void 0, function* () {
            this._libraryMap = new Map();
            this._libraries = [];
            const libraryIndexFilePath = path.join(this._settings.packagePath, "library_index.json");
            if (update || !util.fileExistsSync(libraryIndexFilePath)) {
                yield this._arduinoApp.initializeLibrary(true);
            }
            // Parse libraries index file "library_index.json"
            const packageContent = fs.readFileSync(libraryIndexFilePath, "utf8");
            this.parseLibraryIndex(JSON.parse(packageContent));
            // Load default Arduino libraries from Arduino installation package.
            yield this.loadInstalledLibraries(this._settings.defaultLibPath, true);
            // Load manually installed libraries.
            yield this.loadInstalledLibraries(path.join(this._settings.sketchbookPath, "libraries"), false);
            // Load libraries from installed board packages.
            const builtinLibs = yield this.loadBoardLibraries();
            this._libraries = Array.from(this._libraryMap.values());
            this._libraries = this._libraries.concat(builtinLibs);
            // Mark those libraries that are supported by current board's architecture.
            this.tagSupportedLibraries();
        });
    }
    parseLibraryIndex(rawModel) {
        rawModel.libraries.forEach((library) => {
            // Arduino install-library program will replace the blank space of the library folder name with underscore,
            // here format library name consistently for better parsing at the next steps.
            const formattedName = library.name.replace(/\s+/g, "_");
            const existingLib = this._libraryMap.get(formattedName);
            if (existingLib) {
                existingLib.versions.push(library.version);
            }
            else {
                library.versions = [library.version];
                library.builtIn = false;
                library.version = "";
                this._libraryMap.set(formattedName, library);
            }
        });
    }
    loadInstalledLibraries(libRoot, isBuiltin) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!util.directoryExistsSync(libRoot)) {
                return;
            }
            const installedLibDirs = util.filterJunk(util.readdirSync(libRoot, true));
            for (const libDir of installedLibDirs) {
                let sourceLib = null;
                if (util.fileExistsSync(path.join(libRoot, libDir, "library.properties"))) {
                    const properties = yield util.parseProperties(path.join(libRoot, libDir, "library.properties"));
                    const formattedName = properties.name.replace(/\s+/g, "_");
                    sourceLib = this._libraryMap.get(formattedName);
                    if (!sourceLib) {
                        sourceLib = Object.assign({}, properties);
                        sourceLib.website = properties.url;
                        this._libraryMap.set(formattedName, sourceLib);
                    }
                    sourceLib.version = util.formatVersion(properties.version);
                }
                else {
                    // For manually imported library, library.properties may be missing. Take the folder name as library name.
                    sourceLib = this._libraryMap.get(libDir);
                    if (!sourceLib) {
                        sourceLib = {
                            name: libDir,
                            types: ["Contributed"],
                        };
                        this._libraryMap.set(libDir, sourceLib);
                    }
                }
                sourceLib.builtIn = isBuiltin;
                sourceLib.installed = true;
                sourceLib.installedPath = path.join(libRoot, libDir);
                sourceLib.srcPath = path.join(libRoot, libDir, "src");
                // If lib src folder doesn't exist, then fallback to the lib root path as source folder.
                sourceLib.srcPath = util.directoryExistsSync(sourceLib.srcPath) ? sourceLib.srcPath : path.join(libRoot, libDir);
            }
        });
    }
    // Builtin libraries from board packages.
    loadBoardLibraries() {
        return __awaiter(this, void 0, void 0, function* () {
            let builtinLibs = [];
            const librarySet = new Set(this._libraryMap.keys());
            const installedPlatforms = this._arduinoApp.boardManager.getInstalledPlatforms();
            for (const board of installedPlatforms) {
                const libs = yield this.parseBoardLibraries(board.rootBoardPath, board.architecture, librarySet);
                builtinLibs = builtinLibs.concat(libs);
            }
            return builtinLibs;
        });
    }
    parseBoardLibraries(rootBoardPath, architecture, librarySet) {
        return __awaiter(this, void 0, void 0, function* () {
            const builtInLib = [];
            const builtInLibPath = path.join(rootBoardPath, "libraries");
            if (util.directoryExistsSync(builtInLibPath)) {
                const libDirs = util.filterJunk(util.readdirSync(builtInLibPath, true));
                if (!libDirs || !libDirs.length) {
                    return builtInLib;
                }
                for (const libDir of libDirs) {
                    let sourceLib = {};
                    if (util.fileExistsSync(path.join(builtInLibPath, libDir, "library.properties"))) {
                        const properties = yield util.parseProperties(path.join(builtInLibPath, libDir, "library.properties"));
                        sourceLib = Object.assign({}, properties);
                        sourceLib.version = util.formatVersion(sourceLib.version);
                        sourceLib.website = properties.url;
                    }
                    else {
                        sourceLib.name = libDir;
                    }
                    sourceLib.builtIn = true;
                    sourceLib.installed = true;
                    sourceLib.installedPath = path.join(builtInLibPath, libDir);
                    sourceLib.srcPath = path.join(builtInLibPath, libDir, "src");
                    // If lib src folder doesn't exist, then fallback to lib root path as source folder.
                    sourceLib.srcPath = util.directoryExistsSync(sourceLib.srcPath) ? sourceLib.srcPath : path.join(builtInLibPath, libDir);
                    sourceLib.architectures = [architecture];
                    // For libraries with the same name, append architecture info to name to avoid duplication.
                    if (librarySet.has(sourceLib.name)) {
                        sourceLib.name = sourceLib.name + "(" + architecture + ")";
                    }
                    if (!librarySet.has(sourceLib.name)) {
                        librarySet.add(sourceLib.name);
                        builtInLib.push(sourceLib);
                    }
                }
            }
            return builtInLib;
        });
    }
    tagSupportedLibraries() {
        const currentBoard = this._arduinoApp.boardManager.currentBoard;
        if (!currentBoard) {
            return;
        }
        const targetArch = currentBoard.platform.architecture;
        this._libraries.forEach((library) => {
            const architectures = [].concat(library.architectures || "*");
            library.supported = !!architectures.find((arch) => {
                return arch.indexOf(targetArch) >= 0 || arch.indexOf("*") >= 0;
            });
        });
    }
}
exports.LibraryManager = LibraryManager;

//# sourceMappingURL=libraryManager.js.map
