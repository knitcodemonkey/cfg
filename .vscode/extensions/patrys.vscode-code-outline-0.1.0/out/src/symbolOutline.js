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
const vscode_1 = require("vscode");
const icons_1 = require("./icons");
let optsSortOrder = [];
let optsTopLevel = [];
let optsExpandNodes = [];
let optsDoSort = true;
class SymbolNode {
    constructor(symbol) {
        this.children = [];
        this.symbol = symbol;
    }
    /**
     * Judge if a node should be expanded automatically.
     */
    static shouldAutoExpand(kind) {
        let ix = optsExpandNodes.indexOf(kind);
        if (ix < 0) {
            ix = optsExpandNodes.indexOf(-1);
        }
        return ix > -1;
    }
    getKindOrder(kind) {
        let ix = optsSortOrder.indexOf(kind);
        if (ix < 0) {
            ix = optsSortOrder.indexOf(-1);
        }
        return ix;
    }
    compareSymbols(a, b) {
        const kindOrder = this.getKindOrder(a.symbol.kind) - this.getKindOrder(b.symbol.kind);
        if (kindOrder !== 0) {
            return kindOrder;
        }
        if (a.symbol.name.toLowerCase() > b.symbol.name.toLowerCase()) {
            return 1;
        }
        return -1;
    }
    sort() {
        this.children.sort(this.compareSymbols.bind(this));
        this.children.forEach(child => child.sort());
    }
    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }
}
exports.SymbolNode = SymbolNode;
class SymbolOutlineTreeDataProvider {
    constructor(context) {
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this
            ._onDidChangeTreeData.event;
        this.context = context;
    }
    getSymbols(document) {
        return vscode_1.commands.executeCommand("vscode.executeDocumentSymbolProvider", document.uri);
    }
    compareSymbols(a, b) {
        const startComparison = a.symbol.location.range.start.compareTo(b.symbol.location.range.start);
        if (startComparison != 0) {
            return startComparison;
        }
        return b.symbol.location.range.end.compareTo(a.symbol.location.range.end);
    }
    updateSymbols(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const tree = new SymbolNode();
            this.editor = editor;
            if (editor) {
                readOpts();
                let symbols = yield this.getSymbols(editor.document);
                if (optsTopLevel.indexOf(-1) < 0) {
                    symbols = symbols.filter(sym => optsTopLevel.indexOf(sym.kind) >= 0);
                }
                // Create symbol nodes
                const symbolNodes = symbols.map(symbol => new SymbolNode(symbol));
                // Sort nodes by left edge ascending and right edge descending
                symbolNodes.sort(this.compareSymbols);
                // Start with an empty list of parent candidates
                let potentialParents = [];
                symbolNodes.forEach(currentNode => {
                    // Drop candidates that do not contain the current symbol range
                    potentialParents = potentialParents
                        .filter(node => node !== currentNode &&
                        node.symbol.location.range.contains(currentNode.symbol.location.range))
                        .sort(this.compareSymbols);
                    // See if any candidates remain
                    if (!potentialParents.length) {
                        tree.addChild(currentNode);
                    }
                    else {
                        const parent = potentialParents[potentialParents.length - 1];
                        parent.addChild(currentNode);
                    }
                    // Add current node as a parent candidate
                    potentialParents.push(currentNode);
                });
                if (optsDoSort) {
                    tree.sort();
                }
            }
            this.tree = tree;
        });
    }
    getChildren(node) {
        return __awaiter(this, void 0, void 0, function* () {
            if (node) {
                return node.children;
            }
            else {
                yield this.updateSymbols(vscode_1.window.activeTextEditor);
                return this.tree ? this.tree.children : [];
            }
        });
    }
    getParent(node) {
        return node.parent;
    }
    getNodeByPosition(position) {
        let node = this.tree;
        while (node.children.length) {
            const matching = node.children.filter(node => node.symbol.location.range.contains(position));
            if (!matching.length) {
                break;
            }
            node = matching[0];
        }
        if (node.symbol) {
            return node;
        }
    }
    getTreeItem(node) {
        const { kind } = node.symbol;
        let treeItem = new vscode_1.TreeItem(node.symbol.name);
        if (node.children.length) {
            treeItem.collapsibleState =
                optsExpandNodes.length && SymbolNode.shouldAutoExpand(kind)
                    ? vscode_1.TreeItemCollapsibleState.Expanded
                    : vscode_1.TreeItemCollapsibleState.Collapsed;
        }
        else {
            treeItem.collapsibleState = vscode_1.TreeItemCollapsibleState.None;
        }
        treeItem.command = {
            command: "symbolOutline.revealRange",
            title: "",
            arguments: [this.editor, node.symbol.location.range]
        };
        treeItem.iconPath = icons_1.getIcon(kind, this.context);
        return treeItem;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
}
exports.SymbolOutlineTreeDataProvider = SymbolOutlineTreeDataProvider;
class SymbolOutlineProvider {
    constructor(context) {
        const treeDataProvider = new SymbolOutlineTreeDataProvider(context);
        this.symbolViewer = vscode_1.window.createTreeView("symbolOutline", {
            treeDataProvider
        });
        vscode_1.commands.registerCommand("symbolOutline.refresh", () => {
            treeDataProvider.refresh();
        });
        vscode_1.commands.registerCommand("symbolOutline.revealRange", (editor, range) => {
            editor.revealRange(range, vscode_1.TextEditorRevealType.Default);
            editor.selection = new vscode_1.Selection(range.start, range.start);
            vscode_1.commands.executeCommand("workbench.action.focusActiveEditorGroup");
        });
        vscode_1.window.onDidChangeActiveTextEditor(editor => treeDataProvider.refresh());
        vscode_1.workspace.onDidCloseTextDocument(document => treeDataProvider.refresh());
        vscode_1.workspace.onDidChangeTextDocument(event => treeDataProvider.refresh());
        vscode_1.workspace.onDidSaveTextDocument(document => treeDataProvider.refresh());
        vscode_1.window.onDidChangeTextEditorSelection(event => {
            if (event.selections.length) {
                const node = treeDataProvider.getNodeByPosition(event.selections[0].active);
                if (node) {
                    this.symbolViewer.reveal(node);
                }
            }
        });
    }
}
exports.SymbolOutlineProvider = SymbolOutlineProvider;
function readOpts() {
    let opts = vscode_1.workspace.getConfiguration("symbolOutline");
    optsDoSort = opts.get("doSort");
    optsExpandNodes = convertEnumNames(opts.get("expandNodes"));
    optsSortOrder = convertEnumNames(opts.get("sortOrder"));
    optsTopLevel = convertEnumNames(opts.get("topLevel"));
}
function convertEnumNames(names) {
    return names.map(str => {
        let v = vscode_1.SymbolKind[str];
        return typeof v == "undefined" ? -1 : v;
    });
}
//# sourceMappingURL=symbolOutline.js.map