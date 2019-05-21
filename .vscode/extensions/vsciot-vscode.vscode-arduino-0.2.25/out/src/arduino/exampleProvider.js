"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const deviceContext_1 = require("../deviceContext");
class ExampleProvider {
    constructor(_exampleManager, _boardManager) {
        this._exampleManager = _exampleManager;
        this._boardManager = _boardManager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        // tslint:disable-next-line:member-ordering
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this._exmaples = null;
        this._boardManager.onBoardTypeChanged(() => {
            this.loadData();
        });
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!this._exmaples) {
            this.loadData();
            return null;
        }
        if (!element) {
            return this.createExampleItemList(this._exmaples);
        }
        else {
            return this.createExampleItemList(element.getChildren());
        }
    }
    loadData() {
        this._exmaples = null;
        this._exampleManager.loadExamples().then((examples) => {
            this._exmaples = examples;
            this._onDidChangeTreeData.fire();
        });
    }
    createExampleItemList(examples) {
        const result = [];
        if (examples && examples.length) {
            examples.forEach((example) => {
                result.push(new ExampleItem(example));
            });
        }
        return result;
    }
}
exports.ExampleProvider = ExampleProvider;
class ExampleItem extends vscode.TreeItem {
    constructor(_example) {
        super(_example.name, _example.isLeaf ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
        this._example = _example;
        if (_example.isLeaf) {
            this.command = {
                title: "Open Example",
                command: "arduino.openExample",
                arguments: [_example.path],
            };
            this.iconPath = ExampleItem.getInoIcon();
        }
        else {
            this.iconPath = ExampleItem.getFolderIcon();
        }
    }
    static getFolderIcon() {
        if (!ExampleItem._folderIcon) {
            ExampleItem._folderIcon = {
                light: ExampleItem.getIconUri("Folder_16x.svg"),
                dark: ExampleItem.getIconUri("Folder_16x_inverse.svg"),
            };
        }
        return ExampleItem._folderIcon;
    }
    static getInoIcon() {
        if (!ExampleItem._inoIcon) {
            ExampleItem._inoIcon = ExampleItem.getIconUri("ino_16x.svg");
        }
        return ExampleItem._inoIcon;
    }
    static getIconUri(uriPath) {
        const dc = deviceContext_1.DeviceContext.getInstance();
        return vscode.Uri.file(path.join(dc.extensionPath, "images/examples", uriPath));
    }
    getChildren() {
        return this._example.children;
    }
}

//# sourceMappingURL=exampleProvider.js.map
