"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class Parser {
    constructor() {
        this.tags = [];
        this.expression = "";
        this.delimiter = "";
        this.highlightMultilineComments = false;
        // * this is used to trigger the events when a supported language code is found
        this.supportedLanguage = true;
        // Read from the package.json
        this.contributions = vscode.workspace.getConfiguration('better-comments');
        this.setTags();
    }
    /**
     * Sets the regex to be used by the matcher based on the config specified in the package.json
     * @param languageCode The short code of the current language
     * https://code.visualstudio.com/docs/languages/identifiers
     */
    SetRegex(languageCode) {
        this.setDelimiter(languageCode);
        let characters = [];
        for (let commentTag of this.tags) {
            characters.push(commentTag.escapedTag);
        }
        // start by finding the delimiter (//, --, #, ') with optional spaces or tabs
        this.expression = "(" + this.delimiter.replace(/\//ig, "\\/") + ")+( |\t)*";
        // Apply all configurable comment start tags
        this.expression += "(";
        this.expression += characters.join("|");
        this.expression += ")+(.*)";
    }
    /**
     * Finds all single line comments delimted by a given delimter and matching tags specified in package.json
     * @param activeEditor  The active text editor containing the code document
     */
    FindSingleLineComments(activeEditor) {
        let text = activeEditor.document.getText();
        let regEx = new RegExp(this.expression, "ig");
        let match;
        while (match = regEx.exec(text)) {
            let startPos = activeEditor.document.positionAt(match.index);
            let endPos = activeEditor.document.positionAt(match.index + match[0].length);
            let range = { range: new vscode.Range(startPos, endPos) };
            // Find which custom delimiter was used in order to add it to the collection
            let matchString = match[3];
            let matchTag = this.tags.find(item => item.tag.toLowerCase() == match[3].toLowerCase());
            if (matchTag) {
                matchTag.ranges.push(range);
            }
        }
    }
    /**
     * Finds all multiline comments starting with /*
     * @param activeEditor The active text editor containing the code document
     */
    FindMultilineComments(activeEditor, findJSDoc = false) {
        // If highlight multiline is off in package.json or doesn't apply to his language, return
        if (!this.highlightMultilineComments)
            return;
        let text = activeEditor.document.getText();
        // Build up regex matcher for custom delimter tags
        let characters = [];
        for (let commentTag of this.tags) {
            characters.push(commentTag.escapedTag);
        }
        // Combine custom delimiters and the rest of the comment block matcher
        let commentMatchString = "";
        let regEx;
        if (findJSDoc) {
            commentMatchString = "(^)+([ \\t]*\\*[ \\t]*)("; // Highlight after leading *
            regEx = /(^|[ \t])(\/\*\*)+([\s\S]*?)(\*\/)/gm; // Find rows of comments matching pattern /** */		
        }
        else {
            commentMatchString = "(^)+([ \\t]*[ \\t]*)("; // Don't expect the leading *
            regEx = /(^|[ \t])(\/\*[^*])+([\s\S]*?)(\*\/)/gm; // Find rows of comments matching pattern /* */
        }
        commentMatchString += characters.join("|");
        commentMatchString += ")([ ]*|[:])+([^*/][^\\r\\n]*)";
        let commentRegEx = new RegExp(commentMatchString, "igm");
        // Find the multiline comment block
        let match;
        while (match = regEx.exec(text)) {
            let commentBlock = match[0];
            // Find the line
            let line;
            while (line = commentRegEx.exec(commentBlock)) {
                let startPos = activeEditor.document.positionAt(match.index + line.index + line[2].length);
                let endPos = activeEditor.document.positionAt(match.index + line.index + line[0].length);
                let range = { range: new vscode.Range(startPos, endPos) };
                // Find which custom delimiter was used in order to add it to the collection
                let matchString = line[3];
                let matchTag = this.tags.find(item => item.tag.toLowerCase() == matchString.toLowerCase());
                if (matchTag) {
                    matchTag.ranges.push(range);
                }
            }
        }
    }
    /**
     * Apply decorations after finding all relevant comments
     * @param activeEditor The active text editor containing the code document
     */
    ApplyDecorations(activeEditor) {
        for (let tag of this.tags) {
            activeEditor.setDecorations(tag.decoration, tag.ranges);
            // clear the ranges for the next pass
            tag.ranges.length = 0;
        }
    }
    /**
     * Sets the comment delimiter [//, #, --, '] of a given language
     * @param languageCode The short code of the current language
     * https://code.visualstudio.com/docs/languages/identifiers
     */
    setDelimiter(languageCode) {
        this.supportedLanguage = true;
        switch (languageCode) {
            case "c":
            case "cpp":
            case "csharp":
            case "css":
            case "fsharp":
            case "go":
            case "haxe":
            case "java":
            case "javascript":
            case "javascriptreact":
            case "kotlin":
            case "less":
            case "pascal":
            case "objectpascal":
            case "php":
            case "rust":
            case "scala":
            case "swift":
            case "typescript":
                this.delimiter = "//";
                this.highlightMultilineComments = this.contributions.multilineComments;
                break;
            case "coffeescript":
            case "dockerfile":
            case "elixir":
            case "graphql":
            case "julia":
            case "makefile":
            case "perl":
            case "perl6":
            case "powershell":
            case "python":
            case "r":
            case "ruby":
            case "shellscript":
            case "yaml":
                this.delimiter = "#";
                break;
            case "ada":
            case "haskell":
            case "plsql":
            case "sql":
            case "lua":
                this.delimiter = "--";
                break;
            case "vb":
                this.delimiter = "'";
                break;
            case "erlang":
            case "latex":
                this.delimiter = "%";
                break;
            case "clojure":
            case "racket":
            case "lisp":
                this.delimiter = ";";
                break;
            case "terraform":
                this.delimiter = "#";
                this.highlightMultilineComments = this.contributions.multilineComments;
                break;
            default:
                this.supportedLanguage = false;
                break;
        }
    }
    setTags() {
        let items = this.contributions.tags;
        for (let item of items) {
            let options = { color: item.color };
            if (item.strikethrough) {
                options.textDecoration = "line-through";
            }
            let escapedSequence = item.tag.replace(/([()[{*+.$^\\|?])/g, '\\$1');
            this.tags.push({
                tag: item.tag,
                escapedTag: escapedSequence.replace(/\//gi, "\\/"),
                ranges: [],
                decoration: vscode.window.createTextEditorDecorationType(options)
            });
        }
    }
}
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map