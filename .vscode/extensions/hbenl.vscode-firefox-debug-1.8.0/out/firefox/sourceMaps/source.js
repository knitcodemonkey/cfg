"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const log_1 = require("../../util/log");
const net_1 = require("../../util/net");
const log = log_1.Log.create('SourceMappingSourceActorProxy');
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
    getBreakpointPositions() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.getBreakpointPositionsPromise) {
                this.getBreakpointPositionsPromise = this.getBreakpointPositionsInt();
            }
            return this.getBreakpointPositionsPromise;
        });
    }
    getBreakpointPositionsInt() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (log.isDebugEnabled)
                log.debug(`Fetching generated breakpoint positions for ${this.url}`);
            let generatedBreakpointPositions = yield this.sourceMappingInfo.underlyingSource.getBreakpointPositions();
            if (log.isDebugEnabled)
                log.debug(`Computing original breakpoint positions for ${Object.keys(generatedBreakpointPositions).length} generated lines`);
            const originalBreakpointPositions = {};
            for (const generatedLine in generatedBreakpointPositions) {
                for (const generatedColumn of generatedBreakpointPositions[generatedLine]) {
                    const originalLocation = this.sourceMappingInfo.originalLocationFor({
                        line: parseInt(generatedLine),
                        column: generatedColumn
                    });
                    if ((originalLocation.line !== null) && (originalLocation.column !== null) &&
                        (originalLocation.source === this.url)) {
                        if (originalBreakpointPositions[originalLocation.line] === undefined) {
                            originalBreakpointPositions[originalLocation.line] = [];
                        }
                        originalBreakpointPositions[originalLocation.line].push(originalLocation.column);
                    }
                    else {
                        if (log.isWarnEnabled)
                            log.warn(`Got ${originalLocation.line}:${originalLocation.column} as original location for ${generatedLine}:${generatedColumn} in ${this.url}`);
                    }
                }
            }
            return originalBreakpointPositions;
        });
    }
    setBreakpoint(location, condition) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (log.isDebugEnabled)
                log.debug(`Computing generated location for ${this.url}:${location.line}:${location.column}`);
            let generatedLocation = this.sourceMappingInfo.generatedLocationFor({
                source: this.url, line: location.line, column: location.column || 0
            });
            if (log.isDebugEnabled)
                log.debug(`Got generated location ${generatedLocation.line}:${generatedLocation.column}`);
            const generatedLine = generatedLocation.line;
            if (generatedLine === null) {
                throw 'Couldn\'t find generated location';
            }
            let result = yield this.sourceMappingInfo.underlyingSource.setBreakpoint({ line: generatedLine, column: generatedLocation.column || undefined }, condition);
            let actualGeneratedLocation = result.actualLocation || generatedLocation;
            if (log.isDebugEnabled)
                log.debug(`Computing original location for ${actualGeneratedLocation.line}:${actualGeneratedLocation.column}`);
            let actualOriginalLocation = this.sourceMappingInfo.originalLocationFor({
                line: actualGeneratedLocation.line || 1,
                column: actualGeneratedLocation.column || 1
            });
            if (log.isDebugEnabled)
                log.debug(`Got original location ${actualOriginalLocation.line}:${actualOriginalLocation.column}`);
            result.actualLocation = {
                source: this.source,
                line: actualOriginalLocation.line || undefined,
                column: actualOriginalLocation.column || undefined
            };
            return result;
        });
    }
    fetchSource() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (log.isDebugEnabled)
                log.debug(`Fetching source for ${this.url}`);
            let embeddedSource = this.sourceMappingInfo.sourceMapConsumer.sourceContentFor(this.url);
            if (embeddedSource) {
                if (log.isDebugEnabled)
                    log.debug(`Got embedded source for ${this.url}`);
                return embeddedSource;
            }
            else {
                const source = yield net_1.getUri(this.url);
                if (log.isDebugEnabled)
                    log.debug(`Got non-embedded source for ${this.url}`);
                return source;
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