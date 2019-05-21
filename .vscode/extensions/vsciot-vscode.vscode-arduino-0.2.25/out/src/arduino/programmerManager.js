"use strict";
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
const constants = require("../common/constants");
const deviceContext_1 = require("../deviceContext");
var ProgrammerList;
(function (ProgrammerList) {
    ProgrammerList[ProgrammerList["AVR ISP"] = 0] = "AVR ISP";
    ProgrammerList[ProgrammerList["AVRISP mkII"] = 1] = "AVRISP mkII";
    ProgrammerList[ProgrammerList["USBtinyISP"] = 2] = "USBtinyISP";
    ProgrammerList[ProgrammerList["ArduinoISP"] = 3] = "ArduinoISP";
    ProgrammerList[ProgrammerList["ArduinoISP.org"] = 4] = "ArduinoISP.org";
    ProgrammerList[ProgrammerList["USBasp"] = 5] = "USBasp";
    ProgrammerList[ProgrammerList["Parallel Programmer"] = 6] = "Parallel Programmer";
    ProgrammerList[ProgrammerList["Arduino as ISP"] = 7] = "Arduino as ISP";
    ProgrammerList[ProgrammerList["Arduino Gemma"] = 8] = "Arduino Gemma";
    ProgrammerList[ProgrammerList["BusPirate as ISP"] = 9] = "BusPirate as ISP";
    ProgrammerList[ProgrammerList["Atmel STK500 development board"] = 10] = "Atmel STK500 development board";
    ProgrammerList[ProgrammerList["Atmel JTAGICE3 (ISP mode)"] = 11] = "Atmel JTAGICE3 (ISP mode)";
    ProgrammerList[ProgrammerList["Atmel JTAGICE3 (JTAG mode)"] = 12] = "Atmel JTAGICE3 (JTAG mode)";
    ProgrammerList[ProgrammerList["Atmel-ICE (AVR)"] = 13] = "Atmel-ICE (AVR)";
})(ProgrammerList = exports.ProgrammerList || (exports.ProgrammerList = {}));
class ProgrammerManager {
    constructor(_settings, _arduinoApp) {
        this._settings = _settings;
        this._arduinoApp = _arduinoApp;
        this._programmerStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants.statusBarPriority.PROGRAMMER);
        this._programmerStatusBar.command = "arduino.selectProgrammer";
        this._programmerStatusBar.tooltip = "Select Programmer";
        this._programmerStatusBar.text = "<Select Programmer>";
        this._programmerStatusBar.show();
    }
    get currentProgrammer() {
        return this._programmervalue;
    }
    selectProgrammer() {
        return __awaiter(this, void 0, void 0, function* () {
            const chosen = yield vscode.window.showQuickPick(Object.keys(ProgrammerList)
                .filter((key) => {
                return !isNaN(Number(ProgrammerList[key]));
            }), { placeHolder: "Select programmer" });
            if (!chosen) {
                return;
            }
            this._currentprogrammer = ProgrammerList[chosen];
            this.getProgrammer(this._currentprogrammer);
            this._programmerStatusBar.text = chosen;
            const dc = deviceContext_1.DeviceContext.getInstance();
            dc.programmer = chosen;
        });
    }
    getProgrammer(newProgrammer) {
        switch (newProgrammer) {
            case ProgrammerList["AVR ISP"]:
                this._programmervalue = "arduino:avrisp";
                break;
            case ProgrammerList["AVRISP mkII"]:
                this._programmervalue = "arduino:avrispmkii";
                break;
            case ProgrammerList.USBtinyISP:
                this._programmervalue = "arduino:usbtinyisp";
                break;
            case ProgrammerList.ArduinoISP:
                this._programmervalue = "arduino:arduinoisp";
                break;
            case ProgrammerList.USBasp:
                this._programmervalue = "arduino:usbasp";
                break;
            case ProgrammerList["Parallel Programmer"]:
                this._programmervalue = "arduino:parallel";
                break;
            case ProgrammerList["Arduino as ISP"]:
                this._programmervalue = "arduino:arduinoasisp";
                break;
            case ProgrammerList["Arduino Gemma"]:
                this._programmervalue = "arduino:usbGemma";
                break;
            case ProgrammerList["BusPirate as ISP"]:
                this._programmervalue = "arduino:buspirate";
                break;
            case ProgrammerList["Atmel STK500 development board"]:
                this._programmervalue = "arduino:stk500";
                break;
            case ProgrammerList["Atmel JTAGICE3 (ISP mode)"]:
                this._programmervalue = "arduino:jtag3isp";
                break;
            case ProgrammerList["Atmel JTAGICE3 (JTAG mode)"]:
                this._programmervalue = "arduino:jtag3";
                break;
            case ProgrammerList["Atmel-ICE (AVR)"]:
                this._programmervalue = "arduino:atmel_ice";
                break;
            default:
                break;
        }
    }
}
ProgrammerManager._programmerManager = null;
exports.ProgrammerManager = ProgrammerManager;

//# sourceMappingURL=programmerManager.js.map
