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
const glob = require("glob");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const constants = require("../common/constants");
const util = require("../common/util");
const Logger = require("../logger/logger");
const deviceContext_1 = require("../deviceContext");
const vscodeSettings_1 = require("./vscodeSettings");
const outputChannel_1 = require("../common/outputChannel");
const workspace_1 = require("../common/workspace");
const serialMonitor_1 = require("../serialmonitor/serialMonitor");
const usbDetector_1 = require("../serialmonitor/usbDetector");
/**
 * Represent an Arduino application based on the official Arduino IDE.
 */
class ArduinoApp {
    /**
     * @param {IArduinoSettings} _settings ArduinoSetting object.
     */
    constructor(_settings) {
        this._settings = _settings;
    }
    /**
     * Need refresh Arduino IDE's setting when starting up.
     * @param {boolean} force - Whether force initialize the arduino
     */
    initialize(force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!util.fileExistsSync(this._settings.preferencePath)) {
                try {
                    // Use empty pref value to initialize preference.txt file
                    yield this.setPref("boardsmanager.additional.urls", "");
                    this._settings.reloadPreferences(); // reload preferences.
                }
                catch (ex) {
                }
            }
            if (force || !util.fileExistsSync(path.join(this._settings.packagePath, "package_index.json"))) {
                try {
                    // Use the dummy package to initialize the Arduino IDE
                    yield this.installBoard("dummy", "", "", true);
                }
                catch (ex) {
                }
            }
        });
    }
    /**
     * Initialize the arduino library.
     * @param {boolean} force - Whether force refresh library index file
     */
    initializeLibrary(force = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (force || !util.fileExistsSync(path.join(this._settings.packagePath, "library_index.json"))) {
                try {
                    // Use the dummy library to initialize the Arduino IDE
                    yield this.installLibrary("dummy", "", true);
                }
                catch (ex) {
                }
            }
        });
    }
    /**
     * Set the Arduino preferences value.
     * @param {string} key - The preference key
     * @param {string} value - The preference value
     */
    setPref(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield util.spawn(this._settings.commandPath, null, ["--pref", `${key}=${value}`, "--save-prefs"]);
            }
            catch (ex) {
            }
        });
    }
    upload() {
        return __awaiter(this, void 0, void 0, function* () {
            const dc = deviceContext_1.DeviceContext.getInstance();
            const boardDescriptor = this.getBoardBuildString();
            if (!boardDescriptor) {
                return;
            }
            if (!workspace_1.ArduinoWorkspace.rootPath) {
                vscode.window.showWarningMessage("Cannot find the sketch file.");
                return;
            }
            if (!dc.sketch || !util.fileExistsSync(path.join(workspace_1.ArduinoWorkspace.rootPath, dc.sketch))) {
                yield this.getMainSketch(dc);
            }
            if (!dc.port) {
                const choice = yield vscode.window.showInformationMessage("Serial port is not specified. Do you want to select a serial port for uploading?", "Yes", "No");
                if (choice === "Yes") {
                    vscode.commands.executeCommand("arduino.selectSerialPort");
                }
                return;
            }
            outputChannel_1.arduinoChannel.show();
            outputChannel_1.arduinoChannel.start(`Upload sketch - ${dc.sketch}`);
            const serialMonitor = serialMonitor_1.SerialMonitor.getInstance();
            const needRestore = yield serialMonitor.closeSerialMonitor(dc.port);
            usbDetector_1.UsbDetector.getInstance().pauseListening();
            yield vscode.workspace.saveAll(false);
            if (dc.prebuild) {
                outputChannel_1.arduinoChannel.info(`Run prebuild command: ${dc.prebuild}`);
                const prebuildargs = dc.prebuild.split(" ");
                const prebuildCommand = prebuildargs.shift();
                try {
                    yield util.spawn(prebuildCommand, outputChannel_1.arduinoChannel.channel, prebuildargs, { shell: true, cwd: workspace_1.ArduinoWorkspace.rootPath });
                }
                catch (ex) {
                    outputChannel_1.arduinoChannel.error(`Run prebuild failed: \n${ex.error}`);
                    return;
                }
            }
            const appPath = path.join(workspace_1.ArduinoWorkspace.rootPath, dc.sketch);
            const args = ["--upload", "--board", boardDescriptor, "--port", dc.port, appPath];
            if (vscodeSettings_1.VscodeSettings.getInstance().logLevel === "verbose") {
                args.push("--verbose");
            }
            if (dc.output) {
                const outputPath = path.resolve(workspace_1.ArduinoWorkspace.rootPath, dc.output);
                const dirPath = path.dirname(outputPath);
                if (!util.directoryExistsSync(dirPath)) {
                    Logger.notifyUserError("InvalidOutPutPath", new Error(constants.messages.INVALID_OUTPUT_PATH + outputPath));
                    return;
                }
                args.push("--pref", `build.path=${outputPath}`);
                outputChannel_1.arduinoChannel.info(`Please see the build logs in Output path: ${outputPath}`);
            }
            else {
                const msg = "Output path is not specified. Unable to reuse previously compiled files. Upload could be slow. See README.";
                outputChannel_1.arduinoChannel.warning(msg);
            }
            yield util.spawn(this._settings.commandPath, outputChannel_1.arduinoChannel.channel, args).then(() => __awaiter(this, void 0, void 0, function* () {
                usbDetector_1.UsbDetector.getInstance().resumeListening();
                if (needRestore) {
                    yield serialMonitor.openSerialMonitor();
                }
                outputChannel_1.arduinoChannel.end(`Uploaded the sketch: ${dc.sketch}${os.EOL}`);
            }), (reason) => {
                outputChannel_1.arduinoChannel.error(`Exit with code=${reason.code}${os.EOL}`);
            });
        });
    }
    uploadUsingProgrammer() {
        return __awaiter(this, void 0, void 0, function* () {
            const dc = deviceContext_1.DeviceContext.getInstance();
            const boardDescriptor = this.getBoardBuildString();
            if (!boardDescriptor) {
                return;
            }
            const selectProgrammer = this.getProgrammerString();
            if (!selectProgrammer) {
                return;
            }
            if (!workspace_1.ArduinoWorkspace.rootPath) {
                vscode.window.showWarningMessage("Cannot find the sketch file.");
                return;
            }
            if (!dc.sketch || !util.fileExistsSync(path.join(workspace_1.ArduinoWorkspace.rootPath, dc.sketch))) {
                yield this.getMainSketch(dc);
            }
            if (!dc.port) {
                const choice = yield vscode.window.showInformationMessage("Serial port is not specified. Do you want to select a serial port for uploading?", "Yes", "No");
                if (choice === "Yes") {
                    vscode.commands.executeCommand("arduino.selectSerialPort");
                }
                return;
            }
            outputChannel_1.arduinoChannel.show();
            outputChannel_1.arduinoChannel.start(`Upload sketch - ${dc.sketch}`);
            const serialMonitor = serialMonitor_1.SerialMonitor.getInstance();
            const needRestore = yield serialMonitor.closeSerialMonitor(dc.port);
            usbDetector_1.UsbDetector.getInstance().pauseListening();
            yield vscode.workspace.saveAll(false);
            const appPath = path.join(workspace_1.ArduinoWorkspace.rootPath, dc.sketch);
            const args = ["--upload", "--board", boardDescriptor, "--port", dc.port, "--useprogrammer",
                "--pref", "programmer=" + selectProgrammer, appPath];
            if (vscodeSettings_1.VscodeSettings.getInstance().logLevel === "verbose") {
                args.push("--verbose");
            }
            if (dc.output) {
                const outputPath = path.resolve(workspace_1.ArduinoWorkspace.rootPath, dc.output);
                const dirPath = path.dirname(outputPath);
                if (!util.directoryExistsSync(dirPath)) {
                    Logger.notifyUserError("InvalidOutPutPath", new Error(constants.messages.INVALID_OUTPUT_PATH + outputPath));
                    return;
                }
                args.push("--pref", `build.path=${outputPath}`);
                outputChannel_1.arduinoChannel.info(`Please see the build logs in Output path: ${outputPath}`);
            }
            else {
                const msg = "Output path is not specified. Unable to reuse previously compiled files. Upload could be slow. See README.";
                outputChannel_1.arduinoChannel.warning(msg);
            }
            yield util.spawn(this._settings.commandPath, outputChannel_1.arduinoChannel.channel, args).then(() => __awaiter(this, void 0, void 0, function* () {
                usbDetector_1.UsbDetector.getInstance().resumeListening();
                if (needRestore) {
                    yield serialMonitor.openSerialMonitor();
                }
                outputChannel_1.arduinoChannel.end(`Uploaded the sketch: ${dc.sketch}${os.EOL}`);
            }), (reason) => {
                outputChannel_1.arduinoChannel.error(`Exit with code=${reason.code}${os.EOL}`);
            });
        });
    }
    verify(output = "") {
        return __awaiter(this, void 0, void 0, function* () {
            const dc = deviceContext_1.DeviceContext.getInstance();
            const boardDescriptor = this.getBoardBuildString();
            if (!boardDescriptor) {
                return;
            }
            if (!workspace_1.ArduinoWorkspace.rootPath) {
                vscode.window.showWarningMessage("Cannot find the sketch file.");
                return;
            }
            if (!dc.sketch || !util.fileExistsSync(path.join(workspace_1.ArduinoWorkspace.rootPath, dc.sketch))) {
                yield this.getMainSketch(dc);
            }
            yield vscode.workspace.saveAll(false);
            outputChannel_1.arduinoChannel.start(`Verify sketch - ${dc.sketch}`);
            if (dc.prebuild) {
                outputChannel_1.arduinoChannel.info(`Run prebuild command: ${dc.prebuild}`);
                const prebuildargs = dc.prebuild.split(" ");
                const prebuildCommand = prebuildargs.shift();
                try {
                    yield util.spawn(prebuildCommand, outputChannel_1.arduinoChannel.channel, prebuildargs, { shell: true, cwd: workspace_1.ArduinoWorkspace.rootPath });
                }
                catch (ex) {
                    outputChannel_1.arduinoChannel.error(`Run prebuild failed: \n${ex.error}`);
                    return;
                }
            }
            const appPath = path.join(workspace_1.ArduinoWorkspace.rootPath, dc.sketch);
            const args = ["--verify", "--board", boardDescriptor, appPath];
            if (vscodeSettings_1.VscodeSettings.getInstance().logLevel === "verbose") {
                args.push("--verbose");
            }
            if (output || dc.output) {
                const outputPath = path.resolve(workspace_1.ArduinoWorkspace.rootPath, output || dc.output);
                const dirPath = path.dirname(outputPath);
                if (!util.directoryExistsSync(dirPath)) {
                    Logger.notifyUserError("InvalidOutPutPath", new Error(constants.messages.INVALID_OUTPUT_PATH + outputPath));
                    return;
                }
                args.push("--pref", `build.path=${outputPath}`);
                outputChannel_1.arduinoChannel.info(`Please see the build logs in Output path: ${outputPath}`);
            }
            else {
                const msg = "Output path is not specified. Unable to reuse previously compiled files. Verify could be slow. See README.";
                outputChannel_1.arduinoChannel.warning(msg);
            }
            outputChannel_1.arduinoChannel.show();
            // we need to return the result of verify
            try {
                yield util.spawn(this._settings.commandPath, outputChannel_1.arduinoChannel.channel, args);
                outputChannel_1.arduinoChannel.end(`Finished verify sketch - ${dc.sketch}${os.EOL}`);
                return true;
            }
            catch (reason) {
                outputChannel_1.arduinoChannel.error(`Exit with code=${reason.code}${os.EOL}`);
                return false;
            }
        });
    }
    // Add selected library path to the intellisense search path.
    addLibPath(libraryPath) {
        let libPaths;
        if (libraryPath) {
            libPaths = [libraryPath];
        }
        else {
            libPaths = this.getDefaultPackageLibPaths();
        }
        const defaultForcedInclude = this.getDefaultForcedIncludeFiles();
        if (!workspace_1.ArduinoWorkspace.rootPath) {
            return;
        }
        const configFilePath = path.join(workspace_1.ArduinoWorkspace.rootPath, constants.CPP_CONFIG_FILE);
        let deviceContext = null;
        if (!util.fileExistsSync(configFilePath)) {
            util.mkdirRecursivelySync(path.dirname(configFilePath));
            deviceContext = {};
        }
        else {
            deviceContext = util.tryParseJSON(fs.readFileSync(configFilePath, "utf8"));
        }
        if (!deviceContext) {
            Logger.notifyAndThrowUserError("arduinoFileError", new Error(constants.messages.ARDUINO_FILE_ERROR));
        }
        deviceContext.configurations = deviceContext.configurations || [];
        let configSection = null;
        deviceContext.configurations.forEach((section) => {
            if (section.name === util.getCppConfigPlatform()) {
                configSection = section;
            }
        });
        if (!configSection) {
            configSection = {
                name: util.getCppConfigPlatform(),
                includePath: [],
            };
            deviceContext.configurations.push(configSection);
        }
        libPaths.forEach((childLibPath) => {
            childLibPath = path.resolve(path.normalize(childLibPath));
            if (configSection.includePath && configSection.includePath.length) {
                for (const existingPath of configSection.includePath) {
                    if (childLibPath === path.resolve(path.normalize(existingPath))) {
                        return;
                    }
                }
            }
            else {
                configSection.includePath = [];
            }
            configSection.includePath.unshift(childLibPath);
        });
        if (!configSection.forcedInclude) {
            configSection.forcedInclude = defaultForcedInclude;
        }
        else {
            for (let i = 0; i < configSection.forcedInclude.length; i++) {
                if (/arduino\.h$/i.test(configSection.forcedInclude[i])) {
                    configSection.forcedInclude.splice(i, 1);
                    i--;
                }
            }
            configSection.forcedInclude = defaultForcedInclude.concat(configSection.forcedInclude);
        }
        fs.writeFileSync(configFilePath, JSON.stringify(deviceContext, null, 4));
    }
    // Include the *.h header files from selected library to the arduino sketch.
    includeLibrary(libraryPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!workspace_1.ArduinoWorkspace.rootPath) {
                return;
            }
            const dc = deviceContext_1.DeviceContext.getInstance();
            const appPath = path.join(workspace_1.ArduinoWorkspace.rootPath, dc.sketch);
            if (util.fileExistsSync(appPath)) {
                const hFiles = glob.sync(`${libraryPath}/*.h`, {
                    nodir: true,
                    matchBase: true,
                });
                const hIncludes = hFiles.map((hFile) => {
                    return `#include <${path.basename(hFile)}>`;
                }).join(os.EOL);
                // Open the sketch and bring up it to current visible view.
                const textDocument = yield vscode.workspace.openTextDocument(appPath);
                yield vscode.window.showTextDocument(textDocument, vscode.ViewColumn.One, true);
                const activeEditor = vscode.window.visibleTextEditors.find((textEditor) => {
                    return path.resolve(textEditor.document.fileName) === path.resolve(appPath);
                });
                if (activeEditor) {
                    // Insert *.h at the beginning of the sketch code.
                    yield activeEditor.edit((editBuilder) => {
                        editBuilder.insert(new vscode.Position(0, 0), `${hIncludes}${os.EOL}${os.EOL}`);
                    });
                }
            }
        });
    }
    /**
     * Install arduino board package based on package name and platform hardware architecture.
     */
    installBoard(packageName, arch = "", version = "", showOutput = true) {
        return __awaiter(this, void 0, void 0, function* () {
            outputChannel_1.arduinoChannel.show();
            const updatingIndex = packageName === "dummy" && !arch && !version;
            if (updatingIndex) {
                outputChannel_1.arduinoChannel.start(`Update package index files...`);
            }
            else {
                try {
                    const packagePath = path.join(this._settings.packagePath, "packages", packageName);
                    if (util.directoryExistsSync(packagePath)) {
                        util.rmdirRecursivelySync(packagePath);
                    }
                    outputChannel_1.arduinoChannel.start(`Install package - ${packageName}...`);
                }
                catch (error) {
                    outputChannel_1.arduinoChannel.start(`Install package - ${packageName} failed under directory : ${error.path}${os.EOL}
Please make sure the folder is not occupied by other procedures .`);
                    outputChannel_1.arduinoChannel.error(`Error message - ${error.message}${os.EOL}`);
                    outputChannel_1.arduinoChannel.error(`Exit with code=${error.code}${os.EOL}`);
                    return;
                }
            }
            try {
                yield util.spawn(this._settings.commandPath, showOutput ? outputChannel_1.arduinoChannel.channel : null, ["--install-boards", `${packageName}${arch && ":" + arch}${version && ":" + version}`]);
                if (updatingIndex) {
                    outputChannel_1.arduinoChannel.end("Updated package index files.");
                }
                else {
                    outputChannel_1.arduinoChannel.end(`Installed board package - ${packageName}${os.EOL}`);
                }
            }
            catch (error) {
                // If a platform with the same version is already installed, nothing is installed and program exits with exit code 1
                if (error.code === 1) {
                    if (updatingIndex) {
                        outputChannel_1.arduinoChannel.end("Updated package index files.");
                    }
                    else {
                        outputChannel_1.arduinoChannel.end(`Installed board package - ${packageName}${os.EOL}`);
                    }
                }
                else {
                    outputChannel_1.arduinoChannel.error(`Exit with code=${error.code}${os.EOL}`);
                }
            }
        });
    }
    uninstallBoard(boardName, packagePath) {
        outputChannel_1.arduinoChannel.start(`Uninstall board package - ${boardName}...`);
        util.rmdirRecursivelySync(packagePath);
        outputChannel_1.arduinoChannel.end(`Uninstalled board package - ${boardName}${os.EOL}`);
    }
    installLibrary(libName, version = "", showOutput = true) {
        return __awaiter(this, void 0, void 0, function* () {
            outputChannel_1.arduinoChannel.show();
            const updatingIndex = (libName === "dummy" && !version);
            if (updatingIndex) {
                outputChannel_1.arduinoChannel.start("Update library index files...");
            }
            else {
                outputChannel_1.arduinoChannel.start(`Install library - ${libName}`);
            }
            try {
                yield util.spawn(this._settings.commandPath, showOutput ? outputChannel_1.arduinoChannel.channel : null, ["--install-library", `${libName}${version && ":" + version}`]);
                if (updatingIndex) {
                    outputChannel_1.arduinoChannel.end("Updated library index files.");
                }
                else {
                    outputChannel_1.arduinoChannel.end(`Installed library - ${libName}${os.EOL}`);
                }
            }
            catch (error) {
                // If a library with the same version is already installed, nothing is installed and program exits with exit code 1
                if (error.code === 1) {
                    if (updatingIndex) {
                        outputChannel_1.arduinoChannel.end("Updated library index files.");
                    }
                    else {
                        outputChannel_1.arduinoChannel.end(`Installed library - ${libName}${os.EOL}`);
                    }
                }
                else {
                    outputChannel_1.arduinoChannel.error(`Exit with code=${error.code}${os.EOL}`);
                }
            }
        });
    }
    uninstallLibrary(libName, libPath) {
        outputChannel_1.arduinoChannel.start(`Remove library - ${libName}`);
        util.rmdirRecursivelySync(libPath);
        outputChannel_1.arduinoChannel.end(`Removed library - ${libName}${os.EOL}`);
    }
    getDefaultPackageLibPaths() {
        const result = [];
        const boardDescriptor = this._boardManager.currentBoard;
        if (!boardDescriptor) {
            return result;
        }
        const toolsPath = boardDescriptor.platform.rootBoardPath;
        result.push(path.normalize(path.join(toolsPath, "**")));
        // if (util.directoryExistsSync(path.join(toolsPath, "cores"))) {
        //     const coreLibs = fs.readdirSync(path.join(toolsPath, "cores"));
        //     if (coreLibs && coreLibs.length > 0) {
        //         coreLibs.forEach((coreLib) => {
        //             result.push(path.normalize(path.join(toolsPath, "cores", coreLib)));
        //         });
        //     }
        // }
        // return result;
        // <package>/hardware/<platform>/<version> -> <package>/tools
        const toolPath = path.join(toolsPath, "..", "..", "..", "tools");
        if (fs.existsSync(toolPath)) {
            result.push(path.normalize(path.join(toolPath, "**")));
        }
        return result;
    }
    getDefaultForcedIncludeFiles() {
        const result = [];
        const boardDescriptor = this._boardManager.currentBoard;
        if (!boardDescriptor) {
            return result;
        }
        const arduinoHeadFilePath = path.normalize(path.join(boardDescriptor.platform.rootBoardPath, "cores", "arduino", "Arduino.h"));
        if (fs.existsSync(arduinoHeadFilePath)) {
            result.push(arduinoHeadFilePath);
        }
        return result;
    }
    openExample(example) {
        function tmpName(name) {
            let counter = 0;
            let candidateName = name;
            while (true) {
                if (!util.fileExistsSync(candidateName) && !util.directoryExistsSync(candidateName)) {
                    return candidateName;
                }
                counter++;
                candidateName = `${name}_${counter}`;
            }
        }
        // Step 1: Copy the example project to a temporary directory.
        const sketchPath = path.join(this._settings.sketchbookPath, "generated_examples");
        if (!util.directoryExistsSync(sketchPath)) {
            util.mkdirRecursivelySync(sketchPath);
        }
        let destExample = "";
        if (util.directoryExistsSync(example)) {
            destExample = tmpName(path.join(sketchPath, path.basename(example)));
            util.cp(example, destExample);
        }
        else if (util.fileExistsSync(example)) {
            const exampleName = path.basename(example, path.extname(example));
            destExample = tmpName(path.join(sketchPath, exampleName));
            util.mkdirRecursivelySync(destExample);
            util.cp(example, path.join(destExample, path.basename(example)));
        }
        if (destExample) {
            // Step 2: Scaffold the example project to an arduino project.
            const items = fs.readdirSync(destExample);
            const sketchFile = items.find((item) => {
                return util.isArduinoFile(path.join(destExample, item));
            });
            if (sketchFile) {
                // Generate arduino.json
                const dc = deviceContext_1.DeviceContext.getInstance();
                const arduinoJson = {
                    sketch: sketchFile,
                    port: dc.port || "COM1",
                    board: dc.board,
                    configuration: dc.configuration,
                };
                const arduinoConfigFilePath = path.join(destExample, constants.ARDUINO_CONFIG_FILE);
                util.mkdirRecursivelySync(path.dirname(arduinoConfigFilePath));
                fs.writeFileSync(arduinoConfigFilePath, JSON.stringify(arduinoJson, null, 4));
                // Generate cpptools intellisense config
                const cppConfigFilePath = path.join(destExample, constants.CPP_CONFIG_FILE);
                // Current workspace
                let includePath = ["${workspaceRoot}"];
                // Defaut package for this board
                const defaultPackageLibPaths = this.getDefaultPackageLibPaths();
                includePath = includePath.concat(defaultPackageLibPaths);
                // Arduino built-in package tools
                includePath.push(path.join(this._settings.arduinoPath, "hardware", "tools", "**"));
                // Arduino built-in libraries
                includePath.push(path.join(this._settings.arduinoPath, "libraries", "**"));
                // Arduino custom package tools
                includePath.push(path.join(os.homedir(), "Documents", "Arduino", "hardware", "tools", "**"));
                // Arduino custom libraries
                includePath.push(path.join(os.homedir(), "Documents", "Arduino", "libraries", "**"));
                const forcedInclude = this.getDefaultForcedIncludeFiles();
                const defines = [
                    "ARDUINO=10800",
                ];
                const cppConfig = {
                    configurations: [{
                            name: util.getCppConfigPlatform(),
                            defines,
                            includePath,
                            forcedInclude,
                            intelliSenseMode: "clang-x64",
                            cStandard: "c11",
                            cppStandard: "c++17",
                        }],
                    version: 3,
                };
                util.mkdirRecursivelySync(path.dirname(cppConfigFilePath));
                fs.writeFileSync(cppConfigFilePath, JSON.stringify(cppConfig, null, 4));
            }
            // Step 3: Open the arduino project at a new vscode window.
            vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(destExample), true);
        }
        return destExample;
    }
    get settings() {
        return this._settings;
    }
    get boardManager() {
        return this._boardManager;
    }
    set boardManager(value) {
        this._boardManager = value;
    }
    get libraryManager() {
        return this._libraryManager;
    }
    set libraryManager(value) {
        this._libraryManager = value;
    }
    get exampleManager() {
        return this._exampleManager;
    }
    set exampleManager(value) {
        this._exampleManager = value;
    }
    get programmerManager() {
        return this._programmerManager;
    }
    set programmerManager(value) {
        this._programmerManager = value;
    }
    getProgrammerString() {
        const selectProgrammer = this.programmerManager.currentProgrammer;
        if (!selectProgrammer) {
            Logger.notifyUserError("getProgrammerString", new Error(constants.messages.NO_PROGRAMMMER_SELECTED));
            return;
        }
        return selectProgrammer;
    }
    getBoardBuildString() {
        const selectedBoard = this.boardManager.currentBoard;
        if (!selectedBoard) {
            Logger.notifyUserError("getBoardBuildString", new Error(constants.messages.NO_BOARD_SELECTED));
            return;
        }
        return selectedBoard.getBuildConfig();
    }
    getMainSketch(dc) {
        return __awaiter(this, void 0, void 0, function* () {
            yield dc.resolveMainSketch();
            if (!dc.sketch) {
                vscode.window.showErrorMessage("No sketch file was found. Please specify the sketch in the arduino.json file");
                throw new Error("No sketch file was found.");
            }
        });
    }
}
exports.ArduinoApp = ArduinoApp;

//# sourceMappingURL=arduino.js.map
