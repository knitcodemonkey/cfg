"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const jest_editor_support_1 = require("jest-editor-support");
const micromatch_1 = require("micromatch");
const decorations = require("./decorations");
const status = require("./statusBar");
const TestResults_1 = require("./TestResults");
const helpers_1 = require("./helpers");
const fs_1 = require("fs");
const Coverage_1 = require("./Coverage");
const diagnostics_1 = require("./diagnostics");
const DebugCodeLens_1 = require("./DebugCodeLens");
const DebugConfigurationProvider_1 = require("./DebugConfigurationProvider");
const editor_1 = require("./editor");
const CoverageOverlay_1 = require("./Coverage/CoverageOverlay");
const JestProcessManagement_1 = require("./JestProcessManagement");
class JestExt {
    constructor(workspace, outputChannel, pluginSettings) {
        this.parsingTestFile = false;
        this.runTest = (fileName, identifier) => __awaiter(this, void 0, void 0, function* () {
            const restart = this.jestProcessManager.numberOfProcesses > 0;
            this.jestProcessManager.stopAll();
            this.debugConfigurationProvider.prepareTestRun(fileName, identifier);
            const handle = vscode.debug.onDidTerminateDebugSession(_ => {
                handle.dispose();
                if (restart) {
                    this.startProcess();
                }
            });
            const workspaceFolder = vscode.workspace.workspaceFolders[0];
            try {
                // try to run the debug configuration from launch.json
                yield vscode.debug.startDebugging(workspaceFolder, 'vscode-jest-tests');
            }
            catch (_a) {
                // if that fails, there (probably) isn't any debug configuration (at least no correctly named one)
                // therefore debug the test using the default configuration
                const debugConfiguration = this.debugConfigurationProvider.provideDebugConfigurations(workspaceFolder)[0];
                yield vscode.debug.startDebugging(workspaceFolder, debugConfiguration);
            }
        });
        this.workspace = workspace;
        this.channel = outputChannel;
        this.failingAssertionDecorators = {};
        this.failDiagnostics = vscode.languages.createDiagnosticCollection('Jest');
        this.clearOnNextInput = true;
        this.jestSettings = new jest_editor_support_1.Settings(workspace);
        this.pluginSettings = pluginSettings;
        this.coverageMapProvider = new Coverage_1.CoverageMapProvider();
        this.coverageOverlay = new CoverageOverlay_1.CoverageOverlay(this.coverageMapProvider, pluginSettings.showCoverageOnLoad);
        this.testResultProvider = new TestResults_1.TestResultProvider();
        this.debugCodeLensProvider = new DebugCodeLens_1.DebugCodeLensProvider(this.testResultProvider, pluginSettings.enableCodeLens);
        this.debugConfigurationProvider = new DebugConfigurationProvider_1.DebugConfigurationProvider();
        this.jestProcessManager = new JestProcessManagement_1.JestProcessManager({
            projectWorkspace: workspace,
            runAllTestsFirstInWatchMode: this.pluginSettings.runAllTestsFirst,
        });
        this.getSettings();
        // The theme stuff
        this.setupDecorators();
        // The bottom bar thing
        this.setupStatusBar();
        //reset the jest diagnostics
        diagnostics_1.resetDiagnostics(this.failDiagnostics);
        // If we should start the process by default, do so
        if (this.pluginSettings.autoEnable) {
            this.startProcess();
        }
        else {
            this.channel.appendLine('Skipping initial Jest runner process start.');
        }
    }
    handleStdErr(error) {
        const message = error.toString();
        if (this.shouldIgnoreOutput(message)) {
            return;
        }
        // The "tests are done" message comes through stdErr
        // We want to use this as a marker that the console should
        // be cleared, as the next input will be from a new test run.
        if (this.clearOnNextInput) {
            this.clearOnNextInput = false;
            this.parsingTestFile = false;
            this.channel.clear();
        }
        // thanks Qix, http://stackoverflow.com/questions/25245716/remove-all-ansi-colors-styles-from-strings
        const noANSI = message.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
        if (noANSI.includes('snapshot test failed')) {
            this.detectedSnapshotErrors();
        }
        this.channel.appendLine(noANSI);
    }
    assignHandlers(jestProcess) {
        jestProcess
            .onJestEditorSupportEvent('executableJSON', (data) => {
            this.updateWithData(data);
        })
            .onJestEditorSupportEvent('executableOutput', (output) => {
            if (!this.shouldIgnoreOutput(output)) {
                this.channel.appendLine(output);
            }
        })
            .onJestEditorSupportEvent('executableStdErr', (error) => this.handleStdErr(error))
            .onJestEditorSupportEvent('nonTerminalError', (error) => {
            this.channel.appendLine(`Received an error from Jest Runner: ${error.toString()}`);
        })
            .onJestEditorSupportEvent('exception', result => {
            this.channel.appendLine(`\nException raised: [${result.type}]: ${result.message}\n`);
        })
            .onJestEditorSupportEvent('terminalError', (error) => {
            this.channel.appendLine('\nException raised: ' + error);
        });
    }
    startProcess() {
        if (this.jestProcessManager.numberOfProcesses > 0) {
            return;
        }
        if (this.pluginSettings.runAllTestsFirst) {
            this.testsHaveStartedRunning();
        }
        this.jestProcess = this.jestProcessManager.startJestProcess({
            watch: true,
            keepAlive: true,
            exitCallback: (jestProcess, jestProcessInWatchMode) => {
                if (jestProcessInWatchMode) {
                    this.jestProcess = jestProcessInWatchMode;
                    this.channel.appendLine('Finished running all tests. Starting watch mode.');
                    status.running('Starting watch mode');
                    this.assignHandlers(this.jestProcess);
                }
                else {
                    status.stopped();
                    if (!jestProcess.stopRequested) {
                        this.channel.appendLine('Starting Jest in Watch mode failed too many times and has been stopped. Please check your system configuration.');
                    }
                }
            },
        });
        this.assignHandlers(this.jestProcess);
    }
    stopProcess() {
        this.channel.appendLine('Closing Jest');
        this.jestProcessManager.stopAll();
        status.stopped();
    }
    getSettings() {
        this.getJestVersion(jestVersionMajor => {
            if (jestVersionMajor < 20) {
                vscode.window.showErrorMessage('This extension relies on Jest 20+ features, it will continue to work, but some features may not work correctly.');
            }
            this.workspace.localJestMajorVersion = jestVersionMajor;
        });
        // Do nothing for the minute, the above ^ can come back once
        // https://github.com/facebook/jest/pull/3592 is deployed
        try {
            this.jestSettings.getConfig(() => { });
        }
        catch (error) {
            console.log('[vscode-jest] Getting Jest config crashed, likely due to Jest version being below version 20.');
        }
    }
    detectedSnapshotErrors() {
        if (!this.pluginSettings.enableSnapshotUpdateMessages) {
            return;
        }
        vscode.window
            .showInformationMessage('Would you like to update your Snapshots?', { title: 'Replace them' })
            .then(response => {
            // No response == cancel
            if (response) {
                this.jestProcess.runJestWithUpdateForSnapshots(() => {
                    if (this.pluginSettings.restartJestOnSnapshotUpdate) {
                        this.jestProcessManager.stopJestProcess(this.jestProcess).then(() => {
                            this.startProcess();
                        });
                        vscode.window.showInformationMessage('Updated Snapshots and restarted Jest.');
                    }
                    else {
                        vscode.window.showInformationMessage('Updated Snapshots. It will show in your next test run.');
                    }
                });
            }
        });
    }
    triggerUpdateDecorations(editor) {
        this.coverageOverlay.updateVisibleEditors();
        if (!this.canUpdateDecorators(editor)) {
            return;
        }
        // OK - lets go
        this.parsingTestFile = true;
        this.updateDotDecorators(editor);
        this.parsingTestFile = false;
    }
    triggerUpdateSettings(updatedSettings) {
        this.pluginSettings = updatedSettings;
        this.workspace.rootPath = updatedSettings.rootPath;
        this.workspace.pathToJest = helpers_1.pathToJest(updatedSettings);
        this.workspace.pathToConfig = helpers_1.pathToConfig(updatedSettings);
        this.jestSettings = new jest_editor_support_1.Settings(this.workspace);
        this.coverageOverlay.enabled = updatedSettings.showCoverageOnLoad;
        this.debugCodeLensProvider.enabled = updatedSettings.enableCodeLens;
        this.stopProcess();
        setTimeout(() => {
            this.startProcess();
        }, 500);
    }
    updateDotDecorators(editor) {
        const filePath = editor.document.fileName;
        const testResults = this.testResultProvider.getSortedResults(filePath);
        // Dots
        const styleMap = [
            { data: testResults.success, decorationType: this.passingItStyle, state: TestResults_1.TestReconciliationState.KnownSuccess },
            { data: testResults.fail, decorationType: this.failingItStyle, state: TestResults_1.TestReconciliationState.KnownFail },
            { data: testResults.skip, decorationType: this.skipItStyle, state: TestResults_1.TestReconciliationState.KnownSkip },
            { data: testResults.unknown, decorationType: this.unknownItStyle, state: TestResults_1.TestReconciliationState.Unknown },
        ];
        styleMap.forEach(style => {
            const decorators = this.generateDotsForItBlocks(style.data, style.state);
            editor.setDecorations(style.decorationType, decorators);
        });
        // Debug CodeLens
        this.debugCodeLensProvider.didChange();
        // Inline error messages
        this.resetInlineErrorDecorators(editor);
        if (this.pluginSettings.enableInlineErrorMessages) {
            const fileName = editor.document.fileName;
            testResults.fail.forEach(a => {
                const { style, decorator } = this.generateInlineErrorDecorator(fileName, a);
                editor.setDecorations(style, [decorator]);
            });
        }
    }
    resetInlineErrorDecorators(editor) {
        if (!this.failingAssertionDecorators[editor.document.fileName]) {
            this.failingAssertionDecorators[editor.document.fileName] = [];
            return;
        }
        if (editor_1.isOpenInMultipleEditors(editor.document)) {
            return;
        }
        this.failingAssertionDecorators[editor.document.fileName].forEach(element => {
            element.dispose();
        });
        this.failingAssertionDecorators[editor.document.fileName] = [];
    }
    generateInlineErrorDecorator(fileName, test) {
        const errorMessage = test.terseMessage || test.shortMessage;
        const decorator = {
            range: new vscode.Range(test.lineNumberOfError, 0, test.lineNumberOfError, 0),
            hoverMessage: errorMessage,
        };
        // We have to make a new style for each unique message, this is
        // why we have to remove off of them beforehand
        const style = decorations.failingAssertionStyle(errorMessage);
        this.failingAssertionDecorators[fileName].push(style);
        return { style, decorator };
    }
    canUpdateDecorators(editor) {
        const atEmptyScreen = !editor;
        if (atEmptyScreen) {
            return false;
        }
        const inSettings = !editor.document;
        if (inSettings) {
            return false;
        }
        if (this.parsingTestFile) {
            return false;
        }
        const isATestFile = this.wouldJestRunURI(editor.document.uri);
        return isATestFile;
    }
    wouldJestRunURI(uri) {
        const filePath = uri.fsPath;
        const globs = this.jestSettings.settings.testMatch;
        if (globs && globs.length) {
            const matchers = globs.map(each => micromatch_1.matcher(each, { dot: true }));
            const matched = matchers.some(isMatch => isMatch(filePath));
            return matched;
        }
        const root = this.pluginSettings.rootPath;
        let relative = path.normalize(path.relative(root, filePath));
        // replace windows path separator with normal slash
        if (path.sep === '\\') {
            relative = relative.replace(/\\/g, '/');
        }
        const testRegex = new RegExp(this.jestSettings.settings.testRegex);
        const matches = relative.match(testRegex);
        return matches && matches.length > 0;
    }
    setupStatusBar() {
        status.initial();
    }
    setupDecorators() {
        this.passingItStyle = decorations.passingItName();
        this.failingItStyle = decorations.failingItName();
        this.skipItStyle = decorations.skipItName();
        this.unknownItStyle = decorations.notRanItName();
    }
    shouldIgnoreOutput(text) {
        // this fails when snapshots change - to be revised - returning always false for now
        return text.includes('Watch Usage');
    }
    testsHaveStartedRunning() {
        this.channel.clear();
        status.running('initial full test run');
    }
    updateWithData(data) {
        const normalizedData = TestResults_1.resultsWithLowerCaseWindowsDriveLetters(data);
        this.coverageMapProvider.update(normalizedData.coverageMap);
        const statusList = this.testResultProvider.updateTestResults(normalizedData);
        diagnostics_1.updateDiagnostics(statusList, this.failDiagnostics);
        const failedFileCount = diagnostics_1.failedSuiteCount(this.failDiagnostics);
        if (failedFileCount <= 0 && normalizedData.success) {
            status.success();
        }
        else {
            status.failed(` (${failedFileCount} test suite${failedFileCount > 1 ? 's' : ''} failed)`);
        }
        for (const editor of vscode.window.visibleTextEditors) {
            this.triggerUpdateDecorations(editor);
        }
        this.clearOnNextInput = true;
    }
    generateDotsForItBlocks(blocks, state) {
        const nameForState = {
            [TestResults_1.TestReconciliationState.KnownSuccess]: 'Passed',
            [TestResults_1.TestReconciliationState.KnownFail]: 'Failed',
            [TestResults_1.TestReconciliationState.KnownSkip]: 'Skipped',
            [TestResults_1.TestReconciliationState.Unknown]: 'Test has not run yet, due to Jest only running tests related to changes.',
        };
        return blocks.map(it => {
            return {
                range: new vscode.Range(it.start.line, it.start.column, it.start.line, it.start.column + 1),
                hoverMessage: nameForState[state],
                /* ERROR: this needs to include all ancestor describe block names as well!
                  in code bellow it block has identifier = 'aaa bbb ccc': but name is only 'ccc'
        
                  describe('aaa', () => {
                    describe('bbb', () => {
                      it('ccc', () => {
                      });
                    });
                  });
                */
                identifier: it.name,
            };
        });
    }
    deactivate() {
        this.jestProcessManager.stopAll();
    }
    getJestVersion(version) {
        let ver = 18; // default to the last pre-20 release if nothing else can be determined
        const packageJSON = helpers_1.pathToJestPackageJSON(this.pluginSettings);
        if (packageJSON) {
            const contents = fs_1.readFileSync(packageJSON, 'utf8');
            const packageMetadata = JSON.parse(contents);
            if (packageMetadata['version']) {
                ver = parseInt(packageMetadata['version']);
            }
        }
        version(ver);
    }
    onDidCloseTextDocument(document) {
        this.removeCachedTestResults(document);
        this.removeCachedDecorationTypes(document);
    }
    removeCachedTestResults(document) {
        if (!document || document.isUntitled) {
            return;
        }
        const filePath = document.fileName;
        this.testResultProvider.removeCachedResults(filePath);
    }
    removeCachedDecorationTypes(document) {
        if (!document || !document.fileName) {
            return;
        }
        delete this.failingAssertionDecorators[document.fileName];
    }
    onDidChangeActiveTextEditor(editor) {
        if (!editor_1.hasDocument(editor)) {
            return;
        }
        this.triggerUpdateDecorations(editor);
    }
    /**
     * This event is fired with the document not dirty when:
     * - before the onDidSaveTextDocument event
     * - the document was changed by an external editor
     */
    onDidChangeTextDocument(event) {
        if (event.document.isDirty) {
            return;
        }
        if (event.document.uri.scheme === 'git') {
            return;
        }
        // Ignore a clean file with a change:
        if (event.contentChanges.length > 0) {
            return;
        }
        this.removeCachedTestResults(event.document);
        for (const editor of vscode.window.visibleTextEditors) {
            if (editor.document === event.document) {
                this.triggerUpdateDecorations(editor);
            }
        }
    }
    toggleCoverageOverlay() {
        this.coverageOverlay.toggleVisibility();
    }
}
exports.JestExt = JestExt;
//# sourceMappingURL=JestExt.js.map