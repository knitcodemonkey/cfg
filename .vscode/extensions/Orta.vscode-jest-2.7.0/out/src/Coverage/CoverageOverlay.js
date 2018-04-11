"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DefaultFormatter_1 = require("./Formatters/DefaultFormatter");
const vscode = require("vscode");
const editor_1 = require("../editor");
class CoverageOverlay {
    constructor(coverageMapProvider, enabled = CoverageOverlay.defaultVisibility) {
        this._enabled = enabled;
        this.formatter = new DefaultFormatter_1.DefaultFormatter(coverageMapProvider);
    }
    get enabled() {
        return this._enabled;
    }
    set enabled(value) {
        this._enabled = value;
        this.updateVisibleEditors();
    }
    toggleVisibility() {
        this._enabled = !this._enabled;
        this.updateVisibleEditors();
    }
    updateVisibleEditors() {
        for (const editor of vscode.window.visibleTextEditors) {
            this.update(editor);
        }
    }
    update(editor) {
        if (!editor_1.hasDocument(editor)) {
            return;
        }
        if (this._enabled) {
            this.formatter.format(editor);
        }
        else {
            this.formatter.clear(editor);
        }
    }
}
CoverageOverlay.defaultVisibility = false;
exports.CoverageOverlay = CoverageOverlay;
//# sourceMappingURL=CoverageOverlay.js.map