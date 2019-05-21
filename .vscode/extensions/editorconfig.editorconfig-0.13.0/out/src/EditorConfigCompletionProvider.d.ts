import { CompletionItemProvider, CompletionItem, Position, TextDocument } from 'vscode';
declare class EditorConfigCompletionProvider implements CompletionItemProvider {
    private readonly properties;
    provideCompletionItems(document: TextDocument, position: Position): CompletionItem[];
    resolveCompletionItem(item: CompletionItem): CompletionItem;
    private autoCompletePropertyValues;
    private autoCompletePropertyNames;
    private hasPropertyKey;
    private hasEqualsSign;
    private extractPropertyName;
    private filterPropertyValues;
    private convertPropertyNamesToCompletionItems;
    private convertPropertyValuesToCompletionItems;
}
export default EditorConfigCompletionProvider;
