"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const treeNode_1 = require("./treeNode");
const sessionNode_1 = require("./sessionNode");
class RootNode extends treeNode_1.TreeNode {
    constructor() {
        super('');
        this.children = [];
        this.showSessions = false;
        this.treeItem.contextValue = 'root';
    }
    addSession(session) {
        if (!this.children.some((child) => (child.id === session.id))) {
            let index = this.children.findIndex((child) => (child.treeItem.label > session.name));
            if (index < 0)
                index = this.children.length;
            this.children.splice(index, 0, new sessionNode_1.SessionNode(session, this));
            return this;
        }
        else {
            return undefined;
        }
    }
    removeSession(sessionId) {
        this.children = this.children.filter((child) => (child.id !== sessionId));
        return this;
    }
    addThread(threadInfo, sessionId) {
        let sessionItem = this.children.find((child) => (child.id === sessionId));
        return sessionItem ? this.fixChangedItem(sessionItem.addThread(threadInfo)) : undefined;
    }
    removeThread(threadId, sessionId) {
        let sessionItem = this.children.find((child) => (child.id === sessionId));
        return sessionItem ? this.fixChangedItem(sessionItem.removeThread(threadId)) : undefined;
    }
    addSource(sourceInfo, sessionId) {
        let sessionItem = this.children.find((child) => (child.id === sessionId));
        return sessionItem ? this.fixChangedItem(sessionItem.addSource(sourceInfo)) : undefined;
    }
    removeSources(threadId, sessionId) {
        let sessionItem = this.children.find((child) => (child.id === sessionId));
        return sessionItem ? this.fixChangedItem(sessionItem.removeSources(threadId)) : undefined;
    }
    getChildren() {
        this.treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        if (this.showSessions || (this.children.length > 1)) {
            this.showSessions = true;
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
        if (!this.showSessions && (changedItem instanceof sessionNode_1.SessionNode)) {
            return this;
        }
        else {
            return changedItem;
        }
    }
}
exports.RootNode = RootNode;
//# sourceMappingURL=rootNode.js.map