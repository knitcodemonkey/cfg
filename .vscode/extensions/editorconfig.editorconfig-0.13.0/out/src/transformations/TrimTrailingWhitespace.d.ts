import { KnownProps } from 'editorconfig';
import { TextDocument, TextEdit, TextDocumentSaveReason } from 'vscode';
import PreSaveTransformation from './PreSaveTransformation';
declare class TrimTrailingWhitespace extends PreSaveTransformation {
    transform(editorconfigProperties: KnownProps, doc: TextDocument, reason: TextDocumentSaveReason): {
        edits: Error;
        message: string;
    } | {
        edits: any[];
        message?: undefined;
    } | {
        edits: TextEdit[];
        message: string;
    };
    private trimLineTrailingWhitespace;
    private trimTrailingWhitespace;
}
export default TrimTrailingWhitespace;
