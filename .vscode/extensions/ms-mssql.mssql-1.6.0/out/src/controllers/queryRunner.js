'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const vscode = require("vscode");
const serviceclient_1 = require("../languageservice/serviceclient");
const queryNotificationHandler_1 = require("./queryNotificationHandler");
const vscodeWrapper_1 = require("./vscodeWrapper");
const queryExecute_1 = require("../models/contracts/queryExecute");
const queryDispose_1 = require("../models/contracts/queryDispose");
const queryCancel_1 = require("../models/contracts/queryCancel");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/localizedConstants");
const Utils = require("./../models/utils");
const os = require("os");
/*
* Query Runner class which handles running a query, reports the results to the content manager,
* and handles getting more rows from the service layer and disposing when the content is closed.
*/
class QueryRunner {
    // CONSTRUCTOR /////////////////////////////////////////////////////////
    constructor(_ownerUri, _editorTitle, _statusView, _client, _notificationHandler, _vscodeWrapper) {
        this._ownerUri = _ownerUri;
        this._editorTitle = _editorTitle;
        this._statusView = _statusView;
        this._client = _client;
        this._notificationHandler = _notificationHandler;
        this._vscodeWrapper = _vscodeWrapper;
        // MEMBER VARIABLES ////////////////////////////////////////////////////
        this._batchSets = [];
        this.eventEmitter = new events_1.EventEmitter();
        if (!_client) {
            this._client = serviceclient_1.default.instance;
        }
        if (!_notificationHandler) {
            this._notificationHandler = queryNotificationHandler_1.QueryNotificationHandler.instance;
        }
        if (!_vscodeWrapper) {
            this._vscodeWrapper = new vscodeWrapper_1.default();
        }
        // Store the state
        this._uri = _ownerUri;
        this._title = _editorTitle;
        this._isExecuting = false;
        this._totalElapsedMilliseconds = 0;
        this._hasCompleted = false;
    }
    // PROPERTIES //////////////////////////////////////////////////////////
    get uri() {
        return this._uri;
    }
    set uri(uri) {
        this._uri = uri;
    }
    get title() {
        return this._title;
    }
    set title(title) {
        this._title = title;
    }
    get batchSets() {
        return this._batchSets;
    }
    set batchSets(batchSets) {
        this._batchSets = batchSets;
    }
    get isExecutingQuery() {
        return this._isExecuting;
    }
    get hasCompleted() {
        return this._hasCompleted;
    }
    // PUBLIC METHODS ======================================================
    cancel() {
        // Make the request to cancel the query
        let cancelParams = { ownerUri: this._uri };
        return this._client.sendRequest(queryCancel_1.QueryCancelRequest.type, cancelParams);
    }
    // Pulls the query text from the current document/selection and initiates the query
    runStatement(line, column) {
        return this.doRunQuery({ startLine: line, startColumn: column, endLine: 0, endColumn: 0 }, (onSuccess, onError) => {
            // Put together the request
            let queryDetails = {
                ownerUri: this._uri,
                line: line,
                column: column
            };
            // Send the request to execute the query
            return this._client.sendRequest(queryExecute_1.QueryExecuteStatementRequest.type, queryDetails).then(onSuccess, onError);
        });
    }
    // Pulls the query text from the current document/selection and initiates the query
    runQuery(selection) {
        return this.doRunQuery(selection, (onSuccess, onError) => {
            // Put together the request
            let queryDetails = {
                ownerUri: this._uri,
                querySelection: selection
            };
            // Send the request to execute the query
            return this._client.sendRequest(queryExecute_1.QueryExecuteRequest.type, queryDetails).then(onSuccess, onError);
        });
    }
    // Pulls the query text from the current document/selection and initiates the query
    doRunQuery(selection, queryCallback) {
        const self = this;
        this._vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgStartedExecute, this._uri));
        // Update internal state to show that we're executing the query
        this._resultLineOffset = selection ? selection.startLine : 0;
        this._isExecuting = true;
        this._totalElapsedMilliseconds = 0;
        this._statusView.executingQuery(this.uri);
        let onSuccess = (result) => {
            // The query has started, so lets fire up the result pane
            self.eventEmitter.emit('start');
            self._notificationHandler.registerRunner(self, self._uri);
        };
        let onError = (error) => {
            self._statusView.executedQuery(self.uri);
            self._isExecuting = false;
            // TODO: localize
            self._vscodeWrapper.showErrorMessage('Execution failed: ' + error.message);
        };
        return queryCallback(onSuccess, onError);
    }
    // handle the result of the notification
    handleQueryComplete(result) {
        this._vscodeWrapper.logToOutputChannel(Utils.formatString(LocalizedConstants.msgFinishedExecute, this._uri));
        // Store the batch sets we got back as a source of "truth"
        this._isExecuting = false;
        this._hasCompleted = true;
        this._batchSets = result.batchSummaries;
        this._batchSets.map((batch) => {
            if (batch.selection) {
                batch.selection.startLine = batch.selection.startLine + this._resultLineOffset;
                batch.selection.endLine = batch.selection.endLine + this._resultLineOffset;
            }
        });
        // We're done with this query so shut down any waiting mechanisms
        this._statusView.executedQuery(this.uri);
        this.eventEmitter.emit('complete', Utils.parseNumAsTimeString(this._totalElapsedMilliseconds));
    }
    handleBatchStart(result) {
        let batch = result.batchSummary;
        // Recalculate the start and end lines, relative to the result line offset
        if (batch.selection) {
            batch.selection.startLine += this._resultLineOffset;
            batch.selection.endLine += this._resultLineOffset;
        }
        // Set the result sets as an empty array so that as result sets complete we can add to the list
        batch.resultSetSummaries = [];
        // Store the batch
        this._batchSets[batch.id] = batch;
        this.eventEmitter.emit('batchStart', batch);
    }
    handleBatchComplete(result) {
        let batch = result.batchSummary;
        // Store the batch again to get the rest of the data
        this._batchSets[batch.id] = batch;
        let executionTime = (Utils.parseTimeString(batch.executionElapsed) || 0);
        this._totalElapsedMilliseconds += executionTime;
        if (executionTime > 0) {
            // send a time message in the format used for query complete
            this.sendBatchTimeMessage(batch.id, Utils.parseNumAsTimeString(executionTime));
        }
        this.eventEmitter.emit('batchComplete', batch);
    }
    handleResultSetComplete(result) {
        let resultSet = result.resultSetSummary;
        let batchSet = this._batchSets[resultSet.batchId];
        // Store the result set in the batch and emit that a result set has completed
        batchSet.resultSetSummaries[resultSet.id] = resultSet;
        this.eventEmitter.emit('resultSet', resultSet);
    }
    handleMessage(obj) {
        let message = obj.message;
        message.time = new Date(message.time).toLocaleTimeString();
        // Send the message to the results pane
        this.eventEmitter.emit('message', message);
    }
    // get more data rows from the current resultSets from the service layer
    getRows(rowStart, numberOfRows, batchIndex, resultSetIndex) {
        const self = this;
        let queryDetails = new queryExecute_1.QueryExecuteSubsetParams();
        queryDetails.ownerUri = this.uri;
        queryDetails.resultSetIndex = resultSetIndex;
        queryDetails.rowsCount = numberOfRows;
        queryDetails.rowsStartIndex = rowStart;
        queryDetails.batchIndex = batchIndex;
        return new Promise((resolve, reject) => {
            self._client.sendRequest(queryExecute_1.QueryExecuteSubsetRequest.type, queryDetails).then(result => {
                resolve(result);
            }, error => {
                // TODO: Localize
                self._vscodeWrapper.showErrorMessage('Something went wrong getting more rows: ' + error.message);
                reject();
            });
        });
    }
    /**
     * Disposes the Query from the service client
     * @returns A promise that will be rejected if a problem occured
     */
    dispose() {
        const self = this;
        return new Promise((resolve, reject) => {
            let disposeDetails = new queryDispose_1.QueryDisposeParams();
            disposeDetails.ownerUri = self.uri;
            self._client.sendRequest(queryDispose_1.QueryDisposeRequest.type, disposeDetails).then(result => {
                resolve();
            }, error => {
                // TODO: Localize
                self._vscodeWrapper.showErrorMessage('Failed disposing query: ' + error.message);
                reject();
            });
        });
    }
    getColumnHeaders(batchId, resultId, range) {
        let headers = undefined;
        let batchSummary = this.batchSets[batchId];
        if (batchSummary !== undefined) {
            let resultSetSummary = batchSummary.resultSetSummaries[resultId];
            headers = resultSetSummary.columnInfo.slice(range.fromCell, range.toCell + 1).map((info, i) => {
                return info.columnName;
            });
        }
        return headers;
    }
    /**
     * Copy the result range to the system clip-board
     * @param selection The selection range array to copy
     * @param batchId The id of the batch to copy from
     * @param resultId The id of the result to copy from
     * @param includeHeaders [Optional]: Should column headers be included in the copy selection
     */
    copyResults(selection, batchId, resultId, includeHeaders) {
        const self = this;
        return new Promise((resolve, reject) => {
            let copyString = '';
            // create a mapping of the ranges to get promises
            let tasks = selection.map((range, i) => {
                return () => {
                    return self.getRows(range.fromRow, range.toRow - range.fromRow + 1, batchId, resultId).then((result) => {
                        if (self.shouldIncludeHeaders(includeHeaders)) {
                            let columnHeaders = self.getColumnHeaders(batchId, resultId, range);
                            if (columnHeaders !== undefined) {
                                copyString += columnHeaders.join('\t') + os.EOL;
                            }
                        }
                        // Iterate over the rows to paste into the copy string
                        for (let rowIndex = 0; rowIndex < result.resultSubset.rows.length; rowIndex++) {
                            let row = result.resultSubset.rows[rowIndex];
                            let cellObjects = row.slice(range.fromCell, (range.toCell + 1));
                            // Remove newlines if requested
                            let cells = self.shouldRemoveNewLines()
                                ? cellObjects.map(x => self.removeNewLines(x.displayValue))
                                : cellObjects.map(x => x.displayValue);
                            copyString += cells.join('\t');
                            if (rowIndex < result.resultSubset.rows.length - 1) {
                                copyString += os.EOL;
                            }
                        }
                    });
                };
            });
            let p = tasks[0]();
            for (let i = 1; i < tasks.length; i++) {
                p = p.then(tasks[i]);
            }
            p.then(() => {
                let oldLang;
                if (process.platform === 'darwin') {
                    oldLang = process.env['LANG'];
                    process.env['LANG'] = 'en_US.UTF-8';
                }
                this._vscodeWrapper.clipboardWriteText(copyString).then(() => {
                    if (process.platform === 'darwin') {
                        process.env['LANG'] = oldLang;
                    }
                    resolve();
                });
            });
        });
    }
    shouldIncludeHeaders(includeHeaders) {
        if (includeHeaders !== undefined) {
            // Respect the value explicity passed into the method
            return includeHeaders;
        }
        // else get config option from vscode config
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, this.uri);
        includeHeaders = config[Constants.copyIncludeHeaders];
        return !!includeHeaders;
    }
    shouldRemoveNewLines() {
        // get config copyRemoveNewLine option from vscode config
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, this.uri);
        let removeNewLines = config[Constants.configCopyRemoveNewLine];
        return removeNewLines;
    }
    removeNewLines(inputString) {
        // This regex removes all newlines in all OS types
        // Windows(CRLF): \r\n
        // Linux(LF)/Modern MacOS: \n
        // Old MacOs: \r
        let outputString = inputString.replace(/(\r\n|\n|\r)/gm, '');
        return outputString;
    }
    sendBatchTimeMessage(batchId, executionTime) {
        // get config copyRemoveNewLine option from vscode config
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, this.uri);
        let showBatchTime = config[Constants.configShowBatchTime];
        if (showBatchTime) {
            let message = {
                batchId: batchId,
                message: Utils.formatString(LocalizedConstants.elapsedBatchTime, executionTime),
                time: undefined,
                isError: false
            };
            // Send the message to the results pane
            this.eventEmitter.emit('message', message);
        }
    }
    /**
     * Sets a selection range in the editor for this query
     * @param selection The selection range to select
     */
    setEditorSelection(selection) {
        const self = this;
        return new Promise((resolve, reject) => {
            let column = vscode.ViewColumn.One;
            let visibleEditors = self._vscodeWrapper.visibleEditors;
            visibleEditors.forEach(editor => {
                if (editor.document.uri.toString() === self.uri) {
                    column = editor.viewColumn;
                }
            });
            self._vscodeWrapper.openTextDocument(self._vscodeWrapper.parseUri(self.uri)).then((doc) => {
                self._vscodeWrapper.showTextDocument(doc, column).then((editor) => {
                    editor.selection = self._vscodeWrapper.selection(self._vscodeWrapper.position(selection.startLine, selection.startColumn), self._vscodeWrapper.position(selection.endLine, selection.endColumn));
                    resolve();
                });
            });
        });
    }
    resetHasCompleted() {
        this._hasCompleted = false;
    }
    // public for testing only - used to mock handleQueryComplete
    _setHasCompleted() {
        this._hasCompleted = true;
    }
    get totalElapsedMilliseconds() {
        return this._totalElapsedMilliseconds;
    }
}
exports.default = QueryRunner;

//# sourceMappingURL=queryRunner.js.map
