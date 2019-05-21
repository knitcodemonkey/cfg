"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@angular/core/testing");
const http_1 = require("@angular/http");
const testing_2 = require("@angular/http/testing");
const data_service_1 = require("./../src/js/services/data.service");
const mockGetRows1_spec_1 = require("./testResources/mockGetRows1.spec");
const mockConfig1_spec_1 = require("./testResources/mockConfig1.spec");
function getParamsFromUrl(url) {
    let paramString = url.split('?')[1];
    let params = paramString.split('&');
    let paramSplits = params.map((param) => {
        return param.split('=');
    });
    let paramsJson = {};
    paramSplits.forEach((paramSplit) => {
        paramsJson[paramSplit[0]] = paramSplit[1];
    });
    return paramsJson;
}
function urlMatch(request, expectedUrl, expectedMethod) {
    return request.url &&
        request.method === expectedMethod &&
        request.url.match(expectedUrl) &&
        request.url.match(expectedUrl).length === 1 ? true : false;
}
describe('data service', () => {
    let dataservice;
    let mockbackend;
    beforeEach(testing_1.async(() => {
        testing_1.TestBed.resetTestingModule();
        testing_1.TestBed.configureTestingModule({
            providers: [
                data_service_1.DataService,
                testing_2.MockBackend,
                http_1.BaseRequestOptions,
                {
                    provide: http_1.Http,
                    useFactory: (backend, options) => { return new http_1.Http(backend, options); },
                    deps: [testing_2.MockBackend, http_1.BaseRequestOptions]
                }
            ]
        });
        dataservice = testing_1.TestBed.get(data_service_1.DataService);
        mockbackend = testing_1.TestBed.get(testing_2.MockBackend);
    }));
    describe('get rows', () => {
        it('correctly threads through the data', (done) => {
            mockbackend.connections.subscribe((conn) => {
                let isGetRows = urlMatch(conn.request, /\/rows/, http_1.RequestMethod.Get);
                expect(isGetRows).toBe(true);
                let param = getParamsFromUrl(conn.request.url);
                expect(param['batchId']).toEqual('0');
                expect(param['resultId']).toEqual('0');
                expect(param['rowStart']).toEqual('0');
                expect(param['numberOfRows']).toEqual('50');
                conn.mockRespond(new http_1.Response(new http_1.ResponseOptions({ body: JSON.stringify(mockGetRows1_spec_1.default) })));
            });
            dataservice.getRows(0, 50, 0, 0).subscribe((result) => {
                expect(result).toEqual(mockGetRows1_spec_1.default);
                done();
            });
        });
    });
    describe('send save request', () => {
        it('correctly threads through the data', (done) => {
            mockbackend.connections.subscribe((conn) => {
                let isSaveRequest = urlMatch(conn.request, /\/saveResults/, http_1.RequestMethod.Post);
                expect(isSaveRequest).toBe(true);
                let param = getParamsFromUrl(conn.request.url);
                expect(param['format']).toEqual('csv');
                expect(param['batchIndex']).toEqual('0');
                expect(param['resultSetNo']).toEqual('0');
                expect(JSON.parse(conn.request.getBody())).toEqual([]);
                done();
            });
            dataservice.sendSaveRequest(0, 0, 'csv', []);
        });
    });
    describe('open link request', () => {
        it('correctly threads through the data', (done) => {
            mockbackend.connections.subscribe((conn) => {
                let isOpenRequest = urlMatch(conn.request, /\/openLink/, http_1.RequestMethod.Post);
                expect(isOpenRequest).toBe(true);
                let body = JSON.parse(conn.request.getBody());
                expect(body).toBeDefined();
                expect(body['content']).toEqual('this is a xml');
                expect(body['columnName']).toEqual('columnname');
                expect(body['type']).toEqual('xml');
                done();
            });
            dataservice.openLink('this is a xml', 'columnname', 'xml');
        });
    });
    describe('copy results request', () => {
        it('correctly threads through the data', (done) => {
            mockbackend.connections.subscribe((conn) => {
                let isCopyRequest = urlMatch(conn.request, /\/copyResults/, http_1.RequestMethod.Post);
                expect(isCopyRequest).toBe(true);
                let param = getParamsFromUrl(conn.request.url);
                expect(param['batchId']).toEqual('0');
                expect(param['resultId']).toEqual('0');
                expect(param['includeHeaders']).toEqual(undefined);
                let body = JSON.parse(conn.request.getBody());
                expect(body).toBeDefined();
                expect(body).toEqual([]);
                done();
            });
            dataservice.copyResults([], 0, 0);
        });
    });
    describe('copy with headers request', () => {
        it('correctly threads through the data', (done) => {
            mockbackend.connections.subscribe((conn) => {
                let isCopyRequest = urlMatch(conn.request, /\/copyResults/, http_1.RequestMethod.Post);
                expect(isCopyRequest).toBe(true);
                let param = getParamsFromUrl(conn.request.url);
                expect(param['batchId']).toEqual('0');
                expect(param['resultId']).toEqual('0');
                expect(param['includeHeaders']).toEqual('true');
                let body = JSON.parse(conn.request.getBody());
                expect(body).toBeDefined();
                expect(body).toEqual([]);
                done();
            });
            dataservice.copyResults([], 0, 0, true);
        });
    });
    describe('set selection request', () => {
        it('correctly threads through the data', (done) => {
            mockbackend.connections.subscribe((conn) => {
                let isSelectionRequest = urlMatch(conn.request, /\/setEditorSelection/, http_1.RequestMethod.Post);
                expect(isSelectionRequest).toBe(true);
                let body = JSON.parse(conn.request.getBody());
                expect(body).toBeDefined();
                expect(body).toEqual({
                    startLine: 0,
                    startColumn: 0,
                    endLine: 6,
                    endColumn: 6
                });
                done();
            });
            dataservice.editorSelection = {
                startLine: 0,
                startColumn: 0,
                endLine: 6,
                endColumn: 6
            };
        });
    });
    describe('show warning request', () => {
        it('correctly threads through the data', (done) => {
            mockbackend.connections.subscribe((conn) => {
                let isWarningRequest = urlMatch(conn.request, /\/showWarning/, http_1.RequestMethod.Post);
                expect(isWarningRequest).toBe(true);
                let body = JSON.parse(conn.request.getBody());
                expect(body).toBeDefined();
                expect(body['message']).toEqual('this is a warning message');
                done();
            });
            dataservice.showWarning('this is a warning message');
        });
    });
    describe('show error request', () => {
        it('correctly threads through the data', (done) => {
            mockbackend.connections.subscribe((conn) => {
                let isErrorRequest = urlMatch(conn.request, /\/showError/, http_1.RequestMethod.Post);
                expect(isErrorRequest).toBe(true);
                let body = JSON.parse(conn.request.getBody());
                expect(body).toBeDefined();
                expect(body['message']).toEqual('this is a error message');
                done();
            });
            dataservice.showError('this is a error message');
        });
    });
    describe('get config', () => {
        it('returns correct data on first request', (done) => {
            let config = JSON.parse(JSON.stringify(mockConfig1_spec_1.default));
            delete config.shortcuts;
            mockbackend.connections.subscribe((conn) => {
                let isConfigRequest = urlMatch(conn.request, /\/config/, http_1.RequestMethod.Get);
                expect(isConfigRequest).toBe(true);
                conn.mockRespond(new http_1.Response(new http_1.ResponseOptions({ body: JSON.stringify(mockConfig1_spec_1.default) })));
            });
            dataservice.config.then((result) => {
                expect(result).toEqual(config);
                done();
            });
        });
    });
    describe('get shortcuts', () => {
        it('returns correct data on first request', (done) => {
            mockbackend.connections.subscribe((conn) => {
                let isConfigRequest = urlMatch(conn.request, /\/config/, http_1.RequestMethod.Get);
                expect(isConfigRequest).toBe(true);
                conn.mockRespond(new http_1.Response(new http_1.ResponseOptions({ body: JSON.stringify(mockConfig1_spec_1.default) })));
            });
            dataservice.shortcuts.then((result) => {
                expect(result).toEqual(mockConfig1_spec_1.default.shortcuts);
                done();
            });
        });
    });
    describe('websocket', () => {
        it('correctly sends event on websocket event', (done) => {
            dataservice.dataEventObs.subscribe((result) => {
                expect(result).toEqual(mockConfig1_spec_1.default);
                done();
            });
            dataservice.ws.dispatchEvent(new MessageEvent('message', {
                data: JSON.stringify(mockConfig1_spec_1.default)
            }));
        });
    });
});

//# sourceMappingURL=data.service.spec.js.map
