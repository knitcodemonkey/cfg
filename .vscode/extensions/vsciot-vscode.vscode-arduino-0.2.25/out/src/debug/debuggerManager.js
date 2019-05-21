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
const vscode = require("vscode");
const platform = require("../common/platform");
const util = require("../common/util");
const deviceContext_1 = require("../deviceContext");
class DebuggerManager {
    constructor(_extensionRoot, _arduinoSettings, _boardManager) {
        this._extensionRoot = _extensionRoot;
        this._arduinoSettings = _arduinoSettings;
        this._boardManager = _boardManager;
        this._debuggerMappings = {};
        this._debuggerBoardMappings = {};
    }
    initialize() {
        const debugFileContent = fs.readFileSync(path.join(this._extensionRoot, "misc", "debuggerUsbMapping.json"), "utf8");
        const usbFileContent = fs.readFileSync(path.join(this._extensionRoot, "misc", "usbmapping.json"), "utf8");
        for (const _debugger of JSON.parse(debugFileContent)) {
            if (Array.isArray(_debugger.pid)) {
                for (const pid of _debugger.pid) {
                    this._debuggerMappings[`${pid}%${_debugger.vid}`] = Object.assign({}, _debugger, { pid, vid: _debugger.vid });
                }
            }
            else {
                this._debuggerMappings[`${_debugger.pid}%${_debugger.vid}`] = Object.assign({}, _debugger, { pid: _debugger.pid, vid: _debugger.vid });
            }
        }
        for (const config of JSON.parse(usbFileContent)) {
            for (const board of config.boards) {
                if (board.interface || board.target) {
                    this._debuggerBoardMappings[[board.package, board.architecture, board.id].join(":")] = board;
                }
            }
        }
        this._usbDetector = require("../../../vendor/node-usb-native").detector;
        this._debugServerPath = platform.findFile(platform.getExecutableFileName("openocd"), path.join(this._arduinoSettings.packagePath, "packages"));
        if (!util.fileExistsSync(this._debugServerPath)) {
            this._debugServerPath = "";
        }
        this._miDebuggerPath = platform.findFile(platform.getExecutableFileName("arm-none-eabi-gdb"), path.join(this._arduinoSettings.packagePath, "packages"));
        if (!util.fileExistsSync(this._miDebuggerPath)) {
            this._miDebuggerPath = "";
        }
    }
    get miDebuggerPath() {
        return this._miDebuggerPath;
    }
    get debugServerPath() {
        return this._debugServerPath;
    }
    listDebuggers() {
        return __awaiter(this, void 0, void 0, function* () {
            const usbDeviceList = yield this._usbDetector.find();
            const keys = [];
            const results = [];
            usbDeviceList.forEach((device) => {
                if (device.vendorId && device.productId) {
                    /* tslint:disable:max-line-length*/
                    const key = util.convertToHex(device.productId, 4) + "%" + util.convertToHex(device.vendorId, 4);
                    const relatedDebugger = this._debuggerMappings[key];
                    if (relatedDebugger && keys.indexOf(key) < 0) {
                        keys.push(key);
                        results.push(relatedDebugger);
                    }
                }
            });
            return results;
        });
    }
    resolveOpenOcdOptions(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const board = this._boardManager.currentBoard.key;
            const debugConfig = this._debuggerBoardMappings[board];
            const dc = deviceContext_1.DeviceContext.getInstance();
            const debuggerConfigured = dc.debugger_;
            if (!debugConfig) {
                throw new Error(`Debug for board ${this._boardManager.currentBoard.name} is not supported by now.`);
            }
            let resolvedDebugger;
            const debuggers = yield this.listDebuggers();
            if (!debuggers.length) {
                throw new Error(`No supported debuggers are connected.`);
            }
            // rule 1: if this board has debuggers, use its own debugger
            if (debugConfig.interface) {
                resolvedDebugger = debuggers.find((_debugger) => {
                    return _debugger.short_name === debugConfig.interface || _debugger.config_file === debugConfig.interface;
                });
                if (!resolvedDebugger) {
                    throw new Error(`Debug port for board ${this._boardManager.currentBoard.name} is not connected.`);
                }
            }
            // rule 2: if there is only one debugger, use the only debugger
            if (!resolvedDebugger && !debuggerConfigured && debuggers.length === 1) {
                resolvedDebugger = debuggers[0];
            }
            // rule 3: if there is any configuration about debugger, use this configuration
            if (!resolvedDebugger && debuggerConfigured) {
                resolvedDebugger = debuggers.find((_debugger) => {
                    return _debugger.short_name === debuggerConfigured || _debugger.config_file === debuggerConfigured;
                });
            }
            if (!resolvedDebugger) {
                const chosen = yield vscode.window.showQuickPick(debuggers.map((l) => {
                    return {
                        description: `(0x${l.vid}:0x${l.pid})`,
                        label: l.name,
                    };
                }).sort((a, b) => {
                    return a.label === b.label ? 0 : (a.label > b.label ? 1 : -1);
                }), { placeHolder: "Select a debugger" });
                if (chosen && chosen.label) {
                    resolvedDebugger = debuggers.find((_debugger) => _debugger.name === chosen.label);
                    if (resolvedDebugger) {
                        dc.debugger_ = resolvedDebugger.config_file;
                    }
                }
                if (!resolvedDebugger) {
                    return "";
                }
            }
            const debugServerPath = config.debugServerPath;
            let scriptsFolder = path.join(path.dirname(debugServerPath), "../scripts/");
            if (!util.directoryExistsSync(scriptsFolder)) {
                scriptsFolder = path.join(path.dirname(debugServerPath), "../share/openocd/scripts/");
            }
            if (!util.directoryExistsSync(scriptsFolder)) {
                throw new Error("Cannot find scripts folder from openocd.");
            }
            // TODO: need to config gdb port other than hard-coded 3333
            if (resolvedDebugger.config_file.includes("jlink")) {
                // only swd is supported now
                /* tslint:disable:max-line-length*/
                return `-s ${scriptsFolder} -f interface/${resolvedDebugger.config_file} -c "transport select swd" -f target/${debugConfig.target} -c "telnet_port disabled" -c "tcl_port disabled"`;
            }
            /* tslint:disable:max-line-length*/
            return `-s ${scriptsFolder} -f interface/${resolvedDebugger.config_file} -f target/${debugConfig.target} -c "telnet_port disabled" -c "tcl_port disabled"`;
        });
    }
}
exports.DebuggerManager = DebuggerManager;

//# sourceMappingURL=debuggerManager.js.map
