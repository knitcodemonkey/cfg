const vscode = require('vscode')
const _ = require('lodash')
const { workspace, window } = vscode
const exportsMap = require('./exports-map')
const addImportStatement = require('./add-import-statement')
const getSubstringUntilLastImportStatement = require('./get-substring-until-last-import-statement')
const config = workspace.getConfiguration('vscode-exports-autocomplete')
const undeclaredIdentifiers = require('babylon-undeclared-identifiers')
const parse = require('./parse')
const shouldCompleteIdentifiers = require('./should-complete-identifiers')

module.exports = () => {
  const { activeTextEditor } = window
  if (!activeTextEditor) {
    return
  }
  const { document } = activeTextEditor

  const currentDocument = {
    path: document.uri.path
  }

  return workspace.onDidChangeTextDocument(event => {
    let newDocumentPath = event.document.uri.path
    if (newDocumentPath !== currentDocument.path) {
      currentDocument.path = newDocumentPath
      return
    }
    const documentText = event.document.getText()
    if (!event.contentChanges || !event.contentChanges[0]) {
      return
    }
    let { text, range } = event.contentChanges[0]
    text = text.trim()
    if (text.length <= 2 || text.length > 1000) {
      return
    }
    if (text.includes('import')) {
      return
    }

    let editorAST
    try {
      editorAST = parse(documentText)
    } catch (err) {}
    const documentOffset = document.offsetAt(range.start)
    if (!shouldCompleteIdentifiers(editorAST, documentOffset)) {
      return
    }

    let identifiers
    try {
      identifiers = undeclaredIdentifiers(text)
    } catch (err) {
      identifiers = _.uniq(text.split(/\W+/))
    }

    identifiers = identifiers.filter(word => {
      return word.length >= config.minimumWordLengthToImportOnPaste
    })
    if (identifiers.length === 0) {
      return
    }
    const importStatementsText = getSubstringUntilLastImportStatement(
      documentText
    )
    const importsLineMatch = importStatementsText.match(/\n/g)
    let importsLineCount = 0
    if (importsLineMatch) {
      importsLineCount = importsLineMatch.length + 1
    }
    if (importsLineCount > activeTextEditor.selection.end.line) {
      return
    }

    let previousText = documentText.replace(event.contentChanges[0].text, '')
    const allImportsNeeded = []
    const addImportIfNeeded = (file, exp) => {
      if (identifiers.includes(exp.name) && !previousText.includes(exp.name)) {
        allImportsNeeded.push([exp, file])
        identifiers.splice(identifiers.indexOf(exp.name), 1)
      }
    }
    for (let [key, exps] of exportsMap.dependencies) {
      exps.forEach(exp => {
        addImportIfNeeded(key, exp)
      })
    }

    for (let [key, exps] of exportsMap.project) {
      exps.forEach(exp => {
        addImportIfNeeded(key, exp)
      })
    }

    allImportsNeeded.reduce((promise, pair) => {
      return promise.then(() => {
        return addImportStatement(pair[0], pair[1])
      })
    }, Promise.resolve(true))

    currentDocument.text = event.document.getText()
  })
}
