"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@angular/core/testing");
const messagescontextmenu_component_1 = require("./../src/js/components/messagescontextmenu.component");
const shortcuts_service_1 = require("./../src/js/services/shortcuts.service");
class MockShortCutService {
    constructor() {
        this.keyToString = {
            'event.copySelection': 'ctrl+c'
        };
    }
    stringCodeFor(value) {
        return Promise.resolve(this.keyToString[value]);
    }
}
describe('Messages Context Menu', () => {
    beforeEach(testing_1.async(() => {
        testing_1.TestBed.configureTestingModule({
            declarations: [messagescontextmenu_component_1.MessagesContextMenu]
        }).overrideComponent(messagescontextmenu_component_1.MessagesContextMenu, {
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
            fixture = testing_1.TestBed.createComponent(messagescontextmenu_component_1.MessagesContextMenu);
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
            fixture = testing_1.TestBed.createComponent(messagescontextmenu_component_1.MessagesContextMenu);
            fixture.detectChanges();
            comp = fixture.componentInstance;
            ele = fixture.nativeElement;
        });
        it('shows correctly', () => {
            comp.show(0, 0, {});
            fixture.detectChanges();
            expect(ele.firstElementChild.className.indexOf('hidden')).toEqual(-1);
            expect(ele.firstElementChild.childElementCount).toEqual(1, 'expect 1 menu items to be present');
        });
        it('hides correctly', () => {
            ele.click();
            fixture.detectChanges();
            expect(ele.firstElementChild.className.indexOf('hidden')).not.toEqual(-1);
        });
        it('disables copy when range is empty', () => {
            comp.show(0, 0, { toString: () => '' });
            fixture.detectChanges();
            // expect disabled element if toString is undefined
            let firstLi = ele.firstElementChild.firstElementChild;
            expect(firstLi.className.indexOf('disabled')).not.toEqual(-1);
        });
        it('enables copy when range has text', () => {
            comp.show(0, 0, { toString: () => 'text' });
            fixture.detectChanges();
            // expect disabled element if toString is undefined
            let firstLi = ele.firstElementChild.firstElementChild;
            expect(firstLi.className.indexOf('disabled')).toEqual(-1);
        });
        it('emits correct event', (done) => {
            let range = { toString: () => 'text' };
            comp.clickEvent.subscribe((result) => {
                expect(result.type).toEqual('copySelection');
                expect(result.selectedRange).toEqual(range);
                done();
            });
            comp.show(0, 0, range);
            fixture.detectChanges();
            let firstLi = ele.firstElementChild.firstElementChild;
            firstLi.click();
            fixture.detectChanges();
        });
    });
});

//# sourceMappingURL=messagescontextmenu.component.spec.js.map
