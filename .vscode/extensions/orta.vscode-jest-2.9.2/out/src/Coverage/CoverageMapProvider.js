"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const istanbul_lib_source_maps_1 = require("istanbul-lib-source-maps");
const istanbul_lib_coverage_1 = require("istanbul-lib-coverage");
class CoverageMapProvider {
    constructor() {
        this._map = istanbul_lib_coverage_1.createCoverageMap();
        this.mapStore = istanbul_lib_source_maps_1.createSourceMapStore();
    }
    get map() {
        return this._map;
    }
    update(obj) {
        const map = istanbul_lib_coverage_1.createCoverageMap(obj);
        const transformed = this.mapStore.transformCoverage(map);
        this._map = transformed.map;
    }
    getFileCoverage(filePath) {
        return this._map.data[filePath];
    }
}
exports.CoverageMapProvider = CoverageMapProvider;
//# sourceMappingURL=CoverageMapProvider.js.map