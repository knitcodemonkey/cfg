"use strict";
const vscode_1 = require("vscode");
const prettier = require('prettier-with-tabs');
/**
 * Format the given text with prettier with user's configuration.
 * @param text Text to format
 */
function format(text) {
    const config = vscode_1.workspace.getConfiguration('prettier');
    /*
    handle deprecated parser option
    */
    let parser = config.parser;
    if (!parser) {
        parser = config.useFlowParser ? 'flow' : 'babylon';
    }
    /*
    handle trailingComma changes boolean -> string
    */
    let trailingComma = config.trailingComma;
    if (trailingComma === true) {
        trailingComma = 'es5';
    }
    else if (trailingComma === false) {
        trailingComma = 'none';
    }
    return prettier.format(text, {
        printWidth: config.printWidth,
        tabWidth: config.tabWidth,
        singleQuote: config.singleQuote,
        trailingComma,
        bracketSpacing: config.bracketSpacing,
        jsxBracketSameLine: config.jsxBracketSameLine,
        useTabs: config.useTabs,
        parser: parser
    });
}
function fullDocumentRange(document) {
    const lastLineId = document.lineCount - 1;
    return new vscode_1.Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
}
class PrettierEditProvider {
    provideDocumentRangeFormattingEdits(document, range, options, token) {
        try {
            return [vscode_1.TextEdit.replace(range, format(document.getText(range)))];
        }
        catch (e) {
            let errorPosition;
            if (e.loc) {
                let charPos = e.loc.column;
                if (e.loc.line === 1) {
                    charPos = range.start.character + e.loc.column;
                }
                errorPosition = new vscode_1.Position(e.loc.line - 1 + range.start.line, charPos);
            }
            handleError(document, e.message, errorPosition);
        }
    }
    provideDocumentFormattingEdits(document, options, token) {
        try {
            return [vscode_1.TextEdit.replace(fullDocumentRange(document), format(document.getText()))];
        }
        catch (e) {
            let errorPosition;
            if (e.loc) {
                errorPosition = new vscode_1.Position(e.loc.line - 1, e.loc.column);
            }
            handleError(document, e.message, errorPosition);
        }
    }
}
/**
 * Handle errors for a given text document.
 * Steps:
 *  - Show the error message.
 *  - Scroll to the error position in given document if asked for it.
 *
 * @param document Document which raised the error
 * @param message Error message
 * @param errorPosition Position where the error occured. Relative to document.
 */
function handleError(document, message, errorPosition) {
    if (errorPosition) {
        vscode_1.window.showErrorMessage(message, "Show").then(function onAction(action) {
            if (action === "Show") {
                const rangeError = new vscode_1.Range(errorPosition, errorPosition);
                /*
                Show text document which has errored.
                Format on save case. (save all)
                */
                vscode_1.window.showTextDocument(document).then((editor) => {
                    // move cursor to error position and show it.
                    editor.selection = new vscode_1.Selection(rangeError.start, rangeError.end);
                    editor.revealRange(rangeError);
                });
            }
        });
    }
    else {
        vscode_1.window.showErrorMessage(message);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PrettierEditProvider;
//# sourceMappingURL=PrettierEditProvider.js.map