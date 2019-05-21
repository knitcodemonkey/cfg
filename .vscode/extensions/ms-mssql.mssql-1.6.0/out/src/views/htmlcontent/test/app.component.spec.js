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
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@angular/core/testing");
const core_1 = require("@angular/core");
const Rx_1 = require("rxjs/Rx");
const TestUtils = require("./testUtils");
const data_service_1 = require("./../src/js/services/data.service");
const shortcuts_service_1 = require("./../src/js/services/shortcuts.service");
const app_component_1 = require("./../src/js/components/app.component");
const Constants = require("./../src/js/constants");
const mockResultSetSmall_spec_1 = require("./testResources/mockResultSetSmall.spec");
const mockResultSetBig_spec_1 = require("./testResources/mockResultSetBig.spec");
const mockMessageBatchStart_spec_1 = require("./testResources/mockMessageBatchStart.spec");
const mockMessageResultSet_spec_1 = require("./testResources/mockMessageResultSet.spec");
const mockMessageSimple_spec_1 = require("./testResources/mockMessageSimple.spec");
const mockMessageError_spec_1 = require("./testResources/mockMessageError.spec");
const completeEvent = {
    type: 'complete',
    data: '00:00:00.388'
};
/**
 * Sends a sequence of web socket events to immitate the execution of a set of batches.
 * @param ds    The dataservice to send the websocket events
 * @param batchStartMessage The message sent at the start of a batch
 * @param resultMessage The message sent when a result set has completed
 * @param result    The result set event that completed
 * @param count The number of times to repeat the sequence of events
 */
function sendDataSets(ds, batchStartMessage, resultMessage, result, count) {
    for (let i = 0; i < count; i++) {
        // Send a batch start
        let batchStartEvent = JSON.parse(JSON.stringify(batchStartMessage));
        ds.sendWSEvent(batchStartEvent);
        // Send a result set completion
        let resultSetEvent = JSON.parse(JSON.stringify(result));
        resultSetEvent.data.id = i;
        resultSetEvent.data.batchId = i;
        ds.sendWSEvent(resultSetEvent);
        // Send a result set complete message
        let resultSetMessageEvent = JSON.parse(JSON.stringify(resultMessage));
        resultSetMessageEvent.data.batchId = i;
        ds.sendWSEvent(resultSetMessageEvent);
    }
}
// Mock Setup
class MockDataService {
    constructor() {
        this._config = {
            'messagesDefaultOpen': true
        };
        const self = this;
        this.ws = new WebSocket('ws://localhost:' + window.location.port + '/');
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
    }
    get config() {
        return Promise.resolve(this._config);
    }
    sendWSEvent(data) {
        this.ws.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify(data)
        }));
    }
    openLink(content, columnName, linkType) {
        // No op
    }
    getRows(start, numberOfRows, batchId, resultId) {
        // no op
        return undefined;
    }
    sendSaveRequest(batchIndex, resultSetNumber, format, selection) {
        // no op
    }
    copyResults(selection, batchId, resultId) {
        // no op
    }
    getLocalizedTextsRequest() {
        return Promise.resolve({});
    }
}
class MockShortcutService {
    constructor() {
        this._shortcuts = {
            'event.toggleMessagePane': 'ctrl+alt+r',
            'event.toggleResultPane': 'ctrl+alt+y'
        };
    }
    stringCodeFor(event) {
        return Promise.resolve(this._shortcuts[event]);
    }
    getEvent(event) {
        return;
    }
    buildEventString(event) {
        return;
    }
}
// MockSlickgrid
let MockSlickGrid = class MockSlickGrid {
    // MockSlickgrid
    constructor() {
        this.editableColumnIds = [];
        this.highlightedCells = [];
        this.blurredColumns = [];
        this.contextColumns = [];
        this.columnsLoading = [];
        this.showHeader = true;
        this.showDataTypeIcon = true;
        this.enableColumnReorder = false;
        this.enableAsyncPostRender = false;
        this.selectionModel = '';
        this.plugins = [];
        this.loadFinished = new core_1.EventEmitter();
        this.cellChanged = new core_1.EventEmitter();
        this.editingFinished = new core_1.EventEmitter();
        this.contextMenu = new core_1.EventEmitter();
        this.topRowNumberChange = new core_1.EventEmitter();
    }
    getSelectedRanges() {
        return [];
    }
    setActive() {
        return;
    }
    set selection(input) {
        this._selection = input;
    }
};
__decorate([
    core_1.Input(),
    __metadata("design:type", Array)
], MockSlickGrid.prototype, "columnDefinitions", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Object)
], MockSlickGrid.prototype, "dataRows", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Rx_1.Observable)
], MockSlickGrid.prototype, "resized", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Array)
], MockSlickGrid.prototype, "editableColumnIds", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Array)
], MockSlickGrid.prototype, "highlightedCells", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Array)
], MockSlickGrid.prototype, "blurredColumns", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Array)
], MockSlickGrid.prototype, "contextColumns", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Array)
], MockSlickGrid.prototype, "columnsLoading", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Function)
], MockSlickGrid.prototype, "overrideCellFn", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Boolean)
], MockSlickGrid.prototype, "showHeader", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Boolean)
], MockSlickGrid.prototype, "showDataTypeIcon", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Boolean)
], MockSlickGrid.prototype, "enableColumnReorder", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Boolean)
], MockSlickGrid.prototype, "enableAsyncPostRender", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", String)
], MockSlickGrid.prototype, "selectionModel", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Array)
], MockSlickGrid.prototype, "plugins", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], MockSlickGrid.prototype, "loadFinished", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], MockSlickGrid.prototype, "cellChanged", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], MockSlickGrid.prototype, "editingFinished", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], MockSlickGrid.prototype, "contextMenu", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Number)
], MockSlickGrid.prototype, "topRowNumber", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], MockSlickGrid.prototype, "topRowNumberChange", void 0);
MockSlickGrid = __decorate([
    core_1.Component({
        selector: 'slick-grid',
        template: ''
    })
], MockSlickGrid);
let MockContextMenu = class MockContextMenu {
    constructor() {
        this.clickEvent = new core_1.EventEmitter();
    }
    emitEvent(event) {
        this.clickEvent.emit(event);
    }
    show(x, y, batchId, resultId, index, selection) {
        // No op
    }
};
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], MockContextMenu.prototype, "clickEvent", void 0);
MockContextMenu = __decorate([
    core_1.Component({
        selector: 'context-menu',
        template: ''
    })
], MockContextMenu);
let MockMessagesContextMenu = class MockMessagesContextMenu {
    constructor() {
        this.clickEvent = new core_1.EventEmitter();
    }
    emitEvent(event) {
        this.clickEvent.emit(event);
    }
    show(x, y, selectedRange) {
        // No op
    }
};
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], MockMessagesContextMenu.prototype, "clickEvent", void 0);
MockMessagesContextMenu = __decorate([
    core_1.Component({
        selector: 'msg-context-menu',
        template: ''
    })
], MockMessagesContextMenu);
let MockScrollDirective = class MockScrollDirective {
    constructor() {
        this.scrollEnabled = true;
        this.onScroll = new core_1.EventEmitter();
    }
};
__decorate([
    core_1.Input(),
    __metadata("design:type", Boolean)
], MockScrollDirective.prototype, "scrollEnabled", void 0);
__decorate([
    core_1.Output('onScroll'),
    __metadata("design:type", core_1.EventEmitter)
], MockScrollDirective.prototype, "onScroll", void 0);
MockScrollDirective = __decorate([
    core_1.Directive({
        selector: '[onScroll]'
    })
], MockScrollDirective);
let MockMouseDownDirective = class MockMouseDownDirective {
    constructor() {
        this.onMouseDown = new core_1.EventEmitter();
    }
};
__decorate([
    core_1.Output('mousedown'),
    __metadata("design:type", core_1.EventEmitter)
], MockMouseDownDirective.prototype, "onMouseDown", void 0);
MockMouseDownDirective = __decorate([
    core_1.Directive({
        selector: '[mousedown]'
    })
], MockMouseDownDirective);
// End Mock Setup
////////  SPECS  /////////////
describe('AppComponent', function () {
    let fixture;
    let comp;
    let ele;
    beforeEach(testing_1.async(() => {
        testing_1.TestBed.configureTestingModule({
            declarations: [app_component_1.AppComponent, MockSlickGrid, MockContextMenu, MockMessagesContextMenu, MockScrollDirective, MockMouseDownDirective]
        }).overrideComponent(app_component_1.AppComponent, {
            set: {
                providers: [
                    {
                        provide: data_service_1.DataService,
                        useClass: MockDataService
                    },
                    {
                        provide: shortcuts_service_1.ShortcutService,
                        useClass: MockShortcutService
                    }
                ]
            }
        });
    }));
    describe('Basic Startup', () => {
        beforeEach(() => {
            fixture = testing_1.TestBed.createComponent(app_component_1.AppComponent);
            fixture.detectChanges();
            comp = fixture.componentInstance;
            ele = fixture.nativeElement;
        });
        it('initialized properly', () => {
            let messages = ele.querySelector('#messages');
            let results = ele.querySelector('#results');
            expect(messages).toBeDefined();
            expect(messages.className.indexOf('hidden')).toEqual(-1, 'messages not visible');
            expect(messages.getElementsByTagName('tbody').length).toBeGreaterThan(0, 'no table body in messages');
            expect(messages.getElementsByTagName('tbody')[0]
                .getElementsByTagName('td')[1]
                .innerText.indexOf(Constants.executeQueryLabel))
                .not.toEqual(-1, 'Wrong executing label');
            expect(results).toBeNull('results pane is showing');
        });
    });
    describe('full initialization', () => {
        beforeEach(() => {
            fixture = testing_1.TestBed.createComponent(app_component_1.AppComponent);
            fixture.detectChanges();
            comp = fixture.componentInstance;
            ele = fixture.nativeElement;
        });
        it('should have started showing messages after the batch start message', () => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            fixture.detectChanges();
            let results = ele.querySelector('#results');
            expect(results).toBeNull('results pane is visible');
            // Messages should be visible
            let messages = ele.querySelector('#messages');
            expect(messages).not.toBeNull('messages pane is not visible');
            expect(messages.className.indexOf('hidden')).toEqual(-1);
            expect(messages.getElementsByTagName('tr').length).toEqual(2); // One for "started" message, one for spinner
            expect(messages.getElementsByTagName('a').length).toEqual(1); // One link should be visible
        });
        it('should have initialized the grids correctly', () => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            // Results pane should be visible
            let results = ele.querySelector('#results');
            expect(results).not.toBeNull('results pane is not visible');
            expect(results.getElementsByTagName('slick-grid').length).toEqual(1);
            // Messages pane should be visible
            let messages = ele.querySelector('#messages');
            expect(messages).not.toBeNull('messages pane is not visible');
            expect(messages.className.indexOf('hidden')).toEqual(-1);
            expect(messages.getElementsByTagName('tr').length).toEqual(3);
            expect(messages.getElementsByTagName('a').length).toEqual(1);
        });
    });
    describe('spinner behavior', () => {
        beforeEach(() => {
            fixture = testing_1.TestBed.createComponent(app_component_1.AppComponent);
            fixture.detectChanges();
            comp = fixture.componentInstance;
            ele = fixture.nativeElement;
        });
        it('should be visible at before any command', () => {
            fixture.detectChanges();
            // Spinner should be visible
            let spinner = ele.querySelector('#executionSpinner');
            expect(spinner).not.toBeNull('spinner is not visible');
        });
        it('should be visible after a batch starts', () => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            fixture.detectChanges();
            // Spinner should be visible
            let spinner = ele.querySelector('#executionSpinner');
            expect(spinner).not.toBeNull('spinner is not visible');
        });
        it('should be be visible after a result completes', () => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            fixture.detectChanges();
            // Spinner should be visible
            let spinner = ele.querySelector('#executionSpinner');
            expect(spinner).not.toBeNull('spinner is not visible');
        });
        it('should be hidden after a query completes', () => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            // Spinner should not be visible
            let spinner = ele.querySelector('#executionSpinner');
            expect(spinner).toBeNull('spinner is visible');
        });
    });
    describe('basic behavior', () => {
        beforeEach(() => {
            fixture = testing_1.TestBed.createComponent(app_component_1.AppComponent);
            fixture.detectChanges();
            comp = fixture.componentInstance;
            ele = fixture.nativeElement;
        });
        it('should not hide message pane on click when there is no data', () => {
            let messages = ele.querySelector('#messages');
            expect(messages).not.toBeNull();
            expect(messages.className.indexOf('hidden')).toEqual(-1, 'messages not visible');
            messages.click();
            fixture.detectChanges();
            expect(messages.className.indexOf('hidden')).toEqual(-1, 'messages not visible');
        });
        it('should hide message pane on click when there is data', () => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            let messages = ele.querySelector('#messages');
            expect(messages).not.toBeNull();
            expect(messages.className.indexOf('hidden')).toEqual(-1, 'messages not visible');
            let messagePane = ele.querySelector('#messagepane');
            messagePane.click();
            fixture.detectChanges();
            expect(messages.className.indexOf('hidden')).not.toEqual(-1);
        });
        it('should hide the results pane on click when there is data', () => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            let results = ele.querySelector('#results');
            expect(results).not.toBeNull('results pane is not visible');
            expect(results.className.indexOf('hidden')).toEqual(-1);
            let resultspane = ele.querySelector('#resultspane');
            resultspane.click();
            fixture.detectChanges();
            expect(results.className.indexOf('hidden')).not.toEqual(-1);
        });
        it('should render all grids when there are alot but only subset of data', () => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            sendDataSets(dataService, mockMessageBatchStart_spec_1.default, mockMessageResultSet_spec_1.default, mockResultSetBig_spec_1.default, 20);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            let slickgrids = ele.querySelectorAll('slick-grid');
            expect(slickgrids.length).toEqual(20);
        });
        it('should render all grids when there are alot but only subset of data', () => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            sendDataSets(dataService, mockMessageBatchStart_spec_1.default, mockMessageResultSet_spec_1.default, mockResultSetSmall_spec_1.default, 20);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            let slickgrids = ele.querySelectorAll('slick-grid');
            expect(slickgrids.length).toEqual(20);
        });
        it('should open context menu when event is fired', () => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            let contextmenu = comp.contextMenu;
            let slickgrid = comp.slickgrids.toArray()[0];
            spyOn(contextmenu, 'show');
            spyOn(slickgrid, 'getSelectedRanges').and.returnValue([]);
            slickgrid.contextMenu.emit({ x: 20, y: 20 });
            expect(slickgrid.getSelectedRanges).toHaveBeenCalled();
            expect(contextmenu.show).toHaveBeenCalledWith(20, 20, 0, 0, 0, []);
        });
        it('should combine selections when opening the context menu', () => {
            let range1 = {
                fromCell: 0,
                fromRow: 0,
                toCell: 10,
                toRow: 10
            };
            let range2 = {
                fromCell: range1.fromCell,
                fromRow: 11,
                toCell: range1.toCell,
                toRow: 100
            };
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            let contextmenu = comp.contextMenu;
            let slickgrid = comp.slickgrids.toArray()[0];
            spyOn(contextmenu, 'show');
            spyOn(slickgrid, 'getSelectedRanges').and.returnValue([range1, range2]);
            slickgrid.contextMenu.emit({ x: 20, y: 20 });
            expect(contextmenu.show).toHaveBeenCalledWith(20, 20, 0, 0, 0, [{
                    fromCell: range1.fromCell,
                    fromRow: range1.fromRow,
                    toCell: range1.toCell,
                    toRow: range2.toRow
                }]);
        });
        it('should open messages context menu when event is fired', () => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            let slickgrid = comp.slickgrids.toArray()[0];
            let msgContextMenu = comp.messagesContextMenu;
            let showSpy = spyOn(msgContextMenu, 'show');
            spyOn(slickgrid, 'getSelectedRanges').and.returnValue([]);
            let messageTable = ele.querySelector('#messageTable');
            let elRange = rangy.createRange();
            elRange.selectNodeContents(messageTable);
            rangy.getSelection().setSingleRange(elRange);
            comp.openMessagesContextMenu({ clientX: 20, clientY: 20, preventDefault: () => { return undefined; } });
            rangy.getSelection().removeAllRanges();
            expect(slickgrid.getSelectedRanges).not.toHaveBeenCalled();
            expect(msgContextMenu.show).toHaveBeenCalled();
            let range = showSpy.calls.mostRecent().args[2];
            expect(range).not.toBe(undefined);
        });
    });
    describe('Message Behavior', () => {
        beforeEach(() => {
            fixture = testing_1.TestBed.createComponent(app_component_1.AppComponent);
            fixture.detectChanges();
            comp = fixture.componentInstance;
            ele = fixture.nativeElement;
        });
        it('Correctly Displays Simple Messages', () => {
            // Send a message that doesn't have error, indentation, or links
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageSimple_spec_1.default);
            fixture.detectChanges();
            let messageRows = ele.querySelectorAll('.messageRow');
            let messageCells = ele.querySelectorAll('.messageRow > td');
            expect(messageRows.length).toEqual(1); // Only one message row should be visible
            expect(messageCells.length).toEqual(2); // Two cells should be visible
            let messageTimeCell = messageCells[0];
            expect(messageTimeCell.getElementsByTagName('span').length).toEqual(1); // Time cell should be populated
            let messageValueCell = messageCells[1];
            expect(messageValueCell.classList.contains('errorMessage')).toEqual(false); // Message is not an error
            expect(messageValueCell.classList.contains('batchMessage')).toEqual(false); // Message should not be indented
            expect(messageValueCell.getElementsByTagName('a').length).toEqual(0); // Message should not have a link
        });
        it('Correctly Displays Messages With Links', () => {
            // Send a message that contains a link
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            fixture.detectChanges();
            let messageRows = ele.querySelectorAll('.messageRow');
            let messageCells = ele.querySelectorAll('.messageRow > td');
            expect(messageRows.length).toEqual(1); // Only one message row should be visible
            expect(messageCells.length).toEqual(2); // Two cells should be visible
            let messageTimeCell = messageCells[0];
            expect(messageTimeCell.getElementsByTagName('span').length).toEqual(1); // Time cell should be populated
            let messageValueCell = messageCells[1];
            expect(messageValueCell.classList.contains('errorMessage')).toEqual(false); // Message is not an error
            expect(messageValueCell.classList.contains('batchMessage')).toEqual(false); // Message should not be indented
            expect(messageValueCell.getElementsByTagName('a').length).toEqual(1); // Message should have a link
        });
        it('Correctly Displays Messages With Indentation', () => {
            // Send a message that is indented under a batch start
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            fixture.detectChanges();
            let messageRows = ele.querySelectorAll('.messageRow');
            let messageCells = ele.querySelectorAll('.messageRow > td');
            expect(messageRows.length).toEqual(1); // Only one message row should be visible
            expect(messageCells.length).toEqual(2); // Two cells should be visible
            let messageTimeCell = messageCells[0];
            expect(messageTimeCell.getElementsByTagName('span').length).toEqual(0); // Time cell should not be populated
            let messageValueCell = messageCells[1];
            expect(messageValueCell.classList.contains('errorMessage')).toEqual(false); // Message is not an error
            expect(messageValueCell.classList.contains('batchMessage')).toEqual(true); // Message should be indented
            expect(messageValueCell.getElementsByTagName('a').length).toEqual(0); // Message should not have a link
        });
        it('Correctly Displays Messages With Errors', () => {
            // Send a message that is an error
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageError_spec_1.default);
            fixture.detectChanges();
            let messageRows = ele.querySelectorAll('.messageRow');
            let messageCells = ele.querySelectorAll('.messageRow > td');
            expect(messageRows.length).toEqual(1); // Only one message row should be visible
            expect(messageCells.length).toEqual(2); // Two cells should be visible
            let messageTimeCell = messageCells[0];
            expect(messageTimeCell.getElementsByTagName('span').length).toEqual(1); // Time cell should be populated
            let messageValueCell = messageCells[1];
            expect(messageValueCell.classList.contains('errorMessage')).toEqual(true); // Message is an error
            expect(messageValueCell.classList.contains('batchMessage')).toEqual(false); // Message should not be indented
            expect(messageValueCell.getElementsByTagName('a').length).toEqual(0); // Message should not have a link
        });
    });
    describe('test icons', () => {
        beforeEach(() => {
            fixture = testing_1.TestBed.createComponent(app_component_1.AppComponent);
            fixture.detectChanges();
            comp = fixture.componentInstance;
            ele = fixture.nativeElement;
        });
        it('should send save requests when the icons are clicked', () => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            spyOn(dataService, 'sendSaveRequest');
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            let icons = ele.querySelectorAll('.gridIcon');
            expect(icons.length).toEqual(3);
            let csvIcon = icons[0].firstElementChild;
            csvIcon.click();
            expect(dataService.sendSaveRequest).toHaveBeenCalledWith(0, 0, 'csv', []);
            let jsonIcon = icons[1].firstElementChild;
            jsonIcon.click();
            expect(dataService.sendSaveRequest).toHaveBeenCalledWith(0, 0, 'json', []);
            let excelIcon = icons[2].firstElementChild;
            excelIcon.click();
            expect(dataService.sendSaveRequest).toHaveBeenCalledWith(0, 0, 'excel', []);
        });
        it('should have maximized the grid when the icon is clicked', (done) => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetBig_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            let slickgrids = ele.querySelectorAll('slick-grid');
            expect(slickgrids.length).toEqual(2);
            let icons = ele.querySelectorAll('.gridIcon');
            let maximizeicon = icons[0].firstElementChild;
            maximizeicon.click();
            setTimeout(() => {
                fixture.detectChanges();
                slickgrids = ele.querySelectorAll('slick-grid');
                expect(slickgrids.length).toEqual(1);
                done();
            }, 100);
        });
    });
    describe('test events', () => {
        beforeEach(() => {
            fixture = testing_1.TestBed.createComponent(app_component_1.AppComponent);
            fixture.detectChanges();
            comp = fixture.componentInstance;
            ele = fixture.nativeElement;
        });
        it('correctly handles custom events', (done) => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            let shortcutService = fixture.componentRef.injector.get(shortcuts_service_1.ShortcutService);
            spyOn(shortcutService, 'buildEventString').and.returnValue('');
            spyOn(shortcutService, 'getEvent').and.returnValue(Promise.resolve('event.toggleResultPane'));
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            let results = ele.querySelector('#results');
            let event = new CustomEvent('gridnav', {
                detail: {
                    which: 70,
                    ctrlKey: true,
                    metaKey: true,
                    shiftKey: true,
                    altKey: true
                }
            });
            window.dispatchEvent(event);
            setTimeout(() => {
                fixture.detectChanges();
                expect(results).not.toBeNull('message pane is not visible');
                expect(results.className.indexOf('hidden')).not.toEqual(-1);
                done();
            }, 100);
        });
        it('event toggle result pane', (done) => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            let shortcutService = fixture.componentRef.injector.get(shortcuts_service_1.ShortcutService);
            spyOn(shortcutService, 'buildEventString').and.returnValue('');
            spyOn(shortcutService, 'getEvent').and.returnValue(Promise.resolve('event.toggleResultPane'));
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            let results = ele.querySelector('#results');
            TestUtils.triggerKeyEvent(40, ele);
            setTimeout(() => {
                fixture.detectChanges();
                expect(results).not.toBeNull('message pane is not visible');
                expect(results.className.indexOf('hidden')).not.toEqual(-1);
                done();
            }, 100);
        });
        it('event toggle message pane', (done) => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            let shortcutService = fixture.componentRef.injector.get(shortcuts_service_1.ShortcutService);
            spyOn(shortcutService, 'buildEventString').and.returnValue('');
            spyOn(shortcutService, 'getEvent').and.returnValue(Promise.resolve('event.toggleMessagePane'));
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            let messages = ele.querySelector('#messages');
            TestUtils.triggerKeyEvent(40, ele);
            setTimeout(() => {
                fixture.detectChanges();
                expect(messages).not.toBeNull('message pane is not visible');
                expect(messages.className.indexOf('hidden')).not.toEqual(-1);
                done();
            }, 100);
        });
        it('event copy selection', (done) => {
            rangy.getSelection().removeAllRanges();
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            let shortcutService = fixture.componentRef.injector.get(shortcuts_service_1.ShortcutService);
            spyOn(shortcutService, 'buildEventString').and.returnValue('');
            spyOn(shortcutService, 'getEvent').and.returnValue(Promise.resolve('event.copySelection'));
            spyOn(dataService, 'copyResults');
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            TestUtils.triggerKeyEvent(40, ele);
            setTimeout(() => {
                fixture.detectChanges();
                expect(dataService.copyResults).toHaveBeenCalledWith([], 0, 0);
                done();
            }, 100);
        });
        it('event copy with headers', (done) => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            let shortcutService = fixture.componentRef.injector.get(shortcuts_service_1.ShortcutService);
            spyOn(shortcutService, 'buildEventString').and.returnValue('');
            spyOn(shortcutService, 'getEvent').and.returnValue(Promise.resolve('event.copyWithHeaders'));
            spyOn(dataService, 'copyResults');
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            TestUtils.triggerKeyEvent(40, ele);
            setTimeout(() => {
                fixture.detectChanges();
                expect(dataService.copyResults).toHaveBeenCalledWith([], 0, 0, true);
                done();
            }, 100);
        });
        it('event copy messages', (done) => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            let shortcutService = fixture.componentRef.injector.get(shortcuts_service_1.ShortcutService);
            spyOn(shortcutService, 'buildEventString').and.returnValue('');
            spyOn(shortcutService, 'getEvent').and.returnValue(Promise.resolve('event.copySelection'));
            spyOn(dataService, 'copyResults');
            spyOn(document, 'execCommand').and.callThrough();
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            // Select the table under messages before sending the event
            let messageTable = ele.querySelector('#messageTable');
            let elRange = rangy.createRange();
            elRange.selectNodeContents(messageTable);
            rangy.getSelection().setSingleRange(elRange);
            TestUtils.triggerKeyEvent(40, ele);
            setTimeout(() => {
                fixture.detectChanges();
                rangy.getSelection().removeAllRanges();
                expect(document.execCommand).toHaveBeenCalledWith('copy');
                expect(dataService.copyResults).not.toHaveBeenCalled();
                done();
            }, 100);
        });
        it('event maximize grid', (done) => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            let shortcutService = fixture.componentRef.injector.get(shortcuts_service_1.ShortcutService);
            spyOn(shortcutService, 'buildEventString').and.returnValue('');
            spyOn(shortcutService, 'getEvent').and.returnValue(Promise.resolve('event.maximizeGrid'));
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetBig_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            let slickgrids = ele.querySelectorAll('slick-grid');
            expect(slickgrids.length).toEqual(2);
            TestUtils.triggerKeyEvent(40, ele);
            setTimeout(() => {
                fixture.detectChanges();
                slickgrids = ele.querySelectorAll('slick-grid');
                expect(slickgrids.length).toEqual(1);
                done();
            }, 100);
        });
        it('event save as json', (done) => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            let shortcutService = fixture.componentRef.injector.get(shortcuts_service_1.ShortcutService);
            spyOn(shortcutService, 'buildEventString').and.returnValue('');
            spyOn(shortcutService, 'getEvent').and.returnValue(Promise.resolve('event.saveAsJSON'));
            spyOn(dataService, 'sendSaveRequest');
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            TestUtils.triggerKeyEvent(40, ele);
            setTimeout(() => {
                fixture.detectChanges();
                expect(dataService.sendSaveRequest).toHaveBeenCalledWith(0, 0, 'json', []);
                done();
            }, 100);
        });
        it('event save as csv', (done) => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            let shortcutService = fixture.componentRef.injector.get(shortcuts_service_1.ShortcutService);
            spyOn(shortcutService, 'buildEventString').and.returnValue('');
            spyOn(shortcutService, 'getEvent').and.returnValue(Promise.resolve('event.saveAsCSV'));
            spyOn(dataService, 'sendSaveRequest');
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            TestUtils.triggerKeyEvent(40, ele);
            setTimeout(() => {
                fixture.detectChanges();
                expect(dataService.sendSaveRequest).toHaveBeenCalledWith(0, 0, 'csv', []);
                done();
            }, 100);
        });
        it('event save as excel', (done) => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            let shortcutService = fixture.componentRef.injector.get(shortcuts_service_1.ShortcutService);
            spyOn(shortcutService, 'buildEventString').and.returnValue('');
            spyOn(shortcutService, 'getEvent').and.returnValue(Promise.resolve('event.saveAsExcel'));
            spyOn(dataService, 'sendSaveRequest');
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            TestUtils.triggerKeyEvent(40, ele);
            setTimeout(() => {
                fixture.detectChanges();
                expect(dataService.sendSaveRequest).toHaveBeenCalledWith(0, 0, 'excel', []);
                done();
            }, 100);
        });
        it('event next grid', (done) => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            let shortcutService = fixture.componentRef.injector.get(shortcuts_service_1.ShortcutService);
            spyOn(shortcutService, 'buildEventString').and.returnValue('');
            spyOn(shortcutService, 'getEvent').and.returnValue(Promise.resolve('event.nextGrid'));
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetBig_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            let currentSlickGrid;
            let targetSlickGrid;
            targetSlickGrid = comp.slickgrids.toArray()[1];
            currentSlickGrid = comp.slickgrids.toArray()[0];
            spyOn(targetSlickGrid, 'setActive');
            TestUtils.triggerKeyEvent(40, ele);
            setTimeout(() => {
                fixture.detectChanges();
                expect(targetSlickGrid.setActive).toHaveBeenCalled();
                expect(currentSlickGrid._selection).toBe(false);
                done();
            });
        });
        it('event prev grid', (done) => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            let shortcutService = fixture.componentRef.injector.get(shortcuts_service_1.ShortcutService);
            spyOn(shortcutService, 'buildEventString').and.returnValue('');
            spyOn(shortcutService, 'getEvent').and.returnValue(Promise.resolve('event.prevGrid'));
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetBig_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetSmall_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            comp.navigateToGrid(1);
            let currentSlickGrid;
            let targetSlickGrid;
            targetSlickGrid = comp.slickgrids.toArray()[0];
            currentSlickGrid = comp.slickgrids.toArray()[1];
            spyOn(targetSlickGrid, 'setActive');
            TestUtils.triggerKeyEvent(40, ele);
            setTimeout(() => {
                fixture.detectChanges();
                expect(targetSlickGrid.setActive).toHaveBeenCalled();
                expect(currentSlickGrid._selection).toBe(false);
                done();
            });
        });
        it('event select all', () => {
            let dataService = fixture.componentRef.injector.get(data_service_1.DataService);
            dataService.sendWSEvent(mockMessageBatchStart_spec_1.default);
            dataService.sendWSEvent(mockResultSetBig_spec_1.default);
            dataService.sendWSEvent(mockMessageResultSet_spec_1.default);
            dataService.sendWSEvent(completeEvent);
            fixture.detectChanges();
            let slickgrid;
            slickgrid = comp.slickgrids.toArray()[0];
            comp.handleContextClick({ type: 'selectall', batchId: 0, resultId: 0, index: 0, selection: [] });
            fixture.detectChanges();
            expect(slickgrid._selection).toBe(true);
        });
    });
});

//# sourceMappingURL=app.component.spec.js.map
