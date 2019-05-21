import { TextEditorOptions } from 'vscode';
export default class DocumentWatcher {
    private outputChannel;
    private disposable;
    private defaults;
    private preSaveTransformations;
    private doc;
    constructor(outputChannel?: import("vscode").OutputChannel);
    onEmptyConfig: (relativePath: string) => void;
    onBeforeResolve: (relativePath: string) => void;
    onNoActiveTextEditor: () => void;
    onSuccess: (newOptions: TextEditorOptions) => void;
    private log;
    dispose(): void;
    onConfigChanged: () => void;
    private calculatePreSaveTransformations;
}
