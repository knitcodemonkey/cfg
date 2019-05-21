"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const core_1 = require("@angular/core");
const http_1 = require("@angular/http");
const Rx_1 = require("rxjs/Rx");
const Utils = require("./../utils");
const Constants = require("./../constants");
const WS_URL = 'ws://localhost:' + window.location.port + '/';
/**
 * Service which performs the http requests to get the data resultsets from the server.
 */
let DataService = class DataService {
    constructor(http) {
        this.http = http;
        const self = this;
        // grab the uri from the document for requests
        this.uri = encodeURI(document.getElementById('uri') ? document.getElementById('uri').innerText.trim() : '');
        this.ws = new WebSocket(WS_URL + '?uri=' + this.uri);
        let observable = Rx_1.Observable.create((obs) => {
            self.ws.onmessage = obs.next.bind(obs);
            self.ws.onerror = obs.error.bind(obs);
            self.ws.onclose = obs.complete.bind(obs);
            return self.ws.close.bind(self.ws);
        });
        let observer = {
            next: (data) => {
                if (self.ws.readyState === WebSocket.OPEN) {
                    self.ws.send(JSON.stringify(data));
                }
            }
        };
        this.dataEventObs = Rx_1.Subject.create(observer, observable).map((response) => {
            let data = JSON.parse(response.data);
            return data;
        });
        this.getLocalizedTextsRequest().then(result => {
            Object.keys(result).forEach(key => {
                Constants.loadLocalizedConstant(key, result[key]);
            });
        });
    }
    /* for testing purposes only */
    get webSocket() {
        return this.ws;
    }
    /**
     * Get a specified number of rows starting at a specified row for
     * the current results set
     * @param start The starting row or the requested rows
     * @param numberOfRows The amount of rows to return
     * @param batchId The batch id of the batch you are querying
     * @param resultId The id of the result you want to get the rows for
     */
    getRows(start, numberOfRows, batchId, resultId) {
        let uriFormat = '/{0}?batchId={1}&resultId={2}&uri={3}';
        let uri = Utils.formatString(uriFormat, 'rows', batchId, resultId, this.uri);
        return this.http.get(uri + '&rowStart=' + start
            + '&numberOfRows=' + numberOfRows)
            .map(res => {
            return res.json();
        });
    }
    /**
     * send request to save the selected result set as csv, json or excel
     * @param batchIndex The batch id of the batch with the result to save
     * @param resultSetNumber The id of the result to save
     * @param format The format to save in - csv, json, excel
     * @param selection The range inside the result set to save, or empty if all results should be saved
     */
    sendSaveRequest(batchIndex, resultSetNumber, format, selection) {
        const self = this;
        let headers = new http_1.Headers();
        let url = '/saveResults?'
            + '&uri=' + self.uri
            + '&format=' + format
            + '&batchIndex=' + batchIndex
            + '&resultSetNo=' + resultSetNumber;
        self.http.post(url, selection, { headers: headers })
            .subscribe(undefined, err => {
            self.showError(err.statusText);
        });
    }
    /**
     * send request to get all the localized texts
     */
    getLocalizedTextsRequest() {
        const self = this;
        let headers = new http_1.Headers();
        let url = '/localizedTexts';
        return new Promise((resolve, reject) => {
            self.http.get(url, { headers: headers }).subscribe(result => {
                resolve(result.json());
            });
        });
    }
    /**
     * send request to open content in new editor
     * @param content The content to be opened
     * @param columnName The column name of the content
     */
    openLink(content, columnName, linkType) {
        const self = this;
        let headers = new http_1.Headers();
        headers.append('Content-Type', 'application/json');
        self.http.post('/openLink', JSON.stringify({ 'content': content, 'columnName': columnName, 'type': linkType }), { headers: headers })
            .subscribe(undefined, err => {
            self.showError(err.statusText);
        });
    }
    /**
     * Sends a copy request
     * @param selection The selection range to copy
     * @param batchId The batch id of the result to copy from
     * @param resultId The result id of the result to copy from
     * @param includeHeaders [Optional]: Should column headers be included in the copy selection
     */
    copyResults(selection, batchId, resultId, includeHeaders) {
        const self = this;
        let headers = new http_1.Headers();
        let url = '/copyResults?' + '&uri=' + self.uri + '&batchId=' + batchId + '&resultId=' + resultId;
        if (includeHeaders !== undefined) {
            url += '&includeHeaders=' + includeHeaders;
        }
        self.http.post(url, selection, { headers: headers }).subscribe();
    }
    /**
     * Sends a request to set the selection in the VScode window
     * @param selection The selection range in the VSCode window
     */
    set editorSelection(selection) {
        const self = this;
        let headers = new http_1.Headers();
        let url = '/setEditorSelection?' + '&uri=' + self.uri;
        self.http.post(url, selection, { headers: headers }).subscribe();
    }
    /**
     * Sends a generic GET request without expecting anything in return
     * @param uri The uri to send the GET request to
     */
    sendGetRequest(uri) {
        const self = this;
        let headers = new http_1.Headers();
        self.http.get(uri, { headers: headers }).subscribe();
    }
    showWarning(message) {
        const self = this;
        let url = '/showWarning?' + '&uri=' + self.uri;
        let headers = new http_1.Headers();
        headers.append('Content-Type', 'application/json');
        self.http.post(url, JSON.stringify({ 'message': message }), { headers: headers }).subscribe();
    }
    showError(message) {
        const self = this;
        let url = '/showError?' + '&uri=' + self.uri;
        let headers = new http_1.Headers();
        headers.append('Content-Type', 'application/json');
        self.http.post(url, JSON.stringify({ 'message': message }), { headers: headers }).subscribe();
    }
    get config() {
        const self = this;
        if (this._config) {
            return Promise.resolve(this._config);
        }
        else {
            return new Promise((resolve, reject) => {
                let url = '/config?'
                    + '&uri=' + self.uri;
                self.http.get(url).map((res) => {
                    return res.json();
                }).subscribe((result) => {
                    self._shortcuts = result.shortcuts;
                    delete result.shortcuts;
                    self._config = result;
                    resolve(self._config);
                });
            });
        }
    }
    get shortcuts() {
        const self = this;
        if (this._shortcuts) {
            return Promise.resolve(this._shortcuts);
        }
        else {
            return new Promise((resolve, reject) => {
                let url = '/config?'
                    + '&uri=' + self.uri;
                self.http.get(url).map((res) => {
                    return res.json();
                }).subscribe((result) => {
                    self._shortcuts = result.shortcuts;
                    delete result.resultShortcuts;
                    self._config = result;
                    resolve(self._shortcuts);
                });
            });
        }
    }
};
DataService = __decorate([
    core_1.Injectable(),
    __param(0, core_1.Inject(core_1.forwardRef(() => http_1.Http))),
    __metadata("design:paramtypes", [Object])
], DataService);
exports.DataService = DataService;

//# sourceMappingURL=data.service.js.map
