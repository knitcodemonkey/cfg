"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@angular/core/testing");
const shortcuts_service_1 = require("./../src/js/services/shortcuts.service");
const data_service_1 = require("./../src/js/services/data.service");
const WINDOW_PROVIDER = {
    provide: Window,
    useValue: window
};
// Mock Setup
class MockDataService {
    constructor() {
        this._shortcuts = {
            'event.toggleResultPane': 'ctrl+alt+r',
            'event.toggleMessagePane': 'ctrl+alt+y',
            'event.prevGrid': 'ctrl+up',
            'event.nextGrid': 'ctrl+down',
            'event.copySelection': 'ctrl+c',
            'event.maximizeGrid': 'ctrl+shift+alt+y',
            'event.selectAll': 'alt+y',
            'event.saveAsJSON': 'shift+up',
            'event.saveAsCSV': '',
            'event.saveAsExcel': ''
        };
        this.doNotResolve = false;
    }
    get shortcuts() {
        const self = this;
        if (this.doNotResolve) {
            return new Promise((resolve) => {
                self.resolveObject = resolve;
            });
        }
        else {
            return Promise.resolve(this._shortcuts);
        }
    }
    resolveShortcuts() {
        if (this.resolveObject) {
            this.resolveObject(this._shortcuts);
            this.resolveObject = undefined;
        }
    }
}
class MockDataServiceNoResolve extends MockDataService {
    constructor() {
        super(...arguments);
        this.doNotResolve = true;
    }
}
describe('shortcut service', () => {
    let shortcutService;
    beforeEach(testing_1.async(() => {
        testing_1.TestBed.resetTestingModule();
        testing_1.TestBed.configureTestingModule({
            providers: [
                shortcuts_service_1.ShortcutService,
                WINDOW_PROVIDER,
                {
                    provide: data_service_1.DataService,
                    useClass: MockDataService
                }
            ]
        });
        shortcutService = testing_1.TestBed.get(shortcuts_service_1.ShortcutService);
    }));
    describe('string code for', () => {
        it('should return correct stringCodes', (done) => {
            let testPromises = [];
            testPromises.push(shortcutService.stringCodeFor('event.toggleMessagePane').then((result) => {
                expect(result).toMatch(/(Ctrl\+Alt\+y)|(⌘\+⌥\+y)/g);
            }));
            testPromises.push(shortcutService.stringCodeFor('event.prevGrid').then((result) => {
                expect(result).toMatch(/(Ctrl\+up)|(⌘\+up)/g);
            }));
            testPromises.push(shortcutService.stringCodeFor('event.maximizeGrid').then((result) => {
                expect(result).toMatch(/(Ctrl\+Shift\+Alt\+y)|(⌘\+⇧\+⌥\+y)/g);
            }));
            testPromises.push(shortcutService.stringCodeFor('event.selectAll').then((result) => {
                expect(result).toMatch(/(Alt\+y)|(⌥\+y)/g);
            }));
            testPromises.push(shortcutService.stringCodeFor('event.saveAsJSON').then((result) => {
                expect(result).toMatch(/(Shift\+up)|(⇧\+up)/g);
            }));
            Promise.all(testPromises).then(() => {
                done();
            });
        });
        it('should return undefined for events that do not exist', (done) => {
            shortcutService.stringCodeFor('noneexistant').then((result) => {
                expect(result).toBeUndefined();
                done();
            });
        });
        it('should return correct code even if it is waiting', (done) => {
            testing_1.TestBed.resetTestingModule();
            testing_1.TestBed.configureTestingModule({
                providers: [
                    shortcuts_service_1.ShortcutService,
                    WINDOW_PROVIDER,
                    {
                        provide: data_service_1.DataService,
                        useClass: MockDataServiceNoResolve
                    }
                ]
            });
            let shortcut = testing_1.TestBed.get(shortcuts_service_1.ShortcutService);
            let mockData = testing_1.TestBed.get(data_service_1.DataService);
            shortcut.stringCodeFor('event.saveAsJSON').then((result) => {
                expect(result).toMatch(/(Shift\+up)|(⇧\+up)/g);
                done();
            });
            mockData.resolveShortcuts();
        });
        it('should return correct code on all windows', (done) => {
            let mockWindow = {
                navigator: {
                    platform: 'windows'
                }
            };
            testing_1.TestBed.resetTestingModule();
            testing_1.TestBed.configureTestingModule({
                providers: [
                    shortcuts_service_1.ShortcutService,
                    {
                        provide: data_service_1.DataService,
                        useClass: MockDataService
                    },
                    {
                        provide: Window,
                        useValue: mockWindow
                    }
                ]
            });
            let shortcut = testing_1.TestBed.get(shortcuts_service_1.ShortcutService);
            shortcut.stringCodeFor('event.saveAsJSON').then((result) => {
                expect(result).toEqual('Shift+up');
                done();
            });
        });
        it('should return correct code on all linux', (done) => {
            let mockWindow = {
                navigator: {
                    platform: 'linux'
                }
            };
            testing_1.TestBed.resetTestingModule();
            testing_1.TestBed.configureTestingModule({
                providers: [
                    shortcuts_service_1.ShortcutService,
                    {
                        provide: data_service_1.DataService,
                        useClass: MockDataService
                    },
                    {
                        provide: Window,
                        useValue: mockWindow
                    }
                ]
            });
            let shortcut = testing_1.TestBed.get(shortcuts_service_1.ShortcutService);
            shortcut.stringCodeFor('event.saveAsJSON').then((result) => {
                expect(result).toEqual('Shift+up');
                done();
            });
        });
        it('should return correct code on all mac', (done) => {
            let mockWindow = {
                navigator: {
                    platform: 'mac'
                }
            };
            testing_1.TestBed.resetTestingModule();
            testing_1.TestBed.configureTestingModule({
                providers: [
                    shortcuts_service_1.ShortcutService,
                    {
                        provide: data_service_1.DataService,
                        useClass: MockDataService
                    },
                    {
                        provide: Window,
                        useValue: mockWindow
                    }
                ]
            });
            let shortcut = testing_1.TestBed.get(shortcuts_service_1.ShortcutService);
            shortcut.stringCodeFor('event.saveAsJSON').then((result) => {
                expect(result).toEqual('⇧+up');
                done();
            });
        });
    });
    describe('get event', () => {
        it('should return the correct event', (done) => {
            let testPromises = [];
            testPromises.push(shortcutService.getEvent('ctrl+alt+r').then((result) => {
                expect(result).toEqual('event.toggleResultPane');
            }));
            testPromises.push(shortcutService.getEvent('alt+y').then((result) => {
                expect(result).toEqual('event.selectAll');
            }));
            Promise.all(testPromises).then(() => {
                done();
            });
        });
        it('should return undefined for shortcuts that do not exist', (done) => {
            shortcutService.getEvent('alt+down').then((result) => {
                expect(result).toBeUndefined();
                done();
            });
        });
        it('should return correct event even if it is waiting', (done) => {
            testing_1.TestBed.resetTestingModule();
            testing_1.TestBed.configureTestingModule({
                providers: [
                    shortcuts_service_1.ShortcutService,
                    WINDOW_PROVIDER,
                    {
                        provide: data_service_1.DataService,
                        useClass: MockDataServiceNoResolve
                    }
                ]
            });
            let shortcut = testing_1.TestBed.get(shortcuts_service_1.ShortcutService);
            let mockData = testing_1.TestBed.get(data_service_1.DataService);
            shortcut.getEvent('alt+y').then((result) => {
                expect(result).toEqual('event.selectAll');
                done();
            });
            mockData.resolveShortcuts();
        });
    });
    describe('build event string', () => {
        it('should build a correct string given valid object', () => {
            expect(shortcutService.buildEventString({
                ctrlKey: true,
                altKey: true,
                shiftKey: true,
                which: 74
            })).toEqual('ctrl+alt+shift+j');
            expect(shortcutService.buildEventString({
                metaKey: true,
                altKey: true,
                shiftKey: true,
                which: 78
            })).toEqual('ctrl+alt+shift+n');
            expect(shortcutService.buildEventString({
                which: 78
            })).toEqual('n');
            expect(shortcutService.buildEventString({
                ctrlKey: true,
                which: 37
            })).toEqual('ctrl+left');
        });
    });
});

//# sourceMappingURL=shortcuts.service.spec.js.map
