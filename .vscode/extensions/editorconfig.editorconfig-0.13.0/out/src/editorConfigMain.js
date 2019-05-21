Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const EditorConfigCompletionProvider_1 = require("./EditorConfigCompletionProvider");
const DocumentWatcher_1 = require("./DocumentWatcher");
const generateEditorConfig_1 = require("./commands/generateEditorConfig");
const api_1 = require("./api");
/**
 * Main entry
 */
function activate(ctx) {
    ctx.subscriptions.push(new DocumentWatcher_1.default());
    // register .editorconfig file completion provider
    const editorConfigFileSelector = {
        language: 'properties',
        pattern: '**/.editorconfig',
        scheme: 'file',
    };
    vscode_1.languages.registerCompletionItemProvider(editorConfigFileSelector, new EditorConfigCompletionProvider_1.default());
    // register an internal command used to automatically display IntelliSense
    // when editing a .editorconfig file
    vscode_1.commands.registerCommand('editorconfig._triggerSuggestAfterDelay', () => {
        setTimeout(function () {
            vscode_1.commands.executeCommand('editor.action.triggerSuggest');
        }, 100);
    });
    // register a command handler to generate a .editorconfig file
    vscode_1.commands.registerCommand('EditorConfig.generate', generateEditorConfig_1.generateEditorConfig);
    return {
        applyTextEditorOptions: api_1.applyTextEditorOptions,
        fromEditorConfig: api_1.fromEditorConfig,
        resolveCoreConfig: api_1.resolveCoreConfig,
        resolveTextEditorOptions: api_1.resolveTextEditorOptions,
        toEditorConfig: api_1.toEditorConfig,
    };
}
exports.activate = activate;
//# sourceMappingURL=editorConfigMain.js.map