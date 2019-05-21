import { KnownProps } from 'editorconfig';
import { TextDocument, TextEdit } from 'vscode';
import PreSaveTransformation from './PreSaveTransformation';
export default class InsertFinalNewline extends PreSaveTransformation {
    private lineEndings;
    transform(editorconfigProperties: KnownProps, doc: TextDocument): {
        edits: any[];
        message?: undefined;
    } | {
        edits: TextEdit[];
        message: string;
    };
}
