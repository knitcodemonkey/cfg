"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class DebugCodeLens extends vscode.CodeLens {
    constructor(range, fileName, testName) {
        super(range);
        this.fileName = fileName;
        this.testName = testName;
    }
}
exports.DebugCodeLens = DebugCodeLens;
//# sourceMappingURL=DebugCodeLens.js.map