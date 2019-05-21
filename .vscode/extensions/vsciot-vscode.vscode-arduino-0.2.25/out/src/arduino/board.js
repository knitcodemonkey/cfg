"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
const deviceContext_1 = require("../deviceContext");
function parseBoardDescriptor(boardDescriptor, plat) {
    const boardLineRegex = /([^\.]+)\.(\S+)=(.+)/;
    const result = new Map();
    const lines = boardDescriptor.split(/[\r|\r\n|\n]/);
    const menuMap = new Map();
    lines.forEach((line) => {
        // Ignore comments.
        if (line.startsWith("#")) {
            return;
        }
        const match = boardLineRegex.exec(line);
        if (match && match.length > 3) {
            if (line.startsWith("menu.")) {
                menuMap.set(match[2], match[3]);
                return;
            }
            let boardObject = result.get(match[1]);
            if (!boardObject) {
                boardObject = new Board(match[1], plat, menuMap);
                result.set(boardObject.board, boardObject);
            }
            if (match[2] === "name") {
                boardObject.name = match[3].trim();
            }
            else {
                boardObject.addParameter(match[2], match[3]);
            }
        }
    });
    return result;
}
exports.parseBoardDescriptor = parseBoardDescriptor;
const MENU_REGEX = /menu\.([^\.]+)\.([^\.]+)(\.?(\S+)?)/;
class Board {
    constructor(_board, _platform, _menuMap) {
        this._board = _board;
        this._platform = _platform;
        this._menuMap = _menuMap;
        this._configItems = [];
    }
    get board() {
        return this._board;
    }
    get platform() {
        return this._platform;
    }
    addParameter(key, value) {
        const match = key.match(MENU_REGEX);
        if (match) {
            const existingItem = this._configItems.find((item) => item.id === match[1]);
            if (existingItem) {
                if (!existingItem.selectedOption) {
                    existingItem.selectedOption = match[2];
                }
                const existingOption = existingItem.options.find((opt) => opt.id === match[2]);
                if (!existingOption) {
                    existingItem.options.push({ id: match[2], displayName: value });
                }
            }
            else {
                this._configItems.push({
                    displayName: this._menuMap.get(match[1]),
                    id: match[1],
                    selectedOption: match[2],
                    options: [{ id: match[2], displayName: value }],
                });
            }
        }
    }
    getBuildConfig() {
        return `${this.getPackageName()}:${this.platform.architecture}:${this.board}${this.customConfig ? ":" + this.customConfig : ""}`;
    }
    /**
     * @returns {string} Return board key in format packageName:arch:boardName
     */
    get key() {
        return `${this.getPackageName()}:${this.platform.architecture}:${this.board}`;
    }
    get customConfig() {
        if (this._configItems && this._configItems.length > 0) {
            return this._configItems.map((configItem) => `${configItem.id}=${configItem.selectedOption}`).join(",");
        }
    }
    get configItems() {
        return this._configItems;
    }
    loadConfig(configString) {
        const configSections = configString.split(",");
        const keyValueRegex = /(\S+)=(\S+)/;
        configSections.forEach((configSection) => {
            const match = configSection.match(keyValueRegex);
            if (match && match.length >= 2) {
                this.updateConfig(match[1], match[2]);
            }
        });
    }
    updateConfig(configId, optionId) {
        const targetConfig = this._configItems.find((config) => config.id === configId);
        if (!targetConfig) {
            return false;
        }
        if (targetConfig.selectedOption !== optionId) {
            targetConfig.selectedOption = optionId;
            const dc = deviceContext_1.DeviceContext.getInstance();
            dc.configuration = this.customConfig;
            return true;
        }
        return false;
    }
    getPackageName() {
        return this.platform.packageName ? this.platform.packageName : this.platform.package.name;
    }
}
exports.Board = Board;

//# sourceMappingURL=board.js.map
