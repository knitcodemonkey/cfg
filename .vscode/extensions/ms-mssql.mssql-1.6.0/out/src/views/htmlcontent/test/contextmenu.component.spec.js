"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@angular/core/testing");
const contextmenu_component_1 = require("./../src/js/components/contextmenu.component");
const shortcuts_service_1 = require("./../src/js/services/shortcuts.service");
class MockShortCutService {
    constructor() {
        this.keyToString = {
            'event.saveAsCSV': 'ctrl+s',
            'event.saveAsJSON': 'ctrl+shift+s',
            'event.saveAsExcel': 'ctrl+shift+l',
            'event.selectAll': 'ctrl+a',
            'event.copySelection': 'ctrl+c',
            'event.copyWithHeaders': 'ctrl+shift+c'
        };
    }
    stringCodeFor(value) {
        return Promise.resolve(this.keyToString[value]);
    }
}
describe('context Menu', () => {
    beforeEach(testing_1.async(() => {
        testing_1.TestBed.configureTestingModule({
            declarations: [contextmenu_component_1.ContextMenu]
        }).overrideComponent(contextmenu_component_1.ContextMenu, {
            set: {
                providers: [
                    {
                        provide: shortcuts_service_1.ShortcutService,
                        useClass: MockShortCutService
                    }
                ]
            }
        });
    }));
    describe('initialization', () => {
        let fixture;
        let comp;
        let ele;
        beforeEach(() => {
            fixture = testing_1.TestBed.createComponent(contextmenu_component_1.ContextMenu);
            fixture.detectChanges();
            comp = fixture.componentInstance;
            ele = fixture.nativeElement;
        });
        it('should be hidden', () => {
            expect(ele.firstElementChild.className.indexOf('hidden')).not.toEqual(-1);
        });
    });
    describe('basic behavior', () => {
        let fixture;
        let comp;
        let ele;
        beforeEach(() => {
            fixture = testing_1.TestBed.createComponent(contextmenu_component_1.ContextMenu);
            fixture.detectChanges();
            comp = fixture.componentInstance;
            ele = fixture.nativeElement;
        });
        it('shows correctly', () => {
            comp.show(0, 0, 0, 0, 0, []);
            fixture.detectChanges();
            expect(ele.firstElementChild.className.indexOf('hidden')).toEqual(-1);
            expect(ele.firstElementChild.childElementCount).toEqual(6, 'expect 6 menu items to be present');
        });
        it('hides correctly', () => {
            ele.click();
            fixture.detectChanges();
            expect(ele.firstElementChild.className.indexOf('hidden')).not.toEqual(-1);
        });
        it('emits correct event', (done) => {
            comp.clickEvent.subscribe((result) => {
                expect(result.type).toEqual('savecsv');
                expect(result.batchId).toEqual(0);
                expect(result.resultId).toEqual(0);
                expect(result.index).toEqual(0);
                expect(result.selection).toEqual([]);
                done();
            });
            comp.show(0, 0, 0, 0, 0, []);
            fixture.detectChanges();
            let firstLi = ele.firstElementChild.firstElementChild;
            firstLi.click();
            fixture.detectChanges();
        });
    });
});

//# sourceMappingURL=contextmenu.component.spec.js.map
