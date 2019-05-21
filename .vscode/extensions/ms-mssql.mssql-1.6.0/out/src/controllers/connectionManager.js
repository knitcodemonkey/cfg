'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const connectionCredentials_1 = require("../models/connectionCredentials");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/localizedConstants");
const ConnectionContracts = require("../models/contracts/connection");
const LanguageServiceContracts = require("../models/contracts/languageService");
const Utils = require("../models/utils");
const connectionStore_1 = require("../models/connectionStore");
const connectionUI_1 = require("../views/connectionUI");
const serviceclient_1 = require("../languageservice/serviceclient");
const telemetry_1 = require("../models/telemetry");
const vscodeWrapper_1 = require("./vscodeWrapper");
const platform_1 = require("../models/platform");
/**
 * Information for a document's connection. Exported for testing purposes.
 */
class ConnectionInfo {
    get loginFailed() {
        return this.errorNumber && this.errorNumber === Constants.errorLoginFailed;
    }
}
exports.ConnectionInfo = ConnectionInfo;
// ConnectionManager class is the main controller for connection management
class ConnectionManager {
    constructor(context, statusView, prompter, _client, _vscodeWrapper, _connectionStore, _connectionUI) {
        this._client = _client;
        this._vscodeWrapper = _vscodeWrapper;
        this._connectionStore = _connectionStore;
        this._connectionUI = _connectionUI;
        this._context = context;
        this._statusView = statusView;
        this._prompter = prompter;
        this._connections = {};
        if (!this.client) {
            this.client = serviceclient_1.default.instance;
        }
        if (!this.vscodeWrapper) {
            this.vscodeWrapper = new vscodeWrapper_1.default();
        }
        if (!this._connectionStore) {
            this._connectionStore = new connectionStore_1.ConnectionStore(context);
        }
        if (!this._connectionUI) {
            this._connectionUI = new connectionUI_1.ConnectionUI(this, this._connectionStore, prompter, this.vscodeWrapper);
        }
        if (this.client !== undefined) {
            this.client.onNotification(ConnectionContracts.ConnectionChangedNotification.type, this.handleConnectionChangedNotification());
            this.client.onNotification(ConnectionContracts.ConnectionCompleteNotification.type, this.handleConnectionCompleteNotification());
            this.client.onNotification(LanguageServiceContracts.IntelliSenseReadyNotification.type, this.handleLanguageServiceUpdateNotification());
        }
    }
    /**
     * Exposed for testing purposes
     */
    get vscodeWrapper() {
        return this._vscodeWrapper;
    }
    /**
     * Exposed for testing purposes
     */
    set vscodeWrapper(wrapper) {
        this._vscodeWrapper = wrapper;
    }
    /**
     * Exposed for testing purposes
     */
    get client() {
        return this._client;
    }
    /**
     * Exposed for testing purposes
     */
    set client(client) {
        this._client = client;
    }
    /**
     * Get the connection view.
     */
    get connectionUI() {
        return this._connectionUI;
    }
    /**
     * Exposed for testing purposes
     */
    get statusView() {
        return this._statusView;
    }
    /**
     * Exposed for testing purposes
     */
    set statusView(value) {
        this._statusView = value;
    }
    /**
     * Exposed for testing purposes
     */
    get connectionStore() {
        return this._connectionStore;
    }
    /**
     * Exposed for testing purposes
     */
    set connectionStore(value) {
        this._connectionStore = value;
    }
    /**
     * Exposed for testing purposes
     */
    get connectionCount() {
        return Object.keys(this._connections).length;
    }
    isConnected(fileUri) {
        return (fileUri in this._connections && this._connections[fileUri].connectionId && Utils.isNotEmpty(this._connections[fileUri].connectionId));
    }
    isConnecting(fileUri) {
        return (fileUri in this._connections && this._connections[fileUri].connecting);
    }
    /**
     * Exposed for testing purposes.
     */
    getConnectionInfo(fileUri) {
        return this._connections[fileUri];
    }
    /**
     * Public for testing purposes only.
     */
    handleLanguageServiceUpdateNotification() {
        // Using a lambda here to perform variable capture on the 'this' reference
        const self = this;
        return (event) => {
            self._statusView.languageServiceStatusChanged(event.ownerUri, LocalizedConstants.intelliSenseUpdatedStatus);
            let connection = self.getConnectionInfo(event.ownerUri);
            if (connection !== undefined) {
                connection.intelliSenseTimer.end();
                let duration = connection.intelliSenseTimer.getDuration();
                let numberOfCharacters = 0;
                if (this.vscodeWrapper.activeTextEditor !== undefined
                    && this.vscodeWrapper.activeTextEditor.document !== undefined) {
                    let document = this.vscodeWrapper.activeTextEditor.document;
                    numberOfCharacters = document.getText().length;
                }
                telemetry_1.default.sendTelemetryEvent('IntelliSenseActivated', {
                    isAzure: connection.serverInfo && connection.serverInfo.isCloud ? '1' : '0'
                }, {
                    duration: duration,
                    fileSize: numberOfCharacters
                });
            }
        };
    }
    /**
     * Public for testing purposes only.
     */
    handleConnectionChangedNotification() {
        // Using a lambda here to perform variable capture on the 'this' reference
        const self = this;
        return (event) => {
            if (self.isConnected(event.ownerUri)) {
                let connectionInfo = self._connections[event.ownerUri];
                connectionInfo.credentials.server = event.connection.serverName;
                connectionInfo.credentials.database = event.connection.databaseName;
                connectionInfo.credentials.user = event.connection.userName;
                self._statusView.connectSuccess(event.ownerUri, connectionInfo.credentials, connectionInfo.serverInfo);
                let logMessage = Utils.formatString(LocalizedConstants.msgChangedDatabaseContext, event.connection.databaseName, event.ownerUri);
                self.vscodeWrapper.logToOutputChannel(logMessage);
            }
        };
    }
    /**
     * Public for testing purposes only.
     */
    handleConnectionCompleteNotification() {
        // Using a lambda here to perform variable capture on the 'this' reference
        const self = this;
        return (result) => {
            let fileUri = result.ownerUri;
            let connection = self.getConnectionInfo(fileUri);
            connection.serviceTimer.end();
            connection.connecting = false;
            let mruConnection = {};
            if (Utils.isNotEmpty(result.connectionId)) {
                // We have a valid connection
                // Copy credentials as the database name will be updated
                let newCredentials = {};
                Object.assign(newCredentials, connection.credentials);
                if (result.connectionSummary && result.connectionSummary.databaseName) {
                    newCredentials.database = result.connectionSummary.databaseName;
                }
                self.handleConnectionSuccess(fileUri, connection, newCredentials, result);
                mruConnection = connection.credentials;
            }
            else {
                self.handleConnectionErrors(fileUri, connection, result);
                mruConnection = undefined;
            }
            self.tryAddMruConnection(connection, mruConnection);
        };
    }
    handleConnectionSuccess(fileUri, connection, newCredentials, result) {
        connection.connectionId = result.connectionId;
        connection.serverInfo = result.serverInfo;
        connection.credentials = newCredentials;
        connection.errorNumber = undefined;
        connection.errorMessage = undefined;
        this.statusView.connectSuccess(fileUri, newCredentials, connection.serverInfo);
        this.statusView.languageServiceStatusChanged(fileUri, LocalizedConstants.updatingIntelliSenseStatus);
        this._vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgConnectedServerInfo, connection.credentials.server, fileUri, JSON.stringify(connection.serverInfo)));
        connection.extensionTimer.end();
        telemetry_1.default.sendTelemetryEvent('DatabaseConnected', {
            connectionType: connection.serverInfo ? (connection.serverInfo.isCloud ? 'Azure' : 'Standalone') : '',
            serverVersion: connection.serverInfo ? connection.serverInfo.serverVersion : '',
            serverEdition: connection.serverInfo ? connection.serverInfo.serverEdition : '',
            serverOs: connection.serverInfo ? this.getIsServerLinux(connection.serverInfo.osVersion) : ''
        }, {
            isEncryptedConnection: connection.credentials.encrypt ? 1 : 0,
            isIntegratedAuthentication: connection.credentials.authenticationType === 'Integrated' ? 1 : 0,
            extensionConnectionTime: connection.extensionTimer.getDuration() - connection.serviceTimer.getDuration(),
            serviceConnectionTime: connection.serviceTimer.getDuration()
        });
    }
    handleConnectionErrors(fileUri, connection, result) {
        if (result.errorNumber && result.errorMessage && !Utils.isEmpty(result.errorMessage)) {
            // Check if the error is an expired password
            if (result.errorNumber === Constants.errorPasswordExpired || result.errorNumber === Constants.errorPasswordNeedsReset) {
                // TODO: we should allow the user to change their password here once corefx supports SqlConnection.ChangePassword()
                Utils.showErrorMsg(Utils.formatString(LocalizedConstants.msgConnectionErrorPasswordExpired, result.errorNumber, result.errorMessage));
            }
            else if (result.errorNumber !== Constants.errorLoginFailed) {
                Utils.showErrorMsg(Utils.formatString(LocalizedConstants.msgConnectionError, result.errorNumber, result.errorMessage));
            }
            connection.errorNumber = result.errorNumber;
            connection.errorMessage = result.errorMessage;
        }
        else {
            platform_1.PlatformInformation.GetCurrent().then(platformInfo => {
                if (!platformInfo.isWindows() && result.errorMessage && result.errorMessage.includes('Kerberos')) {
                    this.vscodeWrapper.showErrorMessage(Utils.formatString(LocalizedConstants.msgConnectionError2, result.errorMessage), LocalizedConstants.macOpenSslHelpButton)
                        .then(action => {
                        if (action && action === LocalizedConstants.macOpenSslHelpButton) {
                            vscode.env.openExternal(vscode.Uri.parse(Constants.integratedAuthHelpLink));
                        }
                    });
                }
                else if (platformInfo.runtimeId === platform_1.Runtime.OSX_10_11_64 &&
                    result.messages.indexOf('Unable to load DLL \'System.Security.Cryptography.Native\'') !== -1) {
                    this.vscodeWrapper.showErrorMessage(Utils.formatString(LocalizedConstants.msgConnectionError2, LocalizedConstants.macOpenSslErrorMessage), LocalizedConstants.macOpenSslHelpButton).then(action => {
                        if (action && action === LocalizedConstants.macOpenSslHelpButton) {
                            vscode.env.openExternal(vscode.Uri.parse(Constants.macOpenSslHelpLink));
                        }
                    });
                }
                else {
                    Utils.showErrorMsg(Utils.formatString(LocalizedConstants.msgConnectionError2, result.messages));
                }
            });
        }
        this.statusView.connectError(fileUri, connection.credentials, result);
        this.vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgConnectionFailed, connection.credentials.server, result.errorMessage ? result.errorMessage : result.messages));
    }
    tryAddMruConnection(connection, newConnection) {
        if (newConnection) {
            let connectionToSave = Object.assign({}, newConnection);
            this._connectionStore.addRecentlyUsed(connectionToSave)
                .then(() => {
                connection.connectHandler(true);
            }, err => {
                connection.connectHandler(false, err);
            });
        }
        else {
            connection.connectHandler(false);
        }
    }
    /**
     * Clear the recently used connections list in the connection store
     */
    clearRecentConnectionsList() {
        return this.connectionStore.clearRecentlyUsed();
    }
    // choose database to use on current server
    onChooseDatabase() {
        const self = this;
        const fileUri = this.vscodeWrapper.activeTextEditorUri;
        return new Promise((resolve, reject) => {
            if (!self.isConnected(fileUri)) {
                self.vscodeWrapper.showWarningMessage(LocalizedConstants.msgChooseDatabaseNotConnected);
                resolve(false);
                return;
            }
            // Get list of databases on current server
            let listParams = new ConnectionContracts.ListDatabasesParams();
            listParams.ownerUri = fileUri;
            self.client.sendRequest(ConnectionContracts.ListDatabasesRequest.type, listParams).then((result) => {
                // Then let the user select a new database to connect to
                self.connectionUI.showDatabasesOnCurrentServer(self._connections[fileUri].credentials, result.databaseNames).then(newDatabaseCredentials => {
                    if (newDatabaseCredentials) {
                        self.vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgChangingDatabase, newDatabaseCredentials.database, newDatabaseCredentials.server, fileUri));
                        self.disconnect(fileUri).then(() => {
                            self.connect(fileUri, newDatabaseCredentials).then(() => {
                                telemetry_1.default.sendTelemetryEvent('UseDatabase');
                                self.vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgChangedDatabase, newDatabaseCredentials.database, newDatabaseCredentials.server, fileUri));
                                resolve(true);
                            }).catch(err => {
                                reject(err);
                            });
                        }).catch(err => {
                            reject(err);
                        });
                    }
                    else {
                        resolve(false);
                    }
                }).catch(err => {
                    reject(err);
                });
            });
        });
    }
    onChooseLanguageFlavor() {
        const fileUri = this._vscodeWrapper.activeTextEditorUri;
        if (fileUri && this._vscodeWrapper.isEditingSqlFile) {
            return this._connectionUI.promptLanguageFlavor().then(flavor => {
                if (!flavor) {
                    return false;
                }
                this.statusView.languageFlavorChanged(fileUri, flavor);
                serviceclient_1.default.instance.sendNotification(LanguageServiceContracts.LanguageFlavorChangedNotification.type, {
                    uri: fileUri,
                    language: 'sql',
                    flavor: flavor
                });
            });
        }
        else {
            this._vscodeWrapper.showWarningMessage(LocalizedConstants.msgOpenSqlFile);
            return Promise.resolve(false);
        }
    }
    // close active connection, if any
    onDisconnect() {
        return this.disconnect(this.vscodeWrapper.activeTextEditorUri);
    }
    disconnect(fileUri) {
        const self = this;
        return new Promise((resolve, reject) => {
            if (self.isConnected(fileUri)) {
                let disconnectParams = new ConnectionContracts.DisconnectParams();
                disconnectParams.ownerUri = fileUri;
                self.client.sendRequest(ConnectionContracts.DisconnectRequest.type, disconnectParams).then((result) => {
                    if (self.statusView) {
                        self.statusView.notConnected(fileUri);
                    }
                    if (result) {
                        telemetry_1.default.sendTelemetryEvent('DatabaseDisconnected');
                        self.vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgDisconnected, fileUri));
                    }
                    delete self._connections[fileUri];
                    resolve(result);
                });
            }
            else if (self.isConnecting(fileUri)) {
                // Prompt the user to cancel connecting
                self.onCancelConnect();
                resolve(true);
            }
            else {
                resolve(true);
            }
        });
    }
    /**
     * Helper to show all connections and perform connect logic.
     */
    showConnectionsAndConnect(resolve, reject, fileUri) {
        const self = this;
        // show connection picklist
        self.connectionUI.showConnections()
            .then(function (connectionCreds) {
            if (connectionCreds) {
                // close active connection
                self.disconnect(fileUri).then(function () {
                    // connect to the server/database
                    self.connect(fileUri, connectionCreds)
                        .then(result => {
                        self.handleConnectionResult(result, fileUri, connectionCreds).then(() => {
                            resolve(true);
                        });
                    });
                });
            }
            else {
                resolve(false);
            }
        });
    }
    /**
     * Verifies the connection result. If connection failed because of invalid credentials,
     * tries to connect again by asking user for different credentials
     * @param result Connection result
     * @param fileUri file Uri
     * @param connectionCreds Connection Profile
     */
    handleConnectionResult(result, fileUri, connectionCreds) {
        const self = this;
        return new Promise((resolve, reject) => {
            let connection = self._connections[fileUri];
            if (!result && connection && connection.loginFailed) {
                self.connectionUI.createProfileWithDifferentCredentials(connectionCreds).then(newConnection => {
                    if (newConnection) {
                        self.connect(fileUri, newConnection).then(newResult => {
                            connection = self._connections[fileUri];
                            if (!newResult && connection && connection.loginFailed) {
                                Utils.showErrorMsg(Utils.formatString(LocalizedConstants.msgConnectionError, connection.errorNumber, connection.errorMessage));
                            }
                            resolve(newResult);
                        });
                    }
                    else {
                        resolve(true);
                    }
                });
            }
            else {
                resolve(true);
            }
        });
    }
    // let users pick from a picklist of connections
    onNewConnection() {
        const self = this;
        const fileUri = this.vscodeWrapper.activeTextEditorUri;
        return new Promise((resolve, reject) => {
            if (!fileUri) {
                // A text document needs to be open before we can connect
                self.vscodeWrapper.showWarningMessage(LocalizedConstants.msgOpenSqlFile);
                resolve(false);
                return;
            }
            else if (!self.vscodeWrapper.isEditingSqlFile) {
                self.connectionUI.promptToChangeLanguageMode().then(result => {
                    if (result) {
                        self.showConnectionsAndConnect(resolve, reject, fileUri);
                    }
                    else {
                        resolve(false);
                    }
                });
                return;
            }
            self.showConnectionsAndConnect(resolve, reject, fileUri);
        });
    }
    // create a new connection with the connectionCreds provided
    connect(fileUri, connectionCreds) {
        const self = this;
        return new Promise((resolve, reject) => {
            let connectionInfo = new ConnectionInfo();
            connectionInfo.extensionTimer = new Utils.Timer();
            connectionInfo.intelliSenseTimer = new Utils.Timer();
            connectionInfo.credentials = connectionCreds;
            connectionInfo.connecting = true;
            this._connections[fileUri] = connectionInfo;
            // Note: must call flavor changed before connecting, or the timer showing an animation doesn't occur
            if (self.statusView) {
                self.statusView.languageFlavorChanged(fileUri, Constants.mssqlProviderName);
                self.statusView.connecting(fileUri, connectionCreds);
                self.statusView.languageFlavorChanged(fileUri, Constants.mssqlProviderName);
            }
            self.vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgConnecting, connectionCreds.server, fileUri));
            // Setup the handler for the connection complete notification to call
            connectionInfo.connectHandler = ((connectResult, error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(connectResult);
                }
            });
            // package connection details for request message
            const connectionDetails = connectionCredentials_1.ConnectionCredentials.createConnectionDetails(connectionCreds);
            let connectParams = new ConnectionContracts.ConnectParams();
            connectParams.ownerUri = fileUri;
            connectParams.connection = connectionDetails;
            connectionInfo.serviceTimer = new Utils.Timer();
            // send connection request message to service host
            self.client.sendRequest(ConnectionContracts.ConnectionRequest.type, connectParams).then((result) => {
                if (!result) {
                    // Failed to process connect request
                    resolve(false);
                }
            }, err => {
                // Catch unexpected errors and return over the Promise reject callback
                reject(err);
            });
        });
    }
    onCancelConnect() {
        this.connectionUI.promptToCancelConnection().then(result => {
            if (result) {
                this.cancelConnect();
            }
        });
    }
    cancelConnect() {
        let fileUri = this.vscodeWrapper.activeTextEditorUri;
        if (!fileUri || Utils.isEmpty(fileUri)) {
            return;
        }
        let cancelParams = new ConnectionContracts.CancelConnectParams();
        cancelParams.ownerUri = fileUri;
        const self = this;
        this.client.sendRequest(ConnectionContracts.CancelConnectRequest.type, cancelParams).then(result => {
            if (result) {
                self.statusView.notConnected(fileUri);
            }
        });
    }
    /**
     * Called when the 'Manage Connection Profiles' command is issued.
     */
    onManageProfiles() {
        // Show quick pick to create, edit, or remove profiles
        return this._connectionUI.promptToManageProfiles();
    }
    onCreateProfile() {
        let self = this;
        return new Promise((resolve, reject) => {
            self.connectionUI.createAndSaveProfile(self.vscodeWrapper.isEditingSqlFile)
                .then(profile => resolve(profile ? true : false));
        });
    }
    onRemoveProfile() {
        return this.connectionUI.removeProfile();
    }
    onDidCloseTextDocument(doc) {
        let docUri = doc.uri.toString();
        // If this file isn't connected, then don't do anything
        if (!this.isConnected(docUri)) {
            return;
        }
        // Disconnect the document's connection when we close it
        this.disconnect(docUri);
    }
    onDidOpenTextDocument(doc) {
        let uri = doc.uri.toString();
        if (doc.languageId === 'sql' && typeof (this._connections[uri]) === 'undefined') {
            this.statusView.notConnected(uri);
        }
    }
    transferFileConnection(oldFileUri, newFileUri) {
        // Is the new file connected or the old file not connected?
        if (!this.isConnected(oldFileUri) || this.isConnected(newFileUri)) {
            return;
        }
        // Connect the saved uri and disconnect the untitled uri on successful connection
        let creds = this._connections[oldFileUri].credentials;
        this.connect(newFileUri, creds).then(result => {
            if (result) {
                this.disconnect(oldFileUri);
            }
        });
    }
    getIsServerLinux(osVersion) {
        if (osVersion) {
            if (osVersion.indexOf('Linux') !== -1) {
                return 'Linux';
            }
            else {
                return 'Windows';
            }
        }
        return '';
    }
}
exports.default = ConnectionManager;

//# sourceMappingURL=connectionManager.js.map
