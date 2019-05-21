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
const path = require("path");
const vscode = require("vscode");
const arduinoActivator_1 = require("../arduinoActivator");
const arduinoContext_1 = require("../arduinoContext");
const vscodeSettings_1 = require("../arduino/vscodeSettings");
const platform = require("../common/platform");
const util = require("../common/util");
const workspace_1 = require("../common/workspace");
const deviceContext_1 = require("../deviceContext");
const Logger = require("../logger/logger");
class ArduinoDebugConfigurationProvider {
    constructor() { }
    provideDebugConfigurations(folder, token) {
        return [
            this.getDefaultDebugSettings(folder),
        ];
    }
    // Try to add all missing attributes to the debug configuration being launched.
    resolveDebugConfiguration(folder, config, token) {
        if (!config || !config.request) {
            config = this.getDefaultDebugSettings(folder);
        }
        return this.resolveDebugConfigurationAsync(config);
    }
    getDefaultDebugSettings(folder) {
        return {
            name: "Arduino",
            type: "arduino",
            request: "launch",
            program: "${file}",
            cwd: "${workspaceFolder}",
            MIMode: "gdb",
            targetArchitecture: "arm",
            miDebuggerPath: "",
            debugServerPath: "",
            debugServerArgs: "",
            customLaunchSetupCommands: [
                {
                    text: "target remote localhost:3333",
                },
                {
                    text: "file \"${file}\"",
                },
                {
                    text: "load",
                },
                {
                    text: "monitor reset halt",
                },
                {
                    text: "monitor reset init",
                },
            ],
            stopAtEntry: true,
            serverStarted: "Info\\ :\\ [\\w\\d\\.]*:\\ hardware",
            launchCompleteCommand: "exec-continue",
            filterStderr: true,
            args: [],
        };
    }
    resolveDebugConfigurationAsync(config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!arduinoContext_1.default.initialized) {
                yield arduinoActivator_1.default.activate();
            }
            if (vscodeSettings_1.VscodeSettings.getInstance().logLevel === "verbose" && !config.logging) {
                config = Object.assign({}, config, { logging: {
                        engineLogging: true,
                    } });
            }
            if (!arduinoContext_1.default.boardManager.currentBoard) {
                vscode.window.showErrorMessage("Please select a board.");
                return undefined;
            }
            if (!this.resolveOpenOcd(config)) {
                return undefined;
            }
            if (!(yield this.resolveOpenOcdOptions(config))) {
                return undefined;
            }
            if (!this.resolveDebuggerPath(config)) {
                return undefined;
            }
            if (!(yield this.resolveProgramPath(config))) {
                return undefined;
            }
            // Use the C++ debugger MIEngine as the real internal debugger
            config.type = "cppdbg";
            const dc = deviceContext_1.DeviceContext.getInstance();
            Logger.traceUserData("start-cppdbg", { board: dc.board });
            return config;
        });
    }
    resolveProgramPath(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const dc = deviceContext_1.DeviceContext.getInstance();
            if (!config.program || config.program === "${file}") {
                // make a unique temp folder because keeping same temp folder will corrupt the build when board is changed
                const outputFolder = path.join(dc.output || `.build`, arduinoContext_1.default.boardManager.currentBoard.board);
                util.mkdirRecursivelySync(path.join(workspace_1.ArduinoWorkspace.rootPath, outputFolder));
                if (!dc.sketch || !util.fileExistsSync(path.join(workspace_1.ArduinoWorkspace.rootPath, dc.sketch))) {
                    yield dc.resolveMainSketch();
                }
                if (!dc.sketch) {
                    vscode.window.showErrorMessage("No sketch file was found. Please specify the sketch in the arduino.json file");
                    return false;
                }
                if (!util.fileExistsSync(path.join(workspace_1.ArduinoWorkspace.rootPath, dc.sketch))) {
                    vscode.window.showErrorMessage(`Cannot find ${dc.sketch}, Please specify the sketch in the arduino.json file`);
                    return false;
                }
                config.program = path.join(workspace_1.ArduinoWorkspace.rootPath, outputFolder, `${path.basename(dc.sketch)}.elf`);
                // always compile elf to make sure debug the right elf
                if (!(yield arduinoContext_1.default.arduinoApp.verify(outputFolder))) {
                    vscode.window.showErrorMessage("Failure to verify the program, please check output for details.");
                    return false;
                }
                config.program = config.program.replace(/\\/g, "/");
                config.customLaunchSetupCommands.forEach((obj) => {
                    if (obj.text && obj.text.indexOf("${file}") > 0) {
                        obj.text = obj.text.replace(/\$\{file\}/, config.program);
                    }
                });
            }
            if (!util.fileExistsSync(config.program)) {
                vscode.window.showErrorMessage("Cannot find the elf file.");
                return false;
            }
            return true;
        });
    }
    resolveDebuggerPath(config) {
        if (!config.miDebuggerPath) {
            config.miDebuggerPath = platform.findFile(platform.getExecutableFileName("arm-none-eabi-gdb"), path.join(arduinoContext_1.default.arduinoApp.settings.packagePath, "packages", arduinoContext_1.default.boardManager.currentBoard.getPackageName()));
        }
        if (!util.fileExistsSync(config.miDebuggerPath)) {
            config.miDebuggerPath = arduinoContext_1.default.debuggerManager.miDebuggerPath;
        }
        if (!util.fileExistsSync(config.miDebuggerPath)) {
            vscode.window.showErrorMessage("Cannot find the debugger path.");
            return false;
        }
        return true;
    }
    resolveOpenOcd(config) {
        if (!config.debugServerPath) {
            config.debugServerPath = platform.findFile(platform.getExecutableFileName("openocd"), path.join(arduinoContext_1.default.arduinoApp.settings.packagePath, "packages", arduinoContext_1.default.boardManager.currentBoard.getPackageName()));
        }
        if (!util.fileExistsSync(config.debugServerPath)) {
            config.debugServerPath = arduinoContext_1.default.debuggerManager.debugServerPath;
        }
        if (!util.fileExistsSync(config.debugServerPath)) {
            vscode.window.showErrorMessage("Cannot find the OpenOCD from the launch.json debugServerPath property." +
                "Please input the right path of OpenOCD");
            return false;
        }
        return true;
    }
    resolveOpenOcdOptions(config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (config.debugServerPath && !config.debugServerArgs) {
                try {
                    config.debugServerArgs = yield arduinoContext_1.default.debuggerManager.resolveOpenOcdOptions(config);
                    if (!config.debugServerArgs) {
                        return false;
                    }
                }
                catch (error) {
                    vscode.window.showErrorMessage(error.message);
                    return false;
                }
            }
            return true;
        });
    }
}
exports.ArduinoDebugConfigurationProvider = ArduinoDebugConfigurationProvider;

//# sourceMappingURL=configurationProvider.js.map
