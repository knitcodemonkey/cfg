"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractFormatter_1 = require("./AbstractFormatter");
const vscode = require("vscode");
const helpers_1 = require("./helpers");
class DefaultFormatter extends AbstractFormatter_1.AbstractFormatter {
    format(editor) {
        const fileCoverage = this.coverageMapProvider.getFileCoverage(editor.document.fileName);
        if (!fileCoverage) {
            return;
        }
        this.formatBranches(editor, fileCoverage);
        this.formatUncoveredLines(editor, fileCoverage);
    }
    formatBranches(editor, fileCoverage) {
        const ranges = [];
        Object.keys(fileCoverage.b).forEach(branchIndex => {
            fileCoverage.b[branchIndex].forEach((hitCount, locationIndex) => {
                if (hitCount > 0) {
                    return;
                }
                const branch = fileCoverage.branchMap[branchIndex].locations[locationIndex];
                if (!helpers_1.isValidLocation(branch)) {
                    return;
                }
                ranges.push(new vscode.Range(branch.start.line - 1, branch.start.column, branch.end.line - 1, branch.end.column));
            });
        });
        editor.setDecorations(uncoveredBranch, ranges);
    }
    formatUncoveredLines(editor, fileCoverage) {
        const lines = fileCoverage.getUncoveredLines();
        const ranges = [];
        for (const oneBasedLineNumber of lines) {
            const zeroBasedLineNumber = Number(oneBasedLineNumber) - 1;
            ranges.push(new vscode.Range(zeroBasedLineNumber, 0, zeroBasedLineNumber, 0));
        }
        editor.setDecorations(uncoveredLine, ranges);
    }
    clear(editor) {
        editor.setDecorations(uncoveredLine, []);
        editor.setDecorations(uncoveredBranch, []);
    }
}
exports.DefaultFormatter = DefaultFormatter;
const uncoveredBranch = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(216,134,123,0.4)',
    overviewRulerColor: 'rgba(216,134,123,0.8)',
    overviewRulerLane: vscode.OverviewRulerLane.Left,
});
const uncoveredLine = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    backgroundColor: 'rgba(216,134,123,0.4)',
    overviewRulerColor: 'rgba(216,134,123,0.8)',
    overviewRulerLane: vscode.OverviewRulerLane.Left,
});
//# sourceMappingURL=DefaultFormatter.js.map