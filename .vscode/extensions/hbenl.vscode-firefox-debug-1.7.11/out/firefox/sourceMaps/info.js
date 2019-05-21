"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
const misc_1 = require("../../util/misc");
const source_map_1 = require("source-map");
let LEAST_UPPER_BOUND = source_map_1.SourceMapConsumer.LEAST_UPPER_BOUND;
let GREATEST_LOWER_BOUND = source_map_1.SourceMapConsumer.GREATEST_LOWER_BOUND;
const isWindowsPlatform = misc_1.isWindowsPlatform();
const windowsAbsolutePathRegEx = /^[a-zA-Z]:[\/\\]/;
class SourceMappingInfo {
    constructor(sources, underlyingSource, sourceMapUri, sourceMapConsumer, sourceRoot) {
        this.sources = sources;
        this.underlyingSource = underlyingSource;
        this.sourceMapUri = sourceMapUri;
        this.sourceMapConsumer = sourceMapConsumer;
        this.sourceRoot = sourceRoot;
    }
    generatedLocationFor(originalLocation) {
        if (!this.sourceMapConsumer) {
            return {
                line: originalLocation.line,
                column: originalLocation.column,
                lastColumn: null
            };
        }
        const originalSource = this.findUnresolvedSource(originalLocation.source);
        if (!originalSource) {
            throw 'Couldn\'t find original source';
        }
        let consumerArgs = Object.assign({ bias: LEAST_UPPER_BOUND }, originalLocation);
        consumerArgs.source = originalSource;
        let generatedLocation = this.sourceMapConsumer.generatedPositionFor(consumerArgs);
        if (generatedLocation.line === null) {
            consumerArgs.bias = GREATEST_LOWER_BOUND;
            generatedLocation = this.sourceMapConsumer.generatedPositionFor(consumerArgs);
        }
        if (this.underlyingSource.source.introductionType === 'wasm') {
            return { line: generatedLocation.column, column: 0, lastColumn: null };
        }
        return generatedLocation;
    }
    originalLocationFor(generatedLocation) {
        if (!this.sourceMapConsumer) {
            return Object.assign({ source: this.sources[0].url, name: null }, generatedLocation);
        }
        let consumerArgs = Object.assign({ bias: GREATEST_LOWER_BOUND }, generatedLocation);
        if (this.underlyingSource.source.introductionType === 'wasm') {
            consumerArgs.column = consumerArgs.line;
            consumerArgs.line = 1;
        }
        let originalLocation = this.sourceMapConsumer.originalPositionFor(consumerArgs);
        if (originalLocation.line === null) {
            consumerArgs.bias = LEAST_UPPER_BOUND;
            originalLocation = this.sourceMapConsumer.originalPositionFor(consumerArgs);
        }
        if (originalLocation.source) {
            originalLocation.source = this.resolveSource(originalLocation.source);
        }
        if ((this.underlyingSource.source.introductionType === 'wasm') && originalLocation.line) {
            originalLocation.line--;
        }
        return originalLocation;
    }
    syncBlackboxFlag() {
        if ((this.sources.length === 1) && (this.sources[0] === this.underlyingSource)) {
            return;
        }
        let blackboxUnderlyingSource = this.sources.every((source) => source.source.isBlackBoxed);
        if (this.underlyingSource.source.isBlackBoxed !== blackboxUnderlyingSource) {
            this.underlyingSource.setBlackbox(blackboxUnderlyingSource);
        }
    }
    disposeSource(source) {
        let sourceIndex = this.sources.indexOf(source);
        if (sourceIndex >= 0) {
            this.sources.splice(sourceIndex, 1);
            if (this.sources.length === 0) {
                this.underlyingSource.dispose();
            }
        }
    }
    resolveSource(sourceUrl) {
        if (isWindowsPlatform) {
            if (windowsAbsolutePathRegEx.test(sourceUrl)) {
                sourceUrl = encodeURI('file:///' + sourceUrl.replace(/\\/g, '/'));
            }
        }
        else {
            if (sourceUrl.startsWith('/')) {
                sourceUrl = encodeURI('file://' + sourceUrl);
            }
        }
        if (this.sourceRoot) {
            sourceUrl = url.resolve(this.sourceRoot, sourceUrl);
        }
        return sourceUrl;
    }
    findUnresolvedSource(resolvedSource) {
        if (!this.sourceMapConsumer)
            return undefined;
        for (const source of this.sourceMapConsumer.sources) {
            if ((source === resolvedSource) ||
                (this.resolveSource(source) === resolvedSource)) {
                return source;
            }
        }
        return undefined;
    }
}
exports.SourceMappingInfo = SourceMappingInfo;
//# sourceMappingURL=info.js.map