"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const vscode = require("vscode");
const vscode_express_1 = require("vscode-express");
const ArduinoPackageManager_1 = require("./ArduinoPackageManager");
const boardProvider_1 = require("./boardProvider");
const configHandler_1 = require("./configHandler");
const constants_1 = require("./constants");
const telemetry_1 = require("./telemetry");
class UsbDetector {
    constructor(context, channel) {
        this.context = context;
        this.channel = channel;
    }
    getBoardFromDeviceInfo(device) {
        if (device.vendorId && device.productId) {
            const boardProvider = new boardProvider_1.BoardProvider(this.context);
            const board = boardProvider.find({ vendorId: device.vendorId, productId: device.productId });
            return board;
        }
        return undefined;
    }
    showLandingPage(device) {
        // if current workspace is iot device workbench workspace
        // we shouldn't popup landing page
        // if (vscode.workspace.workspaceFolders &&
        //     vscode.workspace.workspaceFolders.length) {
        //   const devicePath = ConfigHandler.get<string>(ConfigKey.devicePath);
        //   if (devicePath) {
        //     const deviceLocation = path.join(
        //         vscode.workspace.workspaceFolders[0].uri.fsPath, '..',
        //         devicePath, constants.iotworkbenchprojectFileName);
        //     if (fs.existsSync(deviceLocation)) {
        //       return;
        //     }
        //   }
        // }
        const board = this.getBoardFromDeviceInfo(device);
        if (board) {
            telemetry_1.callWithTelemetry(constants_1.EventNames.detectBoard, this.channel, false, this.context, () => __awaiter(this, void 0, void 0, function* () {
                if (board.exampleUrl) {
                    ArduinoPackageManager_1.ArduinoPackageManager.installBoard(board);
                    const exampleUrl = 'example.html?board=' + board.id +
                        '&url=' + encodeURIComponent(board.exampleUrl || '');
                    UsbDetector._vscexpress = UsbDetector._vscexpress ||
                        new vscode_express_1.VSCExpress(this.context, 'views');
                    UsbDetector._vscexpress.open(exampleUrl, 'Examples - Azure IoT Device Workbench', vscode.ViewColumn.One, {
                        enableScripts: true,
                        enableCommandUris: true,
                        retainContextWhenHidden: true
                    });
                }
            }), { board: board.name });
        }
    }
    startListening() {
        return __awaiter(this, void 0, void 0, function* () {
            const disableUSBDetection = configHandler_1.ConfigHandler.get('disableAutoPopupLandingPage');
            if (os.platform() === 'linux' || disableUSBDetection) {
                return;
            }
            if (!UsbDetector._usbDetector) {
                return;
            }
            const devices = yield UsbDetector._usbDetector.find();
            if (devices) {
                const uniqueDevices = [];
                devices.forEach(device => {
                    if (uniqueDevices.findIndex(item => item.vendorId === device.vendorId &&
                        item.productId === device.productId) < 0) {
                        uniqueDevices.push(device);
                    }
                });
                uniqueDevices.forEach(this.showLandingPage.bind(this));
            }
            UsbDetector._usbDetector.on('add', this.showLandingPage.bind(this));
        });
    }
}
// tslint:disable-next-line: no-any
UsbDetector._usbDetector = require('../vendor/node-usb-native').detector;
exports.UsbDetector = UsbDetector;
//# sourceMappingURL=usbDetector.js.map