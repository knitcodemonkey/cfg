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
const vscode = require("vscode");
const arduino_1 = require("./arduino/arduino");
const arduinoSettings_1 = require("./arduino/arduinoSettings");
const boardManager_1 = require("./arduino/boardManager");
const exampleManager_1 = require("./arduino/exampleManager");
const exampleProvider_1 = require("./arduino/exampleProvider");
const libraryManager_1 = require("./arduino/libraryManager");
const programmerManager_1 = require("./arduino/programmerManager");
const arduinoContext_1 = require("./arduinoContext");
const deviceContext_1 = require("./deviceContext");
class ArduinoActivator {
    activate() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._initializePromise) {
                yield this._initializePromise;
                return;
            }
            this._initializePromise = (() => __awaiter(this, void 0, void 0, function* () {
                const arduinoSettings = new arduinoSettings_1.ArduinoSettings();
                yield arduinoSettings.initialize();
                const arduinoApp = new arduino_1.ArduinoApp(arduinoSettings);
                yield arduinoApp.initialize();
                // TODO: After use the device.json config, should remove the dependency on the ArduinoApp object.
                const deviceContext = deviceContext_1.DeviceContext.getInstance();
                yield deviceContext.loadContext();
                // Show sketch status bar, and allow user to change sketch in config file
                deviceContext.showStatusBar();
                // Arduino board manager & library manager
                arduinoApp.boardManager = new boardManager_1.BoardManager(arduinoSettings, arduinoApp);
                arduinoContext_1.default.boardManager = arduinoApp.boardManager;
                yield arduinoApp.boardManager.loadPackages();
                arduinoApp.libraryManager = new libraryManager_1.LibraryManager(arduinoSettings, arduinoApp);
                arduinoApp.exampleManager = new exampleManager_1.ExampleManager(arduinoSettings, arduinoApp);
                arduinoApp.programmerManager = new programmerManager_1.ProgrammerManager(arduinoSettings, arduinoApp);
                arduinoContext_1.default.arduinoApp = arduinoApp;
                const exampleProvider = new exampleProvider_1.ExampleProvider(arduinoApp.exampleManager, arduinoApp.boardManager);
                vscode.window.registerTreeDataProvider("arduinoExampleExplorer", exampleProvider);
            }))();
            yield this._initializePromise;
        });
    }
}
exports.default = new ArduinoActivator();

//# sourceMappingURL=arduinoActivator.js.map
