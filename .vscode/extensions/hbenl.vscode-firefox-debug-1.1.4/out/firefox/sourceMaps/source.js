"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const net_1 = require("../../util/net");
class SourceMappingSourceActorProxy {
    constructor(source, sourceMappingInfo) {
        this.source = source;
        this.sourceMappingInfo = sourceMappingInfo;
    }
    get name() {
        return this.source.actor;
    }
    get url() {
        return this.source.url;
    }
    setBreakpoint(location, condition) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let generatedLocation = this.sourceMappingInfo.generatedLocationFor({
                source: this.url, line: location.line, column: location.column || 0
            });
            let result = yield this.sourceMappingInfo.underlyingSource.setBreakpoint(generatedLocation, condition);
            let actualGeneratedLocation = result.actualLocation || generatedLocation;
            let actualOriginalLocation = this.sourceMappingInfo.originalLocationFor({
                line: actualGeneratedLocation.line || 1,
                column: actualGeneratedLocation.column || 1
            });
            result.actualLocation = {
                source: this.source,
                line: actualOriginalLocation.line,
                column: actualOriginalLocation.column
            };
            return result;
        });
    }
    fetchSource() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let embeddedSource = this.sourceMappingInfo.sourceMapConsumer.sourceContentFor(this.url);
            if (embeddedSource) {
                return embeddedSource;
            }
            else {
                return yield net_1.getUri(this.url);
            }
        });
    }
    setBlackbox(blackbox) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.source.isBlackBoxed = blackbox;
            this.sourceMappingInfo.syncBlackboxFlag();
        });
    }
    dispose() {
        this.sourceMappingInfo.disposeSource(this);
    }
}
exports.SourceMappingSourceActorProxy = SourceMappingSourceActorProxy;
//# sourceMappingURL=source.js.map