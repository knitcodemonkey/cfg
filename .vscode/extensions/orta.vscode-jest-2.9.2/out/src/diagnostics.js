"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * this module contains functions to show jest test results in
 * vscode inspector via the DiagnosticsCollection.
 */
const vscode = require("vscode");
const fs_1 = require("fs");
const TestResults_1 = require("./TestResults");
function createDiagnostic(uri, message, lineNumber, startCol = 0, endCol = Number.MAX_SAFE_INTEGER) {
    let line = lineNumber;
    if (line < 0) {
        line = 0;
        console.warn(`received invalid line number '${line}' for '${uri.toString()}'. (most likely due to unexpected test results... you can help fix the root cause by logging an issue with a sample project to reproduce this warning)`);
    }
    return createDiagnosticWithRange(message, new vscode.Range(line, startCol, line, endCol));
}
function createDiagnosticWithRange(message, range) {
    const diag = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
    diag.source = 'Jest';
    return diag;
}
// update diagnostics for the active editor
// it will utilize the parsed test result to mark actual text position.
function updateCurrentDiagnostics(testResult, diagnostics, editor) {
    const uri = editor.document.uri;
    if (!testResult.length) {
        diagnostics.delete(uri);
        return;
    }
    diagnostics.set(uri, testResult.map(r => {
        const line = r.lineNumberOfError || r.end.line;
        const textLine = editor.document.lineAt(line);
        return createDiagnosticWithRange(r.terseMessage || r.shortMessage, textLine.range);
    }));
}
exports.updateCurrentDiagnostics = updateCurrentDiagnostics;
// update all diagnosis with jest test results
// note, this method aim to quickly lay down the diagnosis baseline.
// For performance reason, we will not parse individual file here, therefore
// will not have the actual info about text position. However when the file
// become active, it will then utilize the actual file content via updateCurrentDiagnostics()
function updateDiagnostics(testResults, diagnostics) {
    function addTestFileError(result, uri) {
        const diag = createDiagnostic(uri, result.message || 'test file error', 0, 0, 0);
        diagnostics.set(uri, [diag]);
    }
    function addTestsError(result, uri) {
        const asserts = result.assertions.filter(a => a.status === TestResults_1.TestReconciliationState.KnownFail);
        diagnostics.set(uri, asserts.map(assertion => createDiagnostic(uri, assertion.terseMessage || assertion.shortMessage || assertion.message, assertion.line > 0 ? assertion.line - 1 : 0)));
    }
    testResults.forEach(result => {
        const uri = vscode.Uri.file(result.file);
        switch (result.status) {
            case TestResults_1.TestReconciliationState.KnownFail:
                if (result.assertions.length <= 0) {
                    addTestFileError(result, uri);
                }
                else {
                    addTestsError(result, uri);
                }
                break;
            default:
                diagnostics.delete(uri);
                break;
        }
    });
    // Remove diagnostics for files no longer in existence
    const toBeDeleted = [];
    diagnostics.forEach(uri => {
        if (!fs_1.existsSync(uri.fsPath)) {
            toBeDeleted.push(uri);
        }
    });
    toBeDeleted.forEach(uri => {
        diagnostics.delete(uri);
    });
}
exports.updateDiagnostics = updateDiagnostics;
function resetDiagnostics(diagnostics) {
    diagnostics.clear();
}
exports.resetDiagnostics = resetDiagnostics;
function failedSuiteCount(diagnostics) {
    let sum = 0;
    diagnostics.forEach(() => sum++);
    return sum;
}
exports.failedSuiteCount = failedSuiteCount;
//# sourceMappingURL=diagnostics.js.map