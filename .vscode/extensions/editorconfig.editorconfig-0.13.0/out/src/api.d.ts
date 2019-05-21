import * as editorconfig from 'editorconfig';
import { TextDocument, TextEditorOptions } from 'vscode';
/**
 * Resolves `TextEditorOptions` for a `TextDocument`, combining the editor's
 * default configuration with that of EditorConfig's configuration.
 */
export declare function resolveTextEditorOptions(doc: TextDocument, { defaults, onBeforeResolve, onEmptyConfig, }?: {
    defaults?: TextEditorOptions;
    onBeforeResolve?: (relativePath: string) => void;
    onEmptyConfig?: (relativePath?: string) => void;
}): Promise<TextEditorOptions>;
/**
 * Applies new `TextEditorOptions` to the active text editor.
 */
export declare function applyTextEditorOptions(newOptions: TextEditorOptions, { onNoActiveTextEditor, onSuccess, }?: {
    onNoActiveTextEditor?: () => void;
    onSuccess?: (newOptions: TextEditorOptions) => void;
}): Promise<void>;
/**
 * Picks EditorConfig-relevant props from the editor's default configuration.
 */
export declare function pickWorkspaceDefaults(): {
    /**
     * The number of spaces a tab is equal to. When `editor.detectIndentation`
     * is on, this property value will be `undefined`.
     */
    tabSize?: number;
    /**
     * Insert spaces when pressing `Tab`. When `editor.detectIndentation` is on,
     * this property value will be `undefined`.
     */
    insertSpaces?: boolean;
};
export interface ResolvedCoreConfig extends editorconfig.KnownProps {
    [rule: string]: string | number | boolean;
}
/**
 * Resolves an EditorConfig configuration for the file related to a
 * `TextDocument`.
 */
export declare function resolveCoreConfig(doc: TextDocument, { onBeforeResolve, }?: {
    onBeforeResolve?: (relativePath: string) => void;
}): Promise<ResolvedCoreConfig>;
export declare function resolveFile(doc: TextDocument): {
    fileName?: string;
    relativePath?: string;
};
/**
 * Convert .editorconfig values to vscode editor options
 */
export declare function fromEditorConfig(config?: editorconfig.KnownProps, defaults?: TextEditorOptions): TextEditorOptions;
/**
 * Convert vscode editor options to .editorconfig values
 */
export declare function toEditorConfig(options: TextEditorOptions): editorconfig.KnownProps;
