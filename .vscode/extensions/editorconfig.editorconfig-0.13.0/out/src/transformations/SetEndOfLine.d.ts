import { KnownProps } from 'editorconfig';
import { TextEdit } from 'vscode';
import PreSaveTransformation from './PreSaveTransformation';
declare class SetEndOfLine extends PreSaveTransformation {
    private eolMap;
    transform(editorconfigProperties: KnownProps): {
        edits: TextEdit[];
        message: string;
    } | {
        edits: any[];
        message?: undefined;
    };
}
export default SetEndOfLine;
