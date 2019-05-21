"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const rootNode_1 = require("./rootNode");
class LoadedScriptsProvider {
    constructor() {
        this.root = new rootNode_1.RootNode();
        this.treeDataChanged = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.treeDataChanged.event;
    }
    getTreeItem(node) {
        return node.treeItem;
    }
    getChildren(node) {
        let parent = (node || this.root);
        return parent.getChildren();
    }
    addSession(session) {
        let changedItem = this.root.addSession(session);
        this.sendTreeDataChangedEvent(changedItem);
    }
    removeSession(sessionId) {
        let changedItem = this.root.removeSession(sessionId);
        this.sendTreeDataChangedEvent(changedItem);
    }
    addThread(threadInfo, sessionId) {
        let changedItem = this.root.addThread(threadInfo, sessionId);
        this.sendTreeDataChangedEvent(changedItem);
    }
    removeThread(threadId, sessionId) {
        let changedItem = this.root.removeThread(threadId, sessionId);
        this.sendTreeDataChangedEvent(changedItem);
    }
    addSource(sourceInfo, sessionId) {
        let changedItem = this.root.addSource(sourceInfo, sessionId);
        this.sendTreeDataChangedEvent(changedItem);
    }
    removeSources(threadId, sessionId) {
        let changedItem = this.root.removeSources(threadId, sessionId);
        this.sendTreeDataChangedEvent(changedItem);
    }
    sendTreeDataChangedEvent(changedItem) {
        if (changedItem) {
            if (changedItem === this.root) {
                this.treeDataChanged.fire();
            }
            else {
                this.treeDataChanged.fire(changedItem);
            }
        }
    }
}
exports.LoadedScriptsProvider = LoadedScriptsProvider;
//# sourceMappingURL=provider.js.map