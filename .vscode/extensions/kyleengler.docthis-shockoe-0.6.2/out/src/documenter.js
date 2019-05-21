"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vs = require("vscode");
const ts = require("typescript");
const utils = require("./utilities");
const languageServiceHost_1 = require("./languageServiceHost");
const vscode_1 = require("vscode");
function includeTypes() {
    return vs.workspace.getConfiguration().get("docthis.includeTypes", true);
}
function inferTypes() {
    return vs.workspace.getConfiguration().get("docthis.inferTypesFromNames", false);
}
function enableHungarianNotationEvaluation() {
    return vs.workspace.getConfiguration().get("docthis.enableHungarianNotationEvaluation", false);
}
class Documenter {
    constructor() {
        this._languageServiceHost = new languageServiceHost_1.LanguageServiceHost();
        this._services = ts.createLanguageService(this._languageServiceHost, ts.createDocumentRegistry());
    }
    documentThis(editor, commandName, forCompletion) {
        const sourceFile = this._getSourceFile(editor.document);
        const selection = editor.selection;
        const caret = selection.start;
        const position = ts.getPositionOfLineAndCharacter(sourceFile, caret.line, caret.character);
        const node = utils.findChildForPosition(sourceFile, position);
        const documentNode = utils.nodeIsOfKind(node) ? node : utils.findFirstParent(node);
        if (!documentNode) {
            this._showFailureMessage(commandName, "at the current position");
            return;
        }
        const sb = new utils.SnippetStringBuilder();
        const docLocation = this._documentNode(sb, documentNode, sourceFile);
        if (docLocation) {
            this._insertDocumentation(sb, docLocation, editor, forCompletion);
        }
        else {
            this._showFailureMessage(commandName, "at the current position");
        }
    }
    traceNode(editor) {
        const selection = editor.selection;
        const caret = selection.start;
        const sourceFile = this._getSourceFile(editor.document);
        const position = ts.getPositionOfLineAndCharacter(sourceFile, caret.line, caret.character);
        const node = utils.findChildForPosition(sourceFile, position);
        const nodes = [];
        let parent = node;
        while (parent) {
            nodes.push(this._printNodeInfo(parent, sourceFile));
            parent = parent.parent;
        }
        const sb = new utils.StringBuilder();
        nodes.reverse().forEach((n, i) => {
            sb.appendLine(n);
        });
        if (!this._outputChannel) {
            this._outputChannel = vs.window.createOutputChannel("TypeScript Syntax Node Trace");
        }
        this._outputChannel.show();
        this._outputChannel.appendLine(sb.toString());
    }
    _printNodeInfo(node, sourceFile) {
        const sb = new utils.StringBuilder();
        sb.append(`${node.getStart()} to ${node.getEnd()} --- (${node.kind}) ${ts.SyntaxKind[node.kind]}`);
        if (node.parent) {
            const nodeIndex = node.parent.getChildren().indexOf(node);
            if (nodeIndex !== -1) {
                sb.append(` - Index of parent: ${nodeIndex}`);
            }
        }
        sb.appendLine();
        const column = sourceFile.getLineAndCharacterOfPosition(node.getStart()).character;
        for (let i = 0; i < column; i++) {
            sb.append(" ");
        }
        sb.appendLine(node.getText());
        return sb.toString();
    }
    _showFailureMessage(commandName, condition) {
        vs.window.showErrorMessage(`Sorry! '${commandName}' wasn't able to produce documentation ${condition}.`);
    }
    _insertDocumentation(sb, location, editor, forCompletion) {
        const startPosition = new vs.Position(forCompletion ? location.line - 1 : location.line, location.character);
        const endPosition = new vs.Position(location.line, location.character);
        const range = new vscode_1.Range(startPosition, endPosition);
        editor.insertSnippet(sb.toCommentValue(), range);
    }
    _getSourceFile(document) {
        const fileText = document.getText();
        const canonicalFileName = utils.getDocumentFileName(document);
        this._languageServiceHost.updateCurrentFile(canonicalFileName, fileText);
        this._services.getSyntacticDiagnostics(canonicalFileName);
        const sourceFile = this._services.getProgram().getSourceFile(canonicalFileName);
        const newText = document.getText();
        sourceFile.update(newText, {
            newLength: newText.length,
            span: {
                start: 0,
                length: newText.length
            }
        });
        return sourceFile;
    }
    _documentNode(sb, node, sourceFile) {
        switch (node.kind) {
            case ts.SyntaxKind.ClassDeclaration:
                this._emitClassDeclaration(sb, node);
                break;
            case ts.SyntaxKind.PropertyDeclaration:
            case ts.SyntaxKind.PropertySignature:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
                this._emitPropertyDeclaration(sb, node);
                break;
            case ts.SyntaxKind.InterfaceDeclaration:
                this._emitInterfaceDeclaration(sb, node);
                break;
            case ts.SyntaxKind.EnumDeclaration:
                this._emitEnumDeclaration(sb, node);
                break;
            case ts.SyntaxKind.EnumMember:
                sb.appendLine();
                break;
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.MethodSignature:
                this._emitMethodDeclaration(sb, node);
                break;
            case ts.SyntaxKind.Constructor:
                this._emitConstructorDeclaration(sb, node);
                break;
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
                return this._emitFunctionExpression(sb, node, sourceFile);
            case ts.SyntaxKind.VariableDeclaration:
                return this._emitVariableDeclaration(sb, node, sourceFile);
            default:
                return;
        }
        return ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
    }
    _emitDescriptionHeader(sb) {
        if (vs.workspace.getConfiguration().get("docthis.includeDescriptionTag", false)) {
            sb.append("@description ");
            sb.appendSnippetTabstop();
            sb.appendLine();
        }
        else {
            // We don't want description tag, probably because we want to free type the description. So add space for that.
            sb.appendSnippetTabstop();
            sb.appendLine();
        }
    }
    _emitAuthor(sb) {
        if (vs.workspace.getConfiguration().get("docthis.includeAuthorTag", false)) {
            let author = vs.workspace.getConfiguration().get("docthis.authorName", "");
            sb.append("@author " + author);
            sb.appendSnippetTabstop();
            sb.appendLine();
        }
    }
    _emitVariableDeclaration(sb, node, sourceFile) {
        for (const child of node.getChildren()) {
            const result = this._documentNode(sb, child, sourceFile);
            if (result) {
                return result;
            }
        }
        return;
    }
    _emitFunctionExpression(sb, node, sourceFile) {
        let targetNode = node.parent;
        if (node.parent.kind !== ts.SyntaxKind.PropertyAssignment &&
            node.parent.kind !== ts.SyntaxKind.BinaryExpression &&
            node.parent.kind !== ts.SyntaxKind.PropertyDeclaration) {
            targetNode = utils.findFirstParent(targetNode, [ts.SyntaxKind.VariableDeclarationList, ts.SyntaxKind.VariableDeclaration]);
            if (!targetNode) {
                return;
            }
        }
        this._emitDescriptionHeader(sb);
        this._emitTypeParameters(sb, node);
        this._emitParameters(sb, node);
        this._emitReturns(sb, node);
        this._emitMemberOf(sb, node.parent);
        return ts.getLineAndCharacterOfPosition(sourceFile, targetNode.getStart());
    }
    _emitClassDeclaration(sb, node) {
        this._emitDescriptionHeader(sb);
        this._emitAuthor(sb);
        this._emitModifiers(sb, node);
        sb.append("@class");
        if (node.name) {
            sb.append(` ${node.name.getText()}`);
        }
        sb.appendLine();
        this._emitHeritageClauses(sb, node);
        this._emitTypeParameters(sb, node);
    }
    _emitPropertyDeclaration(sb, node) {
        this._emitDescriptionHeader(sb);
        if (node.kind === ts.SyntaxKind.GetAccessor) {
            const name = utils.findFirstChildOfKindDepthFirst(node, [ts.SyntaxKind.Identifier]).getText();
            const parentClass = node.parent;
            let hasSetter = !!parentClass.members.find(c => c.kind === ts.SyntaxKind.SetAccessor &&
                utils.findFirstChildOfKindDepthFirst(c, [ts.SyntaxKind.Identifier]).getText() === name);
            if (!hasSetter) {
                sb.appendLine("@readonly");
            }
        }
        this._emitModifiers(sb, node);
        // JSDoc fails to emit documentation for arrow function syntax. (https://github.com/jsdoc3/jsdoc/issues/1100)
        if (includeTypes()) {
            if (node.type && node.type.getText().indexOf("=>") === -1) {
                sb.appendLine(`@type ${utils.formatTypeName(node.type.getText())}`);
            }
            else if (enableHungarianNotationEvaluation() && this._isHungarianNotation(node.name.getText())) {
                sb.appendLine(`@type ${this._getHungarianNotationType(node.name.getText())}`);
            }
        }
        this._emitMemberOf(sb, node.parent);
    }
    _emitInterfaceDeclaration(sb, node) {
        this._emitDescriptionHeader(sb);
        this._emitAuthor(sb);
        this._emitModifiers(sb, node);
        sb.appendLine(`@interface ${node.name.getText()}`);
        this._emitHeritageClauses(sb, node);
        this._emitTypeParameters(sb, node);
    }
    _emitEnumDeclaration(sb, node) {
        this._emitDescriptionHeader(sb);
        this._emitModifiers(sb, node);
        sb.appendLine(`@enum {number}`);
    }
    _emitMethodDeclaration(sb, node) {
        this._emitDescriptionHeader(sb);
        this._emitAuthor(sb);
        this._emitModifiers(sb, node);
        this._emitTypeParameters(sb, node);
        this._emitParameters(sb, node);
        this._emitReturns(sb, node);
        this._emitMemberOf(sb, node.parent);
    }
    _emitMemberOf(sb, parent) {
        let enabledForClasses = parent.kind === ts.SyntaxKind.ClassDeclaration && vs.workspace.getConfiguration().get("docthis.includeMemberOfOnClassMembers", true);
        let enabledForInterfaces = parent.kind === ts.SyntaxKind.InterfaceDeclaration && vs.workspace.getConfiguration().get("docthis.includeMemberOfOnInterfaceMembers", true);
        if (parent && parent["name"] && (enabledForClasses || enabledForInterfaces)) {
            sb.appendLine("@memberof " + parent["name"].text);
        }
    }
    _isNameBooleanLike(name) {
        return /(?:is|has|can)[A-Z_]/.test(name);
    }
    _isNameFunctionLike(name) {
        const fnNames = ["cb", "callback", "done", "next", "fn"];
        return fnNames.indexOf(name) !== -1;
    }
    _inferReturnTypeFromName(name) {
        if (this._isNameBooleanLike(name)) {
            return "{boolean}";
        }
        return "";
    }
    _emitReturns(sb, node) {
        if (utils.findNonVoidReturnInCurrentScope(node) || (node.type && node.type.getText() !== "void")) {
            sb.append("@return");
            if (includeTypes() && node.type) {
                sb.append(" " + utils.formatTypeName(node.type.getText()));
            }
            else if (includeTypes() && inferTypes()) {
                sb.append(" " + this._inferReturnTypeFromName(node.name.getText()));
            }
            sb.append(" ");
            sb.appendSnippetTabstop();
            sb.appendLine();
        }
        else {
            sb.append("@return {void}");
        }
    }
    _inferParamTypeFromName(name) {
        if (this._isNameFunctionLike(name)) {
            return "function";
        }
        if (this._isNameBooleanLike(name)) {
            return "boolean";
        }
        return "any";
    }
    _emitParameters(sb, node) {
        if (!node.parameters) {
            return;
        }
        node.parameters.forEach(parameter => {
            const name = parameter.name.getText();
            const isOptional = parameter.questionToken || parameter.initializer;
            const isArgs = !!parameter.dotDotDotToken;
            const initializerValue = parameter.initializer ? parameter.initializer.getText() : null;
            let typeName = "any";
            if (includeTypes()) {
                if (parameter.initializer && !parameter.type) {
                    if (/^[0-9]/.test(initializerValue)) {
                        typeName = "number";
                    }
                    else if (initializerValue.indexOf("\"") !== -1 ||
                        initializerValue.indexOf("'") !== -1 ||
                        initializerValue.indexOf("`") !== -1) {
                        typeName = "string";
                    }
                    else if (initializerValue.indexOf("true") !== -1 ||
                        initializerValue.indexOf("false") !== -1) {
                        typeName = "boolean";
                    }
                }
                else if (parameter.type) {
                    typeName = utils.formatTypeName((isArgs ? "..." : "") + parameter.type.getFullText().trim());
                }
                else if (enableHungarianNotationEvaluation() && this._isHungarianNotation(name)) {
                    typeName = this._getHungarianNotationType(name);
                }
                else if (inferTypes()) {
                    typeName = this._inferParamTypeFromName(name);
                }
            }
            sb.append("@param  ");
            if (includeTypes()) {
                sb.append("{");
                sb.appendSnippetPlaceholder(typeName);
                sb.append("} ");
            }
            if (isOptional) {
                sb.append("[");
            }
            sb.append(name);
            if (parameter.initializer && typeName) {
                sb.append("=" + parameter.initializer.getText());
            }
            if (isOptional) {
                sb.append("]");
            }
            sb.append(" ");
            sb.appendSnippetTabstop();
            sb.appendLine();
        });
    }
    _isHungarianNotation(name) {
        return /^[abefimos][A-Z]/.test(name);
    }
    _getHungarianNotationType(name) {
        switch (name.charAt(0)) {
            case "a": return "Array";
            case "b": return "boolean";
            case "e": return "Object"; // Enumeration
            case "f": return "function";
            case "i": return "number";
            case "m": return "Object"; // Map
            case "o": return "Object";
            case "s": return "string";
            default: return "any";
        }
    }
    _emitConstructorDeclaration(sb, node) {
        sb.appendSnippetPlaceholder(`Creates an instance of ${node.parent.name.getText()}.`);
        sb.appendLine();
        this._emitAuthor(sb);
        this._emitParameters(sb, node);
        this._emitMemberOf(sb, node.parent);
    }
    _emitTypeParameters(sb, node) {
        if (!node.typeParameters) {
            return;
        }
        node.typeParameters.forEach(parameter => {
            sb.append(`@template ${parameter.name.getText()} `);
            sb.appendSnippetTabstop();
            sb.appendLine();
        });
    }
    _emitHeritageClauses(sb, node) {
        if (!node.heritageClauses || !includeTypes()) {
            return;
        }
        node.heritageClauses.forEach((clause) => {
            const heritageType = clause.token === ts.SyntaxKind.ExtendsKeyword ? "@extends" : "@implements";
            clause.types.forEach(t => {
                let tn = t.expression.getText();
                if (t.typeArguments) {
                    tn += "<";
                    tn += t.typeArguments.map(a => a.getText()).join(", ");
                    tn += ">";
                }
                sb.append(`${heritageType} ${utils.formatTypeName(tn)}`);
                sb.appendLine();
            });
        });
    }
    _emitModifiers(sb, node) {
        if (!node.modifiers) {
            return;
        }
        node.modifiers.forEach(modifier => {
            switch (modifier.kind) {
                case ts.SyntaxKind.ExportKeyword:
                    sb.appendLine("@export");
                    return;
                case ts.SyntaxKind.AbstractKeyword:
                    sb.appendLine("@abstract");
                    return;
                case ts.SyntaxKind.ProtectedKeyword:
                    sb.appendLine("@protected");
                    return;
                case ts.SyntaxKind.PrivateKeyword:
                    sb.appendLine("@private");
                    return;
                case ts.SyntaxKind.StaticKeyword:
                    sb.appendLine("@static");
                    return;
            }
        });
    }
    dispose() {
        if (this._outputChannel) {
            this._outputChannel.dispose();
        }
        this._services.dispose();
    }
}
exports.Documenter = Documenter;
//# sourceMappingURL=documenter.js.map