"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jest_editor_support_1 = require("jest-editor-support");
const TestReconciliationState_1 = require("./TestReconciliationState");
const TestParser_1 = require("../TestParser");
class TestResultProvider {
    constructor() {
        this.reconciler = new jest_editor_support_1.TestReconciler();
        this.resetCache();
    }
    resetCache() {
        this.resultsByFilePath = {};
        this.sortedResultsByFilePath = {};
    }
    getResults(filePath) {
        if (this.resultsByFilePath[filePath]) {
            return this.resultsByFilePath[filePath];
        }
        const { itBlocks } = TestParser_1.parseTest(filePath);
        const results = this.reconciler.assertionsForTestFile(filePath) || [];
        const result = [];
        for (const test of itBlocks) {
            const assertion = 
            // do we ever consider marking a test when their name do not match even though
            // the linenumber matches? Especially consider line-number could be error-prone
            // in situations lik typescript/uglify etc. without checking test names we
            // could end up marking the wrong test simply because its line number matched.
            // see https://github.com/jest-community/vscode-jest/issues/349
            results.filter(r => r.title === test.name && r.line >= test.start.line && r.line <= test.end.line)[0] ||
                results.filter(r => r.title === test.name && r.status !== TestReconciliationState_1.TestReconciliationState.KnownFail)[0] ||
                results.filter(r => r.title === test.name)[0] ||
                {};
            // Note the shift from one-based to zero-based line number and columns
            result.push({
                name: test.name,
                start: {
                    column: test.start.column - 1,
                    line: test.start.line - 1,
                },
                end: {
                    column: test.end.column - 1,
                    line: test.end.line - 1,
                },
                status: assertion.status || TestReconciliationState_1.TestReconciliationState.Unknown,
                shortMessage: assertion.shortMessage,
                terseMessage: assertion.terseMessage,
                lineNumberOfError: assertion.line && assertion.line >= test.start.line && assertion.line <= test.end.line
                    ? assertion.line - 1
                    : test.end.line - 1,
            });
        }
        this.resultsByFilePath[filePath] = result;
        return result;
    }
    getSortedResults(filePath) {
        if (this.sortedResultsByFilePath[filePath]) {
            return this.sortedResultsByFilePath[filePath];
        }
        const result = {
            fail: [],
            skip: [],
            success: [],
            unknown: [],
        };
        const testResults = this.getResults(filePath);
        for (const test of testResults) {
            if (test.status === TestReconciliationState_1.TestReconciliationState.KnownFail) {
                result.fail.push(test);
            }
            else if (test.status === TestReconciliationState_1.TestReconciliationState.KnownSkip) {
                result.skip.push(test);
            }
            else if (test.status === TestReconciliationState_1.TestReconciliationState.KnownSuccess) {
                result.success.push(test);
            }
            else {
                result.unknown.push(test);
            }
        }
        this.sortedResultsByFilePath[filePath] = result;
        return result;
    }
    updateTestResults(data) {
        this.resetCache();
        return this.reconciler.updateFileWithJestStatus(data);
    }
    removeCachedResults(filePath) {
        this.resultsByFilePath[filePath] = null;
        this.sortedResultsByFilePath[filePath] = null;
    }
}
exports.TestResultProvider = TestResultProvider;
//# sourceMappingURL=TestResultProvider.js.map