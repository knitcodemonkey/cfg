"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const events_1 = require("events");
const url = require("url");
const isAbsoluteUrl = require("is-absolute-url");
const source_map_1 = require("source-map");
const log_1 = require("../../util/log");
const net_1 = require("../../util/net");
const index_1 = require("../index");
const info_1 = require("./info");
let log = log_1.Log.create('SourceMappingThreadActorProxy');
class SourceMappingThreadActorProxy extends events_1.EventEmitter {
    constructor(underlyingActorProxy, connection) {
        super();
        this.underlyingActorProxy = underlyingActorProxy;
        this.connection = connection;
        this.sourceMappingInfos = new Map();
        underlyingActorProxy.onNewSource((actor) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            let sourceMappingInfo = yield this.getOrCreateSourceMappingInfo(actor.source);
            for (let source of sourceMappingInfo.sources) {
                this.emit('newSource', source);
            }
        }));
    }
    get name() {
        return this.underlyingActorProxy.name;
    }
    fetchSources() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let underlyingSources = yield this.underlyingActorProxy.fetchSources();
            let allMappedSources = [];
            for (let source of underlyingSources) {
                let info = yield this.getOrCreateSourceMappingInfo(source);
                let mappedSources = info.sources.map((actor) => actor.source);
                allMappedSources.push(...mappedSources);
            }
            return allMappedSources;
        });
    }
    getOrCreateSourceMappingInfo(source) {
        if (this.sourceMappingInfos.has(source.actor)) {
            return this.sourceMappingInfos.get(source.actor);
        }
        else {
            let sourceMappingInfo = this.createSourceMappingInfo(source);
            this.sourceMappingInfos.set(source.actor, sourceMappingInfo);
            return sourceMappingInfo;
        }
    }
    createSourceMappingInfo(source) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (log.isDebugEnabled) {
                log.debug(`Trying to sourcemap ${JSON.stringify(source)}`);
            }
            let sourceActor = this.connection.getOrCreate(source.actor, () => new index_1.SourceActorProxy(source, this.connection));
            let sourceMapUri = source.sourceMapURL;
            if (!sourceMapUri) {
                return new info_1.SourceMappingInfo([sourceActor], sourceActor);
            }
            if (!isAbsoluteUrl(sourceMapUri)) {
                if (source.url) {
                    sourceMapUri = url.resolve(net_1.urlDirname(source.url), sourceMapUri);
                }
                else {
                    log.warn(`Can't create absolute sourcemap URL from ${sourceMapUri} - giving up`);
                    return new info_1.SourceMappingInfo([sourceActor], sourceActor);
                }
            }
            let rawSourceMap;
            try {
                rawSourceMap = JSON.parse(yield net_1.getUri(sourceMapUri));
            }
            catch (e) {
                log.warn(`Failed fetching sourcemap from ${sourceMapUri} - giving up`);
                return new info_1.SourceMappingInfo([sourceActor], sourceActor);
            }
            let sourceMapConsumer = new source_map_1.SourceMapConsumer(rawSourceMap);
            let sourceMappingSourceActors = [];
            let sourceMappingInfo = new info_1.SourceMappingInfo(sourceMappingSourceActors, sourceActor, sourceMapUri, sourceMapConsumer);
            for (let origSource of sourceMapConsumer.sources) {
                if (rawSourceMap.sourceRoot) {
                    origSource = url.resolve(rawSourceMap.sourceRoot, origSource);
                }
                let sourceMappingSource = this.createOriginalSource(source, origSource, sourceMapUri);
                let sourceMappingSourceActor = new index_1.SourceMappingSourceActorProxy(sourceMappingSource, sourceMappingInfo);
                sourceMappingSourceActors.push(sourceMappingSourceActor);
            }
            return sourceMappingInfo;
        });
    }
    fetchStackFrames(start, count) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let stackFrames = yield this.underlyingActorProxy.fetchStackFrames(start, count);
            yield Promise.all(stackFrames.map((frame) => this.applySourceMapToFrame(frame)));
            return stackFrames;
        });
    }
    applySourceMapToFrame(frame) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let sourceMappingInfo = yield this.getOrCreateSourceMappingInfo(frame.where.source);
            if (sourceMappingInfo.sourceMapUri && sourceMappingInfo.sourceMapConsumer) {
                let originalLocation = sourceMappingInfo.originalLocationFor({
                    line: frame.where.line, column: frame.where.column
                });
                let originalSource = this.createOriginalSource(frame.where.source, originalLocation.source, sourceMappingInfo.sourceMapUri);
                frame.where = {
                    source: originalSource,
                    line: originalLocation.line,
                    column: originalLocation.column
                };
            }
        });
    }
    createOriginalSource(generatedSource, originalSourceUrl, sourceMapUri) {
        return {
            actor: `${generatedSource.actor}!${originalSourceUrl}`,
            url: originalSourceUrl,
            introductionUrl: generatedSource.introductionUrl,
            introductionType: generatedSource.introductionType,
            generatedUrl: generatedSource.url,
            isBlackBoxed: false,
            isPrettyPrinted: false,
            isSourceMapped: true,
            sourceMapURL: sourceMapUri
        };
    }
    attach() {
        return this.underlyingActorProxy.attach(false);
    }
    resume(exceptionBreakpoints, resumeLimitType) {
        return this.underlyingActorProxy.resume(exceptionBreakpoints, resumeLimitType);
    }
    interrupt(immediately = true) {
        return this.underlyingActorProxy.interrupt(immediately);
    }
    detach() {
        return this.underlyingActorProxy.detach();
    }
    onPaused(cb) {
        this.underlyingActorProxy.onPaused((event) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.applySourceMapToFrame(event.frame);
            cb(event);
        }));
    }
    onResumed(cb) {
        this.underlyingActorProxy.onResumed(cb);
    }
    onExited(cb) {
        this.underlyingActorProxy.onExited(cb);
    }
    onWrongState(cb) {
        this.underlyingActorProxy.onWrongState(cb);
    }
    onNewSource(cb) {
        this.on('newSource', cb);
    }
    onNewGlobal(cb) {
        this.underlyingActorProxy.onNewGlobal(cb);
    }
    dispose() {
        this.underlyingActorProxy.dispose();
    }
}
exports.SourceMappingThreadActorProxy = SourceMappingThreadActorProxy;
//# sourceMappingURL=thread.js.map