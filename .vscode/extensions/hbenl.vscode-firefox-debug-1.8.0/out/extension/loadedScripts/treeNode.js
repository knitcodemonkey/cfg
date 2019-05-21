"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class TreeNode {
    constructor(label, parent, collapsibleState = vscode.TreeItemCollapsibleState.Collapsed) {
        this.parent = parent;
        this.treeItem = new vscode.TreeItem(label, collapsibleState);
    }
    getFullPath() {
        return '';
    }
}
exports.TreeNode = TreeNode;
//# sourceMappingURL=treeNode.js.map