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
const angular2_slickgrid_1 = require("angular2-slickgrid");
let SlickGridHost = class SlickGridHost {
    constructor() {
        this.selectionModel = 'DragRowSelectionModel';
    }
    ngOnInit() {
        let numberOfColumns = 10;
        let numberOfRows = 100;
        let columns = [];
        for (let i = 0; i < numberOfColumns; i++) {
            columns.push({
                id: i.toString(),
                name: i.toString(),
                type: this.randomType()
            });
        }
        let loadDataFunction = (offset, count) => {
            return new Promise((resolve) => {
                let data = [];
                for (let i = offset; i < offset + count; i++) {
                    let row = {
                        values: []
                    };
                    for (let j = 0; j < numberOfColumns; j++) {
                        row.values.push(`column ${j}; row ${i}`);
                    }
                    data.push(row);
                }
                resolve(data);
            });
        };
        this.columnDefinitions = columns;
        this.dataRows = new angular2_slickgrid_1.VirtualizedCollection(50, numberOfRows, loadDataFunction, (index) => {
            return { values: [] };
        });
    }
    randomType() {
        let types = [angular2_slickgrid_1.FieldType.Boolean, angular2_slickgrid_1.FieldType.Date, angular2_slickgrid_1.FieldType.Decimal, angular2_slickgrid_1.FieldType.Integer,
            angular2_slickgrid_1.FieldType.String];
        let rand = Math.floor(Math.random() * (types.length - 0 + 1));
        return types[rand];
    }
};
__decorate([
    core_1.ViewChild(angular2_slickgrid_1.SlickGrid),
    __metadata("design:type", Object)
], SlickGridHost.prototype, "slickgrid", void 0);
SlickGridHost = __decorate([
    core_1.Component({
        template: `
    <slick-grid [dataRows]="dataRows"
                [columnDefinitions]="columnDefinitions"
                [selectionModel]="selectionModel"
                showDataTypeIcon="false"></slick-grid>`
    })
], SlickGridHost);
describe('drag row selection', () => {
    let fixture;
    let comp;
    let ele;
    beforeEach(testing_1.async(() => {
        testing_1.TestBed.resetTestingModule();
        testing_1.TestBed.configureTestingModule({
            declarations: [angular2_slickgrid_1.SlickGrid, SlickGridHost]
        });
    }));
    describe('basic selection', () => {
        beforeEach(() => {
            fixture = testing_1.TestBed.createComponent(SlickGridHost);
            comp = fixture.componentInstance.slickgrid;
            ele = fixture.nativeElement;
            fixture.detectChanges();
        });
        it('initilized properly', () => {
            expect(ele.querySelector('slick-grid')).not.toBeNull('slickgrid was not created');
        });
        it('clicking a cell selects it', () => {
            let slickgrid = ele.querySelector('slick-grid');
            let canvas = slickgrid.querySelector('.grid-canvas');
            let nodeone = canvas.firstElementChild.childNodes[1];
            let cellone = nodeone.firstElementChild;
            cellone.click();
            fixture.detectChanges();
            let selection = comp.getSelectedRanges();
            expect(selection.length).toEqual(1);
            expect(selection[0].fromCell).toEqual(0);
            expect(selection[0].toCell).toEqual(0);
            expect(selection[0].fromRow).toEqual(0);
            expect(selection[0].toRow).toEqual(0);
        });
    });
});

//# sourceMappingURL=dragrowselection.spec.js.map
