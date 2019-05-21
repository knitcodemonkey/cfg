import { ExtensionContext } from 'vscode';
import { applyTextEditorOptions, fromEditorConfig, resolveCoreConfig, resolveTextEditorOptions, toEditorConfig } from './api';
/**
 * Main entry
 */
export declare function activate(ctx: ExtensionContext): {
    applyTextEditorOptions: typeof applyTextEditorOptions;
    fromEditorConfig: typeof fromEditorConfig;
    resolveCoreConfig: typeof resolveCoreConfig;
    resolveTextEditorOptions: typeof resolveTextEditorOptions;
    toEditorConfig: typeof toEditorConfig;
};
