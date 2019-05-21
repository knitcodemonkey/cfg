"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
class LanguageServiceHost {
    constructor() {
        this._files = {};
    }
    updateCurrentFile(fileName, fileText) {
        for (const existingFileName in this._files) {
            delete this._files[existingFileName].text;
        }
        if (this._files[fileName]) {
            this._files[fileName].version++;
            this._files[fileName].text = fileText;
        }
        else {
            this._files[fileName] = { text: fileText, version: 0 };
        }
    }
    getScriptFileNames() {
        return Object.keys(this._files);
    }
    getScriptVersion(fileName) {
        return this._files[fileName] && this._files[fileName].version.toString();
    }
    getScriptSnapshot(fileName) {
        return ts.ScriptSnapshot.fromString(this._files[fileName] ? this._files[fileName].text : "");
    }
    getCurrentDirectory() {
        return process.cwd();
    }
    getDefaultLibFileName(options) {
        return ts.getDefaultLibFilePath(options);
    }
    getCompilationSettings() {
        return {
            allowJs: true
        };
    }
    getSourceFile(fileName, languageVersion, onError) {
        if (!this._files[fileName]) {
            return;
        }
        return ts.createSourceFile(fileName, this._files[fileName].text, ts.ScriptTarget.Latest);
    }
}
exports.LanguageServiceHost = LanguageServiceHost;
//# sourceMappingURL=languageServiceHost.js.map