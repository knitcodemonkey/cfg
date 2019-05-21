"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/localizedConstants");
const ConnInfo = require("../models/connectionInfo");
const Utils = require("../models/utils");
const vscodeWrapper_1 = require("../controllers/vscodeWrapper");
// Status bar element for each file in the editor
class FileStatusBar {
}
class StatusView {
    constructor(_vscodeWrapper) {
        this._vscodeWrapper = _vscodeWrapper;
        if (!this._vscodeWrapper) {
            this._vscodeWrapper = new vscodeWrapper_1.default();
        }
        this._statusBars = {};
        this._onDidChangeActiveTextEditorEvent = this._vscodeWrapper.onDidChangeActiveTextEditor((params) => this.onDidChangeActiveTextEditor(params));
        this._onDidCloseTextDocumentEvent = this._vscodeWrapper.onDidCloseTextDocument((params) => this.onDidCloseTextDocument(params));
    }
    dispose() {
        for (let bar in this._statusBars) {
            if (this._statusBars.hasOwnProperty(bar)) {
                this._statusBars[bar].statusLanguageFlavor.dispose();
                this._statusBars[bar].statusConnection.dispose();
                this._statusBars[bar].statusQuery.dispose();
                this._statusBars[bar].statusLanguageService.dispose();
                clearInterval(this._statusBars[bar].progressTimerId);
                delete this._statusBars[bar];
            }
        }
        this._onDidChangeActiveTextEditorEvent.dispose();
        this._onDidCloseTextDocumentEvent.dispose();
    }
    // Create status bar item if needed
    createStatusBar(fileUri) {
        let bar = new FileStatusBar();
        // set language flavor priority as always 90 since it's to show to the right of the file type
        bar.statusLanguageFlavor = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
        bar.statusConnection = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        bar.statusQuery = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        bar.statusLanguageService = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        this._statusBars[fileUri] = bar;
    }
    destroyStatusBar(fileUri) {
        let bar = this._statusBars[fileUri];
        if (bar) {
            if (bar.statusLanguageFlavor) {
                bar.statusLanguageFlavor.dispose();
            }
            if (bar.statusConnection) {
                bar.statusConnection.dispose();
            }
            if (bar.statusQuery) {
                bar.statusQuery.dispose();
            }
            if (bar.statusLanguageService) {
                bar.statusLanguageService.dispose();
            }
            if (bar.progressTimerId) {
                clearInterval(bar.progressTimerId);
            }
            delete this._statusBars[fileUri];
        }
    }
    getStatusBar(fileUri) {
        if (!(fileUri in this._statusBars)) {
            // Create it if it does not exist
            this.createStatusBar(fileUri);
        }
        let bar = this._statusBars[fileUri];
        if (bar.progressTimerId) {
            clearInterval(bar.progressTimerId);
        }
        return bar;
    }
    show(fileUri) {
        let bar = this.getStatusBar(fileUri);
        this.showStatusBarItem(fileUri, bar.statusLanguageFlavor);
        this.showStatusBarItem(fileUri, bar.statusConnection);
        this.showStatusBarItem(fileUri, bar.statusQuery);
        this.showStatusBarItem(fileUri, bar.statusLanguageService);
    }
    notConnected(fileUri) {
        let bar = this.getStatusBar(fileUri);
        bar.statusConnection.text = LocalizedConstants.notConnectedLabel;
        bar.statusConnection.tooltip = LocalizedConstants.notConnectedTooltip;
        bar.statusConnection.command = Constants.cmdConnect;
        this.showStatusBarItem(fileUri, bar.statusConnection);
        bar.statusLanguageService.text = '';
        this.showStatusBarItem(fileUri, bar.statusLanguageService);
        this.showStatusBarItem(fileUri, bar.statusLanguageFlavor);
    }
    connecting(fileUri, connCreds) {
        let bar = this.getStatusBar(fileUri);
        bar.statusConnection.text = LocalizedConstants.connectingLabel;
        bar.statusConnection.command = Constants.cmdDisconnect;
        bar.statusConnection.tooltip = LocalizedConstants.connectingTooltip + ConnInfo.getTooltip(connCreds);
        this.showStatusBarItem(fileUri, bar.statusConnection);
        this.showProgress(fileUri, LocalizedConstants.connectingLabel, bar.statusConnection);
    }
    connectSuccess(fileUri, connCreds, serverInfo) {
        let bar = this.getStatusBar(fileUri);
        bar.statusConnection.command = Constants.cmdChooseDatabase;
        bar.statusConnection.text = ConnInfo.getConnectionDisplayString(connCreds);
        bar.statusConnection.tooltip = ConnInfo.getTooltip(connCreds, serverInfo);
        this.showStatusBarItem(fileUri, bar.statusConnection);
    }
    connectError(fileUri, credentials, error) {
        let bar = this.getStatusBar(fileUri);
        bar.statusConnection.command = Constants.cmdConnect;
        bar.statusConnection.text = LocalizedConstants.connectErrorLabel;
        if (error.errorNumber && error.errorMessage && !Utils.isEmpty(error.errorMessage)) {
            bar.statusConnection.tooltip = LocalizedConstants.connectErrorTooltip + credentials.server + '\n' +
                LocalizedConstants.connectErrorCode + error.errorNumber + '\n' +
                LocalizedConstants.connectErrorMessage + error.errorMessage;
        }
        else {
            bar.statusConnection.tooltip = LocalizedConstants.connectErrorTooltip + credentials.server + '\n' +
                LocalizedConstants.connectErrorMessage + error.messages;
        }
        this.showStatusBarItem(fileUri, bar.statusConnection);
    }
    executingQuery(fileUri) {
        let bar = this.getStatusBar(fileUri);
        bar.statusQuery.command = undefined;
        bar.statusQuery.tooltip = LocalizedConstants.executeQueryLabel;
        this.showStatusBarItem(fileUri, bar.statusQuery);
        this.showProgress(fileUri, LocalizedConstants.executeQueryLabel, bar.statusQuery);
    }
    executedQuery(fileUri) {
        let bar = this.getStatusBar(fileUri);
        bar.statusQuery.hide();
    }
    cancelingQuery(fileUri) {
        let bar = this.getStatusBar(fileUri);
        bar.statusQuery.hide();
        bar.statusQuery.command = undefined;
        bar.statusQuery.tooltip = LocalizedConstants.cancelingQueryLabel;
        this.showStatusBarItem(fileUri, bar.statusQuery);
        this.showProgress(fileUri, LocalizedConstants.cancelingQueryLabel, bar.statusQuery);
    }
    languageServiceStatusChanged(fileUri, status) {
        let bar = this.getStatusBar(fileUri);
        bar.currentLanguageServiceStatus = status;
        this.updateStatusMessage(status, () => { return bar.currentLanguageServiceStatus; }, (message) => {
            bar.statusLanguageService.text = message;
            this.showStatusBarItem(fileUri, bar.statusLanguageService);
        });
    }
    languageFlavorChanged(fileUri, flavor) {
        let bar = this.getStatusBar(fileUri);
        bar.statusLanguageFlavor.text = flavor;
        bar.statusLanguageFlavor.command = Constants.cmdChooseLanguageFlavor;
        this.showStatusBarItem(fileUri, bar.statusLanguageFlavor);
    }
    updateStatusMessage(newStatus, getCurrentStatus, updateMessage) {
        switch (newStatus) {
            case LocalizedConstants.definitionRequestedStatus:
                setTimeout(() => {
                    if (getCurrentStatus() !== LocalizedConstants.definitionRequestCompletedStatus) {
                        updateMessage(LocalizedConstants.gettingDefinitionMessage);
                    }
                }, 500);
                break;
            case LocalizedConstants.definitionRequestCompletedStatus:
                updateMessage('');
                break;
            case LocalizedConstants.updatingIntelliSenseStatus:
                updateMessage(LocalizedConstants.updatingIntelliSenseLabel);
                break;
            case LocalizedConstants.intelliSenseUpdatedStatus:
                updateMessage('');
                break;
            default:
                Utils.logDebug(`Language service status changed. ${newStatus}`);
                break;
        }
    }
    /**
     * Associate a new uri with an existing Uri's status bar
     *
     * @param existingUri The already existing URI's status bar you want to associated
     * @param newUri The new URI you want to associate with the existing status bar
     * @return True or False whether the association was able to be made. False indicated the exitingUri specified
     * did not exist
     */
    associateWithExisting(existingUri, newUri) {
        let bar = this.getStatusBar(existingUri);
        if (bar) {
            this._statusBars[newUri] = bar;
            return true;
        }
        else {
            return false;
        }
    }
    hideLastShownStatusBar() {
        if (typeof this._lastShownStatusBar !== 'undefined') {
            this._lastShownStatusBar.statusLanguageFlavor.hide();
            this._lastShownStatusBar.statusConnection.hide();
            this._lastShownStatusBar.statusQuery.hide();
            this._lastShownStatusBar.statusLanguageService.hide();
        }
    }
    onDidChangeActiveTextEditor(editor) {
        // Hide the most recently shown status bar
        this.hideLastShownStatusBar();
        // Change the status bar to match the open file
        if (typeof editor !== 'undefined') {
            const fileUri = editor.document.uri.toString();
            const bar = this._statusBars[fileUri];
            if (bar) {
                this.showStatusBarItem(fileUri, bar.statusLanguageFlavor);
                this.showStatusBarItem(fileUri, bar.statusConnection);
                this.showStatusBarItem(fileUri, bar.statusLanguageService);
            }
        }
    }
    onDidCloseTextDocument(doc) {
        // Remove the status bar associated with the document
        this.destroyStatusBar(doc.uri.toString());
    }
    showStatusBarItem(fileUri, statusBarItem) {
        let currentOpenFile = Utils.getActiveTextEditorUri();
        // Only show the status bar if it matches the currently open file and is not empty
        if (fileUri === currentOpenFile && !Utils.isEmpty(statusBarItem.text)) {
            statusBarItem.show();
            if (fileUri in this._statusBars) {
                this._lastShownStatusBar = this._statusBars[fileUri];
            }
        }
        else {
            statusBarItem.hide();
        }
    }
    showProgress(fileUri, statusText, statusBarItem) {
        const self = this;
        let index = 0;
        let progressTicks = ['|', '/', '-', '\\'];
        let bar = this.getStatusBar(fileUri);
        bar.progressTimerId = setInterval(() => {
            index++;
            if (index > 3) {
                index = 0;
            }
            let progressTick = progressTicks[index];
            statusBarItem.text = statusText + ' ' + progressTick;
            self.showStatusBarItem(fileUri, statusBarItem);
        }, 200);
    }
}
exports.default = StatusView;

//# sourceMappingURL=statusView.js.map
