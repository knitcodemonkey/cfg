/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const events = require("events");
const vscode = require("vscode");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/localizedConstants");
const Utils = require("../models/utils");
const sqlOutputContentProvider_1 = require("../models/sqlOutputContentProvider");
const languageService_1 = require("../models/contracts/languageService");
const statusView_1 = require("../views/statusView");
const connectionManager_1 = require("./connectionManager");
const serviceclient_1 = require("../languageservice/serviceclient");
const adapter_1 = require("../prompts/adapter");
const telemetry_1 = require("../models/telemetry");
const vscodeWrapper_1 = require("./vscodeWrapper");
const untitledSqlDocumentService_1 = require("./untitledSqlDocumentService");
const path = require("path");
const fs = require("fs");
/**
 * The main controller class that initializes the extension
 */
class MainController {
    /**
     * The main controller constructor
     * @constructor
     */
    constructor(context, connectionManager, vscodeWrapper) {
        this._event = new events.EventEmitter();
        this._initialized = false;
        this._context = context;
        if (connectionManager) {
            this._connectionMgr = connectionManager;
        }
        this._vscodeWrapper = vscodeWrapper || new vscodeWrapper_1.default();
        this._untitledSqlDocumentService = new untitledSqlDocumentService_1.default(this._vscodeWrapper);
    }
    /**
     * Helper method to setup command registrations
     */
    registerCommand(command) {
        const self = this;
        this._context.subscriptions.push(vscode.commands.registerCommand(command, () => {
            self._event.emit(command);
        }));
    }
    /**
     * Disposes the controller
     */
    dispose() {
        this.deactivate();
    }
    /**
     * Deactivates the extension
     */
    deactivate() {
        Utils.logDebug('de-activated.');
        this.onDisconnect();
        this._statusview.dispose();
    }
    /**
     * Initializes the extension
     */
    activate() {
        const self = this;
        let activationTimer = new Utils.Timer();
        // initialize the language client then register the commands
        return this.initialize(activationTimer).then((didInitialize) => {
            if (didInitialize) {
                // register VS Code commands
                this.registerCommand(Constants.cmdConnect);
                this._event.on(Constants.cmdConnect, () => { self.runAndLogErrors(self.onNewConnection(), 'onNewConnection'); });
                this.registerCommand(Constants.cmdDisconnect);
                this._event.on(Constants.cmdDisconnect, () => { self.runAndLogErrors(self.onDisconnect(), 'onDisconnect'); });
                this.registerCommand(Constants.cmdRunQuery);
                this._event.on(Constants.cmdRunQuery, () => { self.onRunQuery(); });
                this.registerCommand(Constants.cmdManageConnectionProfiles);
                this._event.on(Constants.cmdRunCurrentStatement, () => { self.onRunCurrentStatement(); });
                this.registerCommand(Constants.cmdRunCurrentStatement);
                this._event.on(Constants.cmdManageConnectionProfiles, () => { self.runAndLogErrors(self.onManageProfiles(), 'onManageProfiles'); });
                this.registerCommand(Constants.cmdChooseDatabase);
                this._event.on(Constants.cmdChooseDatabase, () => { self.runAndLogErrors(self.onChooseDatabase(), 'onChooseDatabase'); });
                this.registerCommand(Constants.cmdChooseLanguageFlavor);
                this._event.on(Constants.cmdChooseLanguageFlavor, () => { self.runAndLogErrors(self.onChooseLanguageFlavor(), 'onChooseLanguageFlavor'); });
                this.registerCommand(Constants.cmdCancelQuery);
                this._event.on(Constants.cmdCancelQuery, () => { self.onCancelQuery(); });
                this.registerCommand(Constants.cmdShowGettingStarted);
                this._event.on(Constants.cmdShowGettingStarted, () => { self.launchGettingStartedPage(); });
                this.registerCommand(Constants.cmdNewQuery);
                this._event.on(Constants.cmdNewQuery, () => { self.runAndLogErrors(self.onNewQuery(), 'onNewQuery'); });
                this.registerCommand(Constants.cmdRebuildIntelliSenseCache);
                this._event.on(Constants.cmdRebuildIntelliSenseCache, () => { self.onRebuildIntelliSense(); });
                // Add handlers for VS Code generated commands
                this._vscodeWrapper.onDidCloseTextDocument(params => this.onDidCloseTextDocument(params));
                this._vscodeWrapper.onDidOpenTextDocument(params => this.onDidOpenTextDocument(params));
                this._vscodeWrapper.onDidSaveTextDocument(params => this.onDidSaveTextDocument(params));
                return true;
            }
        });
    }
    /**
     * Returns a flag indicating if the extension is initialized
     */
    isInitialized() {
        return this._initialized;
    }
    /**
     * Initializes the extension
     */
    initialize(activationTimer) {
        const self = this;
        // initialize language service client
        return new Promise((resolve, reject) => {
            // Ensure telemetry is disabled
            telemetry_1.default.disable();
            serviceclient_1.default.instance.initialize(self._context).then(serverResult => {
                // Init status bar
                self._statusview = new statusView_1.default(self._vscodeWrapper);
                // Init CodeAdapter for use when user response to questions is needed
                self._prompter = new adapter_1.default();
                // Init content provider for results pane
                self._outputContentProvider = new sqlOutputContentProvider_1.SqlOutputContentProvider(self._context, self._statusview);
                // Init connection manager and connection MRU
                self._connectionMgr = new connectionManager_1.default(self._context, self._statusview, self._prompter);
                activationTimer.end();
                // telemetry for activation
                telemetry_1.default.sendTelemetryEvent('ExtensionActivated', {}, { activationTime: activationTimer.getDuration(), serviceInstalled: serverResult.installedBeforeInitializing ? 1 : 0 });
                self.showReleaseNotesPrompt();
                // Handle case where SQL file is the 1st opened document
                const activeTextEditor = this._vscodeWrapper.activeTextEditor;
                if (activeTextEditor && this._vscodeWrapper.isEditingSqlFile) {
                    this.onDidOpenTextDocument(activeTextEditor.document);
                }
                Utils.logDebug('activated.');
                self._initialized = true;
                resolve(true);
            }).catch(err => {
                telemetry_1.default.sendTelemetryEventForException(err, 'initialize');
                reject(err);
            });
        });
    }
    /**
     * Handles the command to cancel queries
     */
    onCancelQuery() {
        if (!this.canRunCommand() || !this.validateTextDocumentHasFocus()) {
            return;
        }
        try {
            let uri = this._vscodeWrapper.activeTextEditorUri;
            telemetry_1.default.sendTelemetryEvent('CancelQuery');
            this._outputContentProvider.cancelQuery(uri);
        }
        catch (err) {
            telemetry_1.default.sendTelemetryEventForException(err, 'onCancelQuery');
        }
    }
    /**
     * Choose a new database from the current server
     */
    onChooseDatabase() {
        if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
            return this._connectionMgr.onChooseDatabase();
        }
        return Promise.resolve(false);
    }
    /**
     * Choose a language flavor for the SQL document. Should be either "MSSQL" or "Other"
     * to indicate that intellisense and other services should not be provided
     */
    onChooseLanguageFlavor() {
        if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
            const fileUri = this._vscodeWrapper.activeTextEditorUri;
            if (fileUri && this._vscodeWrapper.isEditingSqlFile) {
                this._connectionMgr.onChooseLanguageFlavor();
            }
            else {
                this._vscodeWrapper.showWarningMessage(LocalizedConstants.msgOpenSqlFile);
            }
        }
        return Promise.resolve(false);
    }
    /**
     * Close active connection, if any
     */
    onDisconnect() {
        if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
            let fileUri = this._vscodeWrapper.activeTextEditorUri;
            let queryRunner = this._outputContentProvider.getQueryRunner(fileUri);
            if (queryRunner && queryRunner.isExecutingQuery) {
                this._outputContentProvider.cancelQuery(fileUri);
            }
            return this._connectionMgr.onDisconnect();
        }
        return Promise.resolve(false);
    }
    /**
     * Manage connection profiles (create, edit, remove).
     */
    onManageProfiles() {
        if (this.canRunCommand()) {
            telemetry_1.default.sendTelemetryEvent('ManageProfiles');
            return this._connectionMgr.onManageProfiles();
        }
        return Promise.resolve(false);
    }
    /**
     * Let users pick from a list of connections
     */
    onNewConnection() {
        if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
            return this._connectionMgr.onNewConnection();
        }
        return Promise.resolve(false);
    }
    /**
     * Clear and rebuild the IntelliSense cache
     */
    onRebuildIntelliSense() {
        if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
            const fileUri = this._vscodeWrapper.activeTextEditorUri;
            if (fileUri && this._vscodeWrapper.isEditingSqlFile) {
                this._statusview.languageServiceStatusChanged(fileUri, LocalizedConstants.updatingIntelliSenseStatus);
                serviceclient_1.default.instance.sendNotification(languageService_1.RebuildIntelliSenseNotification.type, {
                    ownerUri: fileUri
                });
            }
            else {
                this._vscodeWrapper.showWarningMessage(LocalizedConstants.msgOpenSqlFile);
            }
        }
    }
    /**
     * execute the SQL statement for the current cursor position
     */
    onRunCurrentStatement(callbackThis) {
        // the 'this' context is lost in retry callback, so capture it here
        let self = callbackThis ? callbackThis : this;
        try {
            if (!self.canRunCommand()) {
                return;
            }
            if (!self.canRunV2Command()) {
                // Notify the user that this is not supported on this version
                this._vscodeWrapper.showErrorMessage(LocalizedConstants.macSierraRequiredErrorMessage);
                return;
            }
            if (!self.validateTextDocumentHasFocus()) {
                return;
            }
            // check if we're connected and editing a SQL file
            if (self.isRetryRequiredBeforeQuery(self.onRunCurrentStatement)) {
                return;
            }
            telemetry_1.default.sendTelemetryEvent('RunCurrentStatement');
            let editor = self._vscodeWrapper.activeTextEditor;
            let uri = self._vscodeWrapper.activeTextEditorUri;
            let title = path.basename(editor.document.fileName);
            // return early if the document does contain any text
            if (editor.document.getText(undefined).trim().length === 0) {
                return;
            }
            // only the start line and column are used to determine the current statement
            let querySelection = {
                startLine: editor.selection.start.line,
                startColumn: editor.selection.start.character,
                endLine: 0,
                endColumn: 0
            };
            self._outputContentProvider.runCurrentStatement(self._statusview, uri, querySelection, title);
        }
        catch (err) {
            telemetry_1.default.sendTelemetryEventForException(err, 'onRunCurrentStatement');
        }
    }
    /**
     * get the T-SQL query from the editor, run it and show output
     */
    onRunQuery(callbackThis) {
        // the 'this' context is lost in retry callback, so capture it here
        let self = callbackThis ? callbackThis : this;
        try {
            if (!self.canRunCommand() || !self.validateTextDocumentHasFocus()) {
                return;
            }
            // check if we're connected and editing a SQL file
            if (self.isRetryRequiredBeforeQuery(self.onRunQuery)) {
                return;
            }
            let editor = self._vscodeWrapper.activeTextEditor;
            let uri = self._vscodeWrapper.activeTextEditorUri;
            let title = path.basename(editor.document.fileName);
            let querySelection;
            // Calculate the selection if we have a selection, otherwise we'll use null to indicate
            // the entire document is the selection
            if (!editor.selection.isEmpty) {
                let selection = editor.selection;
                querySelection = {
                    startLine: selection.start.line,
                    startColumn: selection.start.character,
                    endLine: selection.end.line,
                    endColumn: selection.end.character
                };
            }
            // Trim down the selection. If it is empty after selecting, then we don't execute
            let selectionToTrim = editor.selection.isEmpty ? undefined : editor.selection;
            if (editor.document.getText(selectionToTrim).trim().length === 0) {
                return;
            }
            telemetry_1.default.sendTelemetryEvent('RunQuery');
            self._outputContentProvider.runQuery(self._statusview, uri, querySelection, title);
        }
        catch (err) {
            telemetry_1.default.sendTelemetryEventForException(err, 'onRunQuery');
        }
    }
    /**
     * Check if the state is ready to execute a query and retry
     * the query execution method if needed
     */
    isRetryRequiredBeforeQuery(retryMethod) {
        let self = this;
        if (!self._vscodeWrapper.isEditingSqlFile) {
            // Prompt the user to change the language mode to SQL before running a query
            self._connectionMgr.connectionUI.promptToChangeLanguageMode().then(result => {
                if (result) {
                    retryMethod(self);
                }
            }).catch(err => {
                self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgError + err);
            });
            return true;
        }
        else if (!self._connectionMgr.isConnected(self._vscodeWrapper.activeTextEditorUri)) {
            // If we are disconnected, prompt the user to choose a connection before executing
            self.onNewConnection().then(result => {
                if (result) {
                    retryMethod(self);
                }
            }).catch(err => {
                self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgError + err);
            });
            return true;
        }
        else {
            // we don't need to do anything to configure environment before running query
            return false;
        }
    }
    /**
     * Executes a callback and logs any errors raised
     */
    runAndLogErrors(promise, handlerName) {
        let self = this;
        return promise.catch(err => {
            self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgError + err);
            telemetry_1.default.sendTelemetryEventForException(err, handlerName);
            return undefined;
        });
    }
    /**
     * Access the connection manager for testing
     */
    get connectionManager() {
        return this._connectionMgr;
    }
    set connectionManager(connectionManager) {
        this._connectionMgr = connectionManager;
    }
    set untitledSqlDocumentService(untitledSqlDocumentService) {
        this._untitledSqlDocumentService = untitledSqlDocumentService;
    }
    /**
     * Verifies the extension is initilized and if not shows an error message
     */
    canRunCommand() {
        if (this._connectionMgr === undefined) {
            Utils.showErrorMsg(LocalizedConstants.extensionNotInitializedError);
            return false;
        }
        return true;
    }
    /**
     * Return whether or not some text document currently has focus, and display an error message if not
     */
    validateTextDocumentHasFocus() {
        if (this._vscodeWrapper.activeTextEditorUri === undefined) {
            Utils.showErrorMsg(LocalizedConstants.noActiveEditorMsg);
            return false;
        }
        return true;
    }
    /**
     * Verifies the tools service version is high enough to support certain commands
     */
    canRunV2Command() {
        let version = serviceclient_1.default.instance.getServiceVersion();
        return version > 1;
    }
    /**
     * Prompt the user to view release notes if this is new extension install
     */
    showReleaseNotesPrompt() {
        let self = this;
        if (!this.doesExtensionLaunchedFileExist()) {
            // ask the user to view a scenario document
            let confirmText = 'View Now';
            this._vscodeWrapper.showInformationMessage('View mssql for Visual Studio Code release notes?', confirmText)
                .then((choice) => {
                if (choice === confirmText) {
                    self.launchReleaseNotesPage();
                }
            });
        }
    }
    /**
     * Shows the release notes page in the preview browser
     */
    launchReleaseNotesPage() {
        vscode.env.openExternal(vscode.Uri.parse(Constants.changelogLink));
    }
    /**
     * Shows the Getting Started page in the preview browser
     */
    launchGettingStartedPage() {
        vscode.env.openExternal(vscode.Uri.parse(Constants.gettingStartedGuideLink));
    }
    /**
     * Opens a new query and creates new connection
     */
    onNewQuery() {
        if (this.canRunCommand()) {
            return this._untitledSqlDocumentService.newQuery().then(x => {
                return this._connectionMgr.onNewConnection();
            });
        }
        return Promise.resolve(false);
    }
    /**
     * Check if the extension launched file exists.
     * This is to detect when we are running in a clean install scenario.
     */
    doesExtensionLaunchedFileExist() {
        // check if file already exists on disk
        let filePath = this._context.asAbsolutePath('extensionlaunched.dat');
        try {
            // this will throw if the file does not exist
            fs.statSync(filePath);
            return true;
        }
        catch (err) {
            try {
                // write out the "first launch" file if it doesn't exist
                fs.writeFile(filePath, 'launched', (err) => {
                    return;
                });
            }
            catch (err) {
                // ignore errors writing first launch file since there isn't really
                // anything we can do to recover in this situation.
            }
            return false;
        }
    }
    /**
     * Called by VS Code when a text document closes. This will dispatch calls to other
     * controllers as needed. Determines if this was a normal closed file, a untitled closed file,
     * or a renamed file
     * @param doc The document that was closed
     */
    onDidCloseTextDocument(doc) {
        if (this._connectionMgr === undefined) {
            // Avoid processing events before initialization is complete
            return;
        }
        let closedDocumentUri = doc.uri.toString();
        let closedDocumentUriScheme = doc.uri.scheme;
        // Stop timers if they have been started
        if (this._lastSavedTimer) {
            this._lastSavedTimer.end();
        }
        if (this._lastOpenedTimer) {
            this._lastOpenedTimer.end();
        }
        // Determine which event caused this close event
        // If there was a saveTextDoc event just before this closeTextDoc event and it
        // was untitled then we know it was an untitled save
        if (this._lastSavedUri &&
            closedDocumentUriScheme === LocalizedConstants.untitledScheme &&
            this._lastSavedTimer.getDuration() < Constants.untitledSaveTimeThreshold) {
            // Untitled file was saved and connection will be transfered
            this._connectionMgr.transferFileConnection(closedDocumentUri, this._lastSavedUri);
            // If there was an openTextDoc event just before this closeTextDoc event then we know it was a rename
        }
        else if (this._lastOpenedUri &&
            this._lastOpenedTimer.getDuration() < Constants.renamedOpenTimeThreshold) {
            // File was renamed and connection will be transfered
            this._connectionMgr.transferFileConnection(closedDocumentUri, this._lastOpenedUri);
        }
        else {
            // Pass along the close event to the other handlers for a normal closed file
            this._connectionMgr.onDidCloseTextDocument(doc);
            this._outputContentProvider.onDidCloseTextDocument(doc);
        }
        // Reset special case timers and events
        this._lastSavedUri = undefined;
        this._lastSavedTimer = undefined;
        this._lastOpenedTimer = undefined;
        this._lastOpenedUri = undefined;
    }
    /**
     * Called by VS Code when a text document is opened. Checks if a SQL file was opened
     * to enable features of our extension for the document.
     */
    onDidOpenTextDocument(doc) {
        if (this._connectionMgr === undefined) {
            // Avoid processing events before initialization is complete
            return;
        }
        this._connectionMgr.onDidOpenTextDocument(doc);
        if (doc && doc.languageId === Constants.languageId) {
            this._statusview.languageFlavorChanged(doc.uri.toString(), Constants.mssqlProviderName);
        }
        // Setup properties incase of rename
        this._lastOpenedTimer = new Utils.Timer();
        this._lastOpenedTimer.start();
        this._lastOpenedUri = doc.uri.toString();
    }
    /**
     * Called by VS Code when a text document is saved. Will trigger a timer to
     * help determine if the file was a file saved from an untitled file.
     * @param doc The document that was saved
     */
    onDidSaveTextDocument(doc) {
        if (this._connectionMgr === undefined) {
            // Avoid processing events before initialization is complete
            return;
        }
        let savedDocumentUri = doc.uri.toString();
        // Keep track of which file was last saved and when for detecting the case when we save an untitled document to disk
        this._lastSavedTimer = new Utils.Timer();
        this._lastSavedTimer.start();
        this._lastSavedUri = savedDocumentUri;
    }
}
exports.default = MainController;

//# sourceMappingURL=mainController.js.map
