"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const ts = require("typescript");
const vs = require("vscode");
const supportedNodeKinds = [
    ts.SyntaxKind.ClassDeclaration,
    ts.SyntaxKind.PropertyDeclaration,
    ts.SyntaxKind.GetAccessor,
    ts.SyntaxKind.SetAccessor,
    ts.SyntaxKind.InterfaceDeclaration,
    ts.SyntaxKind.EnumDeclaration,
    ts.SyntaxKind.EnumMember,
    ts.SyntaxKind.FunctionDeclaration,
    ts.SyntaxKind.ArrowFunction,
    ts.SyntaxKind.MethodDeclaration,
    ts.SyntaxKind.MethodSignature,
    ts.SyntaxKind.PropertySignature,
    ts.SyntaxKind.Constructor,
    ts.SyntaxKind.FunctionExpression,
    ts.SyntaxKind.VariableDeclaration
];
function emptyArray(arr) {
    while (arr.length > 0) {
        arr.pop();
    }
}
exports.emptyArray = emptyArray;
function getDocumentFileName(document) {
    // Fix directory delimiters
    const fileName = fixWinPath(document.fileName);
    // Determine if this is a TypeScript document
    const isTypeScript = document.languageId === "typescript" || document.languageId === "typescriptreact";
    // Append ".js" if this is not a TypeScript document, but the extension is not ".js"
    // TypeScript's file resolution for allowJs seems to ignore documents if they're missing the extension
    const adjustedFileName = !isTypeScript && path.extname(fileName) !== "js" ? fileName + ".js" : fileName;
    return ts.sys.useCaseSensitiveFileNames ? adjustedFileName.toLowerCase() : adjustedFileName;
}
exports.getDocumentFileName = getDocumentFileName;
function fixWinPath(filePath) {
    if (path.sep === "\\") {
        return filePath.replace(/\\/g, "/");
    }
    return filePath;
}
exports.fixWinPath = fixWinPath;
function findChildForPosition(node, position) {
    let lastMatchingNode;
    const findChildFunc = (n) => {
        const start = n.pos;
        const end = n.end;
        if (start > position) {
            return;
        }
        if (start <= position && end >= position) {
            lastMatchingNode = n;
        }
        n.getChildren().forEach(findChildFunc);
    };
    findChildFunc(node);
    return lastMatchingNode;
}
exports.findChildForPosition = findChildForPosition;
function findFirstChildOfKindDepthFirst(node, kinds = supportedNodeKinds) {
    let children = node.getChildren();
    for (let c of children) {
        if (nodeIsOfKind(c, kinds)) {
            return c;
        }
        const matching = findFirstChildOfKindDepthFirst(c, kinds);
        if (matching) {
            return matching;
        }
    }
    return null;
}
exports.findFirstChildOfKindDepthFirst = findFirstChildOfKindDepthFirst;
function findChildrenOfKind(node, kinds = supportedNodeKinds) {
    let children = [];
    node.getChildren().forEach(c => {
        if (nodeIsOfKind(c, kinds)) {
            children.push(c);
        }
        children = children.concat(findChildrenOfKind(c, kinds));
    });
    return children;
}
exports.findChildrenOfKind = findChildrenOfKind;
function findNonVoidReturnInCurrentScope(node) {
    let returnNode;
    const children = node.getChildren();
    returnNode = children.find(n => n.kind === ts.SyntaxKind.ReturnStatement);
    if (returnNode) {
        if (returnNode.getChildren().length > 1) {
            return returnNode;
        }
    }
    for (let child of children) {
        if (child.kind === ts.SyntaxKind.FunctionDeclaration || child.kind === ts.SyntaxKind.FunctionExpression || child.kind === ts.SyntaxKind.ArrowFunction) {
            continue;
        }
        returnNode = findNonVoidReturnInCurrentScope(child);
        if (returnNode) {
            return returnNode;
        }
    }
    return returnNode;
}
exports.findNonVoidReturnInCurrentScope = findNonVoidReturnInCurrentScope;
function findVisibleChildrenOfKind(node, kinds = supportedNodeKinds) {
    let children = findChildrenOfKind(node, kinds);
    return children.filter(child => {
        if (child.modifiers && child.modifiers.find(m => m.kind === ts.SyntaxKind.PrivateKeyword)) {
            return false;
        }
        if (child.kind === ts.SyntaxKind.ClassDeclaration ||
            child.kind === ts.SyntaxKind.InterfaceDeclaration ||
            child.kind === ts.SyntaxKind.FunctionDeclaration) {
            if (!child.modifiers || !child.modifiers.find(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
                return false;
            }
        }
        return true;
    });
}
exports.findVisibleChildrenOfKind = findVisibleChildrenOfKind;
function nodeIsOfKind(node, kinds = supportedNodeKinds) {
    return !!node && !!kinds.find(k => node.kind === k);
}
exports.nodeIsOfKind = nodeIsOfKind;
function findFirstParent(node, kinds = supportedNodeKinds) {
    let parent = node.parent;
    while (parent) {
        if (nodeIsOfKind(parent, kinds)) {
            return parent;
        }
        parent = parent.parent;
    }
    return null;
}
exports.findFirstParent = findFirstParent;
class StringBuilder {
    constructor() {
        this._text = "";
    }
    append(text = "") {
        this._text += text.toString();
    }
    appendLine(text = "") {
        this._text += text.toString() + "\n";
    }
    toString() {
        return this._text;
    }
}
exports.StringBuilder = StringBuilder;
function formatTypeName(typeName) {
    typeName = typeName.trim();
    if (typeName === "") {
        return null;
    }
    if (typeName === "any") {
        return "*";
    }
    if (typeName.indexOf("|") !== -1 || typeName.indexOf("&") !== -1) {
        typeName = "(" + typeName + ")";
    }
    return typeName;
}
exports.formatTypeName = formatTypeName;
class SnippetStringBuilder {
    constructor() {
        this._snippet = new vs.SnippetString();
    }
    append(value) {
        this._snippet.appendText(value.toString());
        return this;
    }
    appendLine(value = "") {
        this.append(value.toString() + "\n");
        return this;
    }
    appendSnippetTabstop(index) {
        this._snippet.appendTabstop(index);
        return this;
    }
    appendSnippetPlaceholder(value, index) {
        this._snippet.appendPlaceholder(value, index);
        return this;
    }
    appendSnippetVariable(name, defaultValue) {
        this._snippet.appendVariable(name, defaultValue);
        return this;
    }
    toCommentValue() {
        let sb = new StringBuilder();
        sb.appendLine("/**");
        const lines = this._snippet.value.split("\n");
        lines.forEach((line, i) => {
            if (line === "" && i === lines.length - 1) {
                return;
            }
            sb.append(" * ");
            sb.appendLine(line);
        });
        sb.appendLine(" */");
        return new vs.SnippetString(sb.toString());
    }
}
exports.SnippetStringBuilder = SnippetStringBuilder;
//# sourceMappingURL=utilities.js.map