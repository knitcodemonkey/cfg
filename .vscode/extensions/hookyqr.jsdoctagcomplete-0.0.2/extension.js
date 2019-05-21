"use strict";
let vscode = require('vscode');
let JSDocElements = require('./jsdoc');



function activate(context) {
	let keys = Object.keys(JSDocElements);
	let completions = keys.map(key => {
		let e = JSDocElements[key];
		let r = new vscode.CompletionItem(key + " ");
		r.documentation = e.desc;
		//r.kind = vscode.CompletionItemKind.Property;
		r.kind = vscode.CompletionItemKind.Snippet;
		if (e.snip) {
			r.insertText = key + " " + e.snip+"{{}}";
		}
		if (e.detail) {
			r.detail = e.detail;
		}
		return r;
	});
	let provider = {
		provideCompletionItems(doc, pos) {
			const line = doc.lineAt(pos)
				.text;
			let prefix = line.slice(0, pos.character);
			if (!prefix.includes('@')) return [];
			//first, make sure there's an '@' on the line
			const txt = doc.getText();
			const matcher = /\/\*\*[^\*](?:\r|\n|.)*?\*\//g;
			let match = matcher.exec(txt);
			let p = doc.offsetAt(pos);
			while (match) {
				if (match.index > p) {
					match = null;
					break;
				}
				if (match.index < p && match.index + match[0].length > p) {
					break;
				}
				match = matcher.exec(txt);
			}
			if (!match) return [];
			p = prefix.lastIndexOf('@');
			prefix = prefix.slice(p + 1);
			if (prefix.match(/\s/)) return [];
			return completions;
		}
	};
	let disp = vscode.languages.registerCompletionItemProvider(["javascript","typescript"], provider, ["@"]);
	context.subscriptions.push(disp);
}
exports.activate = activate;
