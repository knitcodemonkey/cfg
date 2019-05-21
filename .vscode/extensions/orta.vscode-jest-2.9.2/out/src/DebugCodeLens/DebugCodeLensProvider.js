"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const appGlobals_1 = require("../appGlobals");
const helpers_1 = require("../helpers");
const path_1 = require("path");
const DebugCodeLens_1 = require("./DebugCodeLens");
const TestState_1 = require("./TestState");
class DebugCodeLensProvider {
    constructor(testResultProvider, showWhenTestStateIn) {
        this.testResultProvider = testResultProvider;
        this._showWhenTestStateIn = showWhenTestStateIn;
        this.onDidChange = new vscode.EventEmitter();
    }
    get showWhenTestStateIn() {
        return this._showWhenTestStateIn;
    }
    set showWhenTestStateIn(value) {
        this._showWhenTestStateIn = value;
        this.onDidChange.fire();
    }
    get onDidChangeCodeLenses() {
        return this.onDidChange.event;
    }
    provideCodeLenses(document, _) {
        const result = [];
        if (this._showWhenTestStateIn.length === 0 || document.isUntitled) {
            return result;
        }
        const filePath = document.fileName;
        const testResults = this.testResultProvider.getResults(filePath);
        const fileName = path_1.basename(document.fileName);
        for (const test of testResults) {
            if (!this.showCodeLensAboveTest(test)) {
                continue;
            }
            const start = new vscode.Position(test.start.line, test.start.column);
            const end = new vscode.Position(test.end.line, test.start.column + 5);
            const range = new vscode.Range(start, end);
            result.push(new DebugCodeLens_1.DebugCodeLens(range, fileName, test.name));
        }
        return result;
    }
    showCodeLensAboveTest(test) {
        const state = TestState_1.TestStateByTestReconciliationState[test.status];
        return this._showWhenTestStateIn.includes(state);
    }
    resolveCodeLens(codeLens, _) {
        if (codeLens instanceof DebugCodeLens_1.DebugCodeLens) {
            codeLens.command = {
                arguments: [codeLens.fileName, helpers_1.escapeRegExp(codeLens.testName)],
                command: `${appGlobals_1.extensionName}.run-test`,
                title: 'Debug',
            };
        }
        return codeLens;
    }
    didChange() {
        this.onDidChange.fire();
    }
}
exports.DebugCodeLensProvider = DebugCodeLensProvider;
//# sourceMappingURL=DebugCodeLensProvider.js.map