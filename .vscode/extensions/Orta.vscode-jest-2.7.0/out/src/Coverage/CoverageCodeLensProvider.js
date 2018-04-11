"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function registerCoverageCodeLens(jestExt) {
    return [
        vscode.languages.registerCodeLensProvider({ pattern: '**/*.{ts,tsx,js,jsx}' }, new CoverageCodeLensProvider(jestExt)),
    ];
}
exports.registerCoverageCodeLens = registerCoverageCodeLens;
class CoverageCodeLensProvider {
    constructor(jestExt) {
        this.jestExt = jestExt;
    }
    provideCodeLenses(document, _token) {
        const coverage = this.jestExt.coverageMapProvider.getFileCoverage(document.fileName);
        if (!coverage) {
            return;
        }
        const summary = coverage.toSummary();
        const json = summary.toJSON();
        const metrics = Object.keys(json).reduce((previous, metric) => {
            return `${previous}${previous ? ', ' : ''}${metric}: ${json[metric].pct}%`;
        }, '');
        const range = new vscode.Range(0, 0, 0, 0);
        const command = {
            title: metrics,
            command: null,
        };
        return [new vscode.CodeLens(range, command)];
    }
}
//# sourceMappingURL=CoverageCodeLensProvider.js.map