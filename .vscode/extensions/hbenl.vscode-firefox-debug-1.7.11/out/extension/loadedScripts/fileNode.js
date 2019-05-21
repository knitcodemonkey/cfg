"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const treeNode_1 = require("./treeNode");
class FileNode extends treeNode_1.TreeNode {
    constructor(filename, sourceInfo, parent, sessionId) {
        super((filename.length > 0) ? filename : '(index)', parent, vscode.TreeItemCollapsibleState.None);
        this.treeItem.contextValue = 'file';
        let pathOrUri;
        if (sourceInfo.path) {
            pathOrUri = sourceInfo.path;
        }
        else {
            pathOrUri = `debug:${encodeURIComponent(sourceInfo.url)}?session=${encodeURIComponent(sessionId)}&ref=${sourceInfo.sourceId}`;
        }
        this.treeItem.command = {
            command: 'extension.firefox.openScript',
            arguments: [pathOrUri],
            title: ''
        };
    }
    getChildren() {
        return [];
    }
    getFullPath() {
        return this.parent.getFullPath() + this.treeItem.label;
    }
}
exports.FileNode = FileNode;
//# sourceMappingURL=fileNode.js.map