const os = require('os')
const platform = os.platform()
const path = require('path')

const {
  Position,
  window,
  workspace
} = require('vscode')

const usesSemi = require('./uses-semi')

const {
  getImportDeclarations
} = require('./get-imports')
const parse = require('./parse')
const modifyImportStatement = require('./modify-import-statement')
const getSubstringUntilLastImportStatement = require('./get-substring-until-last-import-statement')
const config = workspace.getConfiguration('vscode-exports-autocomplete')

const addImportStatement = (ex, filePath) => {
  const {activeTextEditor} = window
  const {document} = activeTextEditor
  let relPath = filePath
  if (path.isAbsolute(filePath)) {
    relPath = path.relative(path.dirname(document.uri.path), filePath)
    const lastDot = relPath.lastIndexOf('.')
    relPath = relPath.substr(0, lastDot)
    if (relPath.indexOf('.') === -1) {
      relPath = './' + relPath
    }
    if (platform === 'win32') {
      relPath = relPath.replace(/\\/g, '/') // we don't want windows style paths
    }
  }

  const editorText = document.getText()
  const quoteChar = config.quoteCharOverride || "'"
  let lineEnding = '\n'
  try {
    if (usesSemi(document.fileName)) {
      lineEnding = ';\n'
    }
  } catch (err) {
    // ignore these errors
  }
  const importStatementsText = getSubstringUntilLastImportStatement(editorText)
  try {
    const editorAST = parse(importStatementsText)
  } catch (err) {
    return  // bail-we can't do anything if it's not parseable
  }
  let positionForNewImport = new Position(0, 0)

  const importASTNodes = getImportDeclarations(editorAST)
  const lastImportNode = importASTNodes[importASTNodes.length - 1]
  if (lastImportNode) {
    positionForNewImport = new Position(lastImportNode.loc.end.line, 0)
  }

  const existingImportNode = importASTNodes.find((node) => {
    return node.source.value === relPath
  })

  let importToken = ex.name
  if (ex.default !== true) {
    importToken = `{${ex.name}}`
  }
  if (existingImportNode) {
    const {newImportStatement, existingImportRange} = modifyImportStatement(ex, existingImportNode, document)
    return activeTextEditor.edit(editBuilder => {
      editBuilder.replace(existingImportRange, newImportStatement)
    })
  } else {
    return activeTextEditor.edit(editBuilder => {
      editBuilder.insert(positionForNewImport, `import ${importToken} from ${quoteChar}${relPath}${quoteChar}${lineEnding}`)
    })
  }
}

module.exports = addImportStatement
