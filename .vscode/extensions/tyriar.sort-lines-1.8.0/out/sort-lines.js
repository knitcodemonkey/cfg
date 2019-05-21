"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function sortActiveSelection(algorithm, removeDuplicateValues) {
    const textEditor = vscode.window.activeTextEditor;
    const selection = textEditor.selection;
    if (selection.isEmpty && vscode.workspace.getConfiguration('sortLines').get('sortEntireFile') === true) {
        return sortLines(textEditor, 0, textEditor.document.lineCount - 1, algorithm, removeDuplicateValues);
    }
    if (selection.isSingleLine) {
        return undefined;
    }
    return sortLines(textEditor, selection.start.line, selection.end.line, algorithm, removeDuplicateValues);
}
function sortLines(textEditor, startLine, endLine, algorithm, removeDuplicateValues) {
    const lines = [];
    for (let i = startLine; i <= endLine; i++) {
        lines.push(textEditor.document.lineAt(i).text);
    }
    // Remove blank lines in selection
    if (vscode.workspace.getConfiguration('sortLines').get('filterBlankLines') === true) {
        removeBlanks(lines);
    }
    lines.sort(algorithm);
    if (removeDuplicateValues) {
        removeDuplicates(lines, algorithm);
    }
    return textEditor.edit(editBuilder => {
        const range = new vscode.Range(startLine, 0, endLine, textEditor.document.lineAt(endLine).text.length);
        editBuilder.replace(range, lines.join('\n'));
    });
}
function removeDuplicates(lines, algorithm) {
    for (let i = 1; i < lines.length; ++i) {
        if (algorithm ? algorithm(lines[i - 1], lines[i]) === 0 : lines[i - 1] === lines[i]) {
            lines.splice(i, 1);
            i--;
        }
    }
}
function removeBlanks(lines) {
    for (let i = 0; i < lines.length; ++i) {
        if (lines[i].trim() === '') {
            lines.splice(i, 1);
            i--;
        }
    }
}
function reverseCompare(a, b) {
    if (a === b) {
        return 0;
    }
    return a < b ? 1 : -1;
}
function caseInsensitiveCompare(a, b) {
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
}
function lineLengthCompare(a, b) {
    if (a.length === b.length) {
        return 0;
    }
    return a.length > b.length ? 1 : -1;
}
function lineLengthReverseCompare(a, b) {
    if (a.length === b.length) {
        return 0;
    }
    return a.length > b.length ? -1 : 1;
}
function variableLengthCompare(a, b) {
    return getVariableCharacters(a).length > getVariableCharacters(b).length ? 1 : -1;
}
function variableLengthReverseCompare(a, b) {
    return getVariableCharacters(a).length > getVariableCharacters(b).length ? -1 : 1;
}
let intlCollator;
function naturalCompare(a, b) {
    if (!intlCollator) {
        intlCollator = new Intl.Collator(undefined, { numeric: true });
    }
    return intlCollator.compare(a, b);
}
function shuffleCompare() {
    return Math.random() > 0.5 ? 1 : -1;
}
function getVariableCharacters(line) {
    const match = line.match(/(.*)=/);
    if (!match) {
        return line;
    }
    return match.pop();
}
exports.sortNormal = () => sortActiveSelection(undefined, false);
exports.sortReverse = () => sortActiveSelection(reverseCompare, false);
exports.sortCaseInsensitive = () => sortActiveSelection(caseInsensitiveCompare, false);
exports.sortCaseInsensitiveUnique = () => sortActiveSelection(caseInsensitiveCompare, true);
exports.sortLineLength = () => sortActiveSelection(lineLengthCompare, false);
exports.sortLineLengthReverse = () => sortActiveSelection(lineLengthReverseCompare, false);
exports.sortVariableLength = () => sortActiveSelection(variableLengthCompare, false);
exports.sortVariableLengthReverse = () => sortActiveSelection(variableLengthReverseCompare, false);
exports.sortNatural = () => sortActiveSelection(naturalCompare, false);
exports.sortUnique = () => sortActiveSelection(undefined, true);
exports.sortShuffle = () => sortActiveSelection(shuffleCompare, false);
//# sourceMappingURL=sort-lines.js.map