"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const events_1 = require("events");
const url = tslib_1.__importStar(require("url"));
const is_absolute_url_1 = tslib_1.__importDefault(require("is-absolute-url"));
const file_url_1 = tslib_1.__importDefault(require("file-url"));
const source_map_1 = require("source-map");
const log_1 = require("../../util/log");
const net_1 = require("../../util/net");
const index_1 = require("../index");
const info_1 = require("./info");
let log = log_1.Log.create('SourceMappingThreadActorProxy');
class SourceMappingThreadActorProxy extends events_1.EventEmitter {
    constructor(underlyingActorProxy, pathMapper, connection) {
        super();
        this.underlyingActorProxy = underlyingActorProxy;
        this.pathMapper = pathMapper;
        this.connection = connection;
        this.sourceMappingInfos = new Map();
        this.pendingSources = new Map();
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
            if (this.pendingSources.has(source.actor)) {
                const pending = this.pendingSources.get(source.actor);
                this.pendingSources.delete(source.actor);
                (() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    try {
                        const sourceMappingInfos = yield this.createSourceMappingInfo(source);
                        pending.resolve(sourceMappingInfos);
                    }
                    catch (e) {
                        pending.reject(e);
                    }
                }))();
            }
            return this.sourceMappingInfos.get(source.actor);
        }
        else {
            let sourceMappingInfoPromise = this.createSourceMappingInfo(source);
            this.sourceMappingInfos.set(source.actor, sourceMappingInfoPromise);
            return sourceMappingInfoPromise;
        }
    }
    createSourceMappingInfo(source) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (log.isDebugEnabled) {
                log.debug(`Trying to sourcemap ${JSON.stringify(source)}`);
            }
            let sourceActor = this.connection.getOrCreate(source.actor, () => new index_1.SourceActorProxy(source, this.connection));
            let sourceMapUrl = source.sourceMapURL;
            if (!sourceMapUrl) {
                return new info_1.SourceMappingInfo([sourceActor], sourceActor);
            }
            if (!is_absolute_url_1.default(sourceMapUrl)) {
                if (source.url) {
                    sourceMapUrl = url.resolve(net_1.urlDirname(source.url), sourceMapUrl);
                }
                else {
                    log.warn(`Can't create absolute sourcemap URL from ${sourceMapUrl} - giving up`);
                    return new info_1.SourceMappingInfo([sourceActor], sourceActor);
                }
            }
            if (!net_1.canGetUri(sourceMapUrl)) {
                const sourceMapPath = this.pathMapper.convertFirefoxUrlToPath(sourceMapUrl);
                if (sourceMapPath) {
                    sourceMapUrl = file_url_1.default(sourceMapPath, { resolve: false });
                }
                else {
                    log.warn(`Failed fetching sourcemap from ${sourceMapUrl} - giving up`);
                    return new info_1.SourceMappingInfo([sourceActor], sourceActor);
                }
            }
            let rawSourceMap;
            try {
                const sourceMapString = yield net_1.getUri(sourceMapUrl);
                log.debug('Received sourcemap');
                rawSourceMap = JSON.parse(sourceMapString);
                log.debug('Parsed sourcemap');
            }
            catch (e) {
                log.warn(`Failed fetching sourcemap from ${sourceMapUrl} - giving up`);
                return new info_1.SourceMappingInfo([sourceActor], sourceActor);
            }
            let sourceMapConsumer = yield new source_map_1.SourceMapConsumer(rawSourceMap);
            let sourceMappingSourceActors = [];
            let sourceRoot = rawSourceMap.sourceRoot;
            if (!sourceRoot && source.url) {
                sourceRoot = net_1.urlDirname(source.url);
            }
            else if ((sourceRoot !== undefined) && !is_absolute_url_1.default(sourceRoot)) {
                sourceRoot = url.resolve(sourceMapUrl, sourceRoot);
            }
            log.debug('Created SourceMapConsumer');
            let sourceMappingInfo = new info_1.SourceMappingInfo(sourceMappingSourceActors, sourceActor, sourceMapUrl, sourceMapConsumer, sourceRoot);
            for (let origSource of sourceMapConsumer.sources) {
                origSource = sourceMappingInfo.resolveSource(origSource);
                let sourceMappingSource = this.createOriginalSource(source, origSource, sourceMapUrl);
                let sourceMappingSourceActor = new index_1.SourceMappingSourceActorProxy(sourceMappingSource, sourceMappingInfo);
                sourceMappingSourceActors.push(sourceMappingSourceActor);
            }
            return sourceMappingInfo;
        });
    }
    getSourceMappingInfo(actor) {
        if (this.sourceMappingInfos.has(actor)) {
            return this.sourceMappingInfos.get(actor);
        }
        else {
            const promise = new Promise((resolve, reject) => {
                this.pendingSources.set(actor, { resolve, reject });
            });
            this.sourceMappingInfos.set(actor, promise);
            return promise;
        }
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
            let sourceMappingInfo;
            let source = frame.where.source;
            if (source) {
                sourceMappingInfo = yield this.getOrCreateSourceMappingInfo(source);
            }
            else {
                const sourceMappingInfoPromise = this.getSourceMappingInfo(frame.where.actor);
                sourceMappingInfo = yield sourceMappingInfoPromise;
                source = sourceMappingInfo.underlyingSource.source;
            }
            if (sourceMappingInfo && sourceMappingInfo.sourceMapUri && sourceMappingInfo.sourceMapConsumer) {
                let originalLocation = sourceMappingInfo.originalLocationFor({
                    line: frame.where.line, column: frame.where.column
                });
                let originalSource = this.createOriginalSource(source, originalLocation.source, sourceMappingInfo.sourceMapUri);
                frame.where = {
                    source: originalSource,
                    line: originalLocation.line || undefined,
                    column: originalLocation.column || undefined
                };
            }
        });
    }
    createOriginalSource(generatedSource, originalSourceUrl, sourceMapUrl) {
        return {
            actor: `${generatedSource.actor}!${originalSourceUrl}`,
            url: originalSourceUrl,
            introductionUrl: generatedSource.introductionUrl,
            introductionType: generatedSource.introductionType,
            generatedUrl: generatedSource.url,
            isBlackBoxed: false,
            isPrettyPrinted: false,
            isSourceMapped: true,
            sourceMapURL: sourceMapUrl
        };
    }
    setBreakpoint(line, column, sourceUrl, condition, logValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (log.isDebugEnabled)
                log.debug(`Computing generated location for ${line}:${column} in ${sourceUrl}`);
            let generatedLocation = yield this.findGeneratedLocation(sourceUrl, line, column);
            if (generatedLocation) {
                if (log.isDebugEnabled)
                    log.debug(`Got generated location ${generatedLocation.line}:${generatedLocation.column}`);
            }
            else {
                if (log.isWarnEnabled)
                    log.warn(`Couldn't find generated location for ${line}:${column} in ${sourceUrl}`);
                return;
            }
            yield this.underlyingActorProxy.setBreakpoint(generatedLocation.line, generatedLocation.column, generatedLocation.url, condition, logValue);
        });
    }
    removeBreakpoint(line, column, sourceUrl) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (log.isDebugEnabled)
                log.debug(`Computing generated location for ${line}:${column} in ${sourceUrl}`);
            let generatedLocation = yield this.findGeneratedLocation(sourceUrl, line, column);
            if (generatedLocation) {
                if (log.isDebugEnabled)
                    log.debug(`Got generated location ${generatedLocation.line}:${generatedLocation.column}`);
            }
            else {
                if (log.isWarnEnabled)
                    log.warn(`Couldn't find generated location for ${line}:${column} in ${sourceUrl}`);
                return;
            }
            yield this.underlyingActorProxy.removeBreakpoint(generatedLocation.line, generatedLocation.column, generatedLocation.url);
        });
    }
    pauseOnExceptions(pauseOnExceptions, ignoreCaughtExceptions) {
        return this.underlyingActorProxy.pauseOnExceptions(pauseOnExceptions, ignoreCaughtExceptions);
    }
    attach(options) {
        return this.underlyingActorProxy.attach(options);
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
    findOriginalLocation(generatedUrl, line, column) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const infoPromise of this.sourceMappingInfos.values()) {
                const info = yield infoPromise;
                if (generatedUrl === info.underlyingSource.url) {
                    const originalLocation = info.originalLocationFor({ line, column: column || 1 });
                    if (originalLocation.source && originalLocation.line) {
                        return {
                            url: originalLocation.source,
                            line: originalLocation.line,
                            column: originalLocation.column || undefined
                        };
                    }
                }
            }
            return undefined;
        });
    }
    findGeneratedLocation(sourceUrl, line, column) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const infoPromise of this.sourceMappingInfos.values()) {
                const info = yield infoPromise;
                for (const originalSource of info.sources) {
                    if (sourceUrl === originalSource.url) {
                        const generatedLocation = info.generatedLocationFor({ source: sourceUrl, line, column });
                        if ((generatedLocation.line !== null) && (generatedLocation.column !== null)) {
                            const { line, column } = info_1.findNextBreakpointPosition(generatedLocation.line, generatedLocation.column, yield info.underlyingSource.getBreakpointPositions());
                            return {
                                url: info.underlyingSource.url,
                                line,
                                column
                            };
                        }
                    }
                }
            }
            return undefined;
        });
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