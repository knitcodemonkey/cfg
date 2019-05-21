"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DefaultFormatter_1 = require("./Formatters/DefaultFormatter");
const GutterFormatter_1 = require("./Formatters/GutterFormatter");
const vscode = require("vscode");
const editor_1 = require("../editor");
class CoverageOverlay {
    constructor(context, coverageMapProvider, enabled = CoverageOverlay.defaultVisibility, coverageFormatter = CoverageOverlay.defaultFormatter) {
        this._enabled = enabled;
        switch (coverageFormatter) {
            case 'GutterFormatter':
                this.formatter = new GutterFormatter_1.GutterFormatter(context, coverageMapProvider);
                break;
            default:
                this.formatter = new DefaultFormatter_1.DefaultFormatter(coverageMapProvider);
                break;
        }
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
CoverageOverlay.defaultFormatter = 'DefaultFormatter';
exports.CoverageOverlay = CoverageOverlay;
//# sourceMappingURL=CoverageOverlay.js.map