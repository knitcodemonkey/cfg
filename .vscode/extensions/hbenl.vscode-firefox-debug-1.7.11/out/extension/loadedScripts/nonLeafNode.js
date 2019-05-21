"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const treeNode_1 = require("./treeNode");
const fileNode_1 = require("./fileNode");
class NonLeafNode extends treeNode_1.TreeNode {
    constructor(label, parent) {
        super(label, parent);
        this.children = [];
    }
    addSource(filename, path, sourceInfo, sessionId) {
        if (path.length === 0) {
            this.addChild(new fileNode_1.FileNode(filename, sourceInfo, this, sessionId));
            return this;
        }
        let itemIndex = this.children.findIndex((item) => ((item instanceof DirectoryNode) && (item.path[0] === path[0])));
        if (itemIndex < 0) {
            let directoryItem = new DirectoryNode(path, this);
            directoryItem.addSource(filename, [], sourceInfo, sessionId);
            this.addChild(directoryItem);
            return this;
        }
        let item = this.children[itemIndex];
        let pathMatchLength = path.findIndex((pathElement, index) => ((index >= item.path.length) || (item.path[index] !== pathElement)));
        if (pathMatchLength < 0)
            pathMatchLength = path.length;
        let pathRest = path.slice(pathMatchLength);
        if (pathMatchLength === item.path.length) {
            return item.addSource(filename, pathRest, sourceInfo, sessionId);
        }
        item.split(pathMatchLength);
        item.addSource(filename, pathRest, sourceInfo, sessionId);
        return item;
    }
    getChildren() {
        this.treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        return this.children;
    }
    addChild(newChild) {
        let index;
        if (newChild instanceof DirectoryNode) {
            index = this.children.findIndex((child) => !((child instanceof DirectoryNode) &&
                (child.treeItem.label < newChild.treeItem.label)));
        }
        else {
            index = this.children.findIndex((child) => ((child instanceof fileNode_1.FileNode) &&
                (child.treeItem.label >= newChild.treeItem.label)));
        }
        if (index >= 0) {
            if (this.children[index].treeItem.label !== newChild.treeItem.label) {
                this.children.splice(index, 0, newChild);
            }
        }
        else {
            this.children.push(newChild);
        }
    }
}
exports.NonLeafNode = NonLeafNode;
class ThreadNode extends NonLeafNode {
    constructor(threadInfo, parent) {
        super(threadInfo.name, parent);
        this.id = threadInfo.id;
        this.treeItem.contextValue = 'thread';
    }
    removeSources() {
        this.children = [];
        return this;
    }
}
exports.ThreadNode = ThreadNode;
class DirectoryNode extends NonLeafNode {
    constructor(path, parent) {
        super(path.join('/'), parent);
        this.path = path;
        this.treeItem.contextValue = 'directory';
    }
    split(atIndex) {
        let newChild = new DirectoryNode(this.path.slice(atIndex), this);
        newChild.children = this.children;
        newChild.children.map(grandChild => grandChild.parent = newChild);
        this.path.splice(atIndex);
        this.children = [newChild];
        this.treeItem.label = this.path.join('/');
    }
    getFullPath() {
        return this.parent.getFullPath() + this.treeItem.label + '/';
    }
}
exports.DirectoryNode = DirectoryNode;
//# sourceMappingURL=nonLeafNode.js.map