"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const treeNode_1 = require("./treeNode");
const nonLeafNode_1 = require("./nonLeafNode");
class SessionNode extends treeNode_1.TreeNode {
    constructor(session, parent) {
        super(session.name, parent);
        this.session = session;
        this.children = [];
        this.showThreads = false;
        this.treeItem.contextValue = 'session';
    }
    get id() {
        return this.session.id;
    }
    addThread(threadInfo) {
        if (!this.children.some((child) => (child.id === threadInfo.id))) {
            let index = this.children.findIndex((child) => (child.treeItem.label > threadInfo.name));
            if (index < 0)
                index = this.children.length;
            this.children.splice(index, 0, new nonLeafNode_1.ThreadNode(threadInfo, this));
            return this;
        }
        else {
            return undefined;
        }
    }
    removeThread(threadId) {
        this.children = this.children.filter((child) => (child.id !== threadId));
        return this;
    }
    addSource(sourceInfo) {
        if (!sourceInfo.url)
            return undefined;
        let threadItem = this.children.find((child) => (child.id === sourceInfo.threadId));
        if (threadItem) {
            let path = splitURL(sourceInfo.url);
            let filename = path.pop();
            return this.fixChangedItem(threadItem.addSource(filename, path, sourceInfo, this.id));
        }
        else {
            return undefined;
        }
    }
    removeSources(threadId) {
        let threadItem = this.children.find((child) => (child.id === threadId));
        return threadItem ? threadItem.removeSources() : undefined;
    }
    getChildren() {
        this.treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        if (this.showThreads || (this.children.length > 1)) {
            this.showThreads = true;
            return this.children;
        }
        else if (this.children.length == 1) {
            return this.children[0].getChildren();
        }
        else {
            return [];
        }
    }
    fixChangedItem(changedItem) {
        if (!changedItem)
            return undefined;
        if (!this.showThreads && (changedItem instanceof nonLeafNode_1.ThreadNode)) {
            return this;
        }
        else {
            return changedItem;
        }
    }
}
exports.SessionNode = SessionNode;
function splitURL(urlString) {
    let originLength;
    let i = urlString.indexOf(':');
    if (i >= 0) {
        i++;
        if (urlString[i] === '/')
            i++;
        if (urlString[i] === '/')
            i++;
        originLength = urlString.indexOf('/', i);
    }
    else {
        originLength = 0;
    }
    let searchStartIndex = urlString.indexOf('?', originLength);
    if (searchStartIndex < 0) {
        searchStartIndex = urlString.length;
    }
    let origin = urlString.substr(0, originLength);
    let search = urlString.substr(searchStartIndex);
    let path = urlString.substring(originLength, searchStartIndex);
    let result = path.split('/');
    result[0] = origin + result[0];
    result[result.length - 1] += search;
    return result;
}
//# sourceMappingURL=sessionNode.js.map