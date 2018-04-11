"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chokidar = require("chokidar");
const debounce = require("debounce");
const vscode_debugadapter_1 = require("vscode-debugadapter");
const log_1 = require("./util/log");
const addonManager_1 = require("./adapter/addonManager");
const launch_1 = require("./firefox/launch");
const index_1 = require("./firefox/index");
const index_2 = require("./adapter/index");
const pathMapper_1 = require("./util/pathMapper");
const misc_1 = require("./util/misc");
const fs_1 = require("./util/fs");
const net_1 = require("./util/net");
let log = log_1.Log.create('FirefoxDebugSession');
let consoleActorLog = log_1.Log.create('ConsoleActor');
class FirefoxDebugSession {
    constructor(config, sendEvent) {
        this.config = config;
        this.sendEvent = sendEvent;
        this.isWindowsPlatform = misc_1.isWindowsPlatform();
        this.threadPauseCoordinator = new index_2.ThreadPauseCoordinator();
        this.tabs = new index_2.Registry();
        this.threads = new index_2.Registry();
        this.sources = new index_2.Registry();
        this.frames = new index_2.Registry();
        this.variablesProviders = new index_2.Registry();
        this.exceptionBreakpoints = index_1.ExceptionBreakpoints.All;
        this.reloadTabs = false;
        this.lastActiveThreadId = 0;
        this.pathMapper = new pathMapper_1.PathMapper(this.config.pathMappings, this.config.addon);
        this.breakpointsAdapter = new index_2.BreakpointsAdapter(this.threads, this.sendEvent);
        this.skipFilesManager = new index_2.SkipFilesManager(this.config.filesToSkip, this.threads);
        if (this.config.addon) {
            this.addonManager = new addonManager_1.AddonManager(this);
        }
    }
    start() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let socket = yield this.connectToFirefox();
            this.firefoxDebugConnection = new index_1.DebugConnection(this.config.sourceMaps, socket);
            this.firefoxDebugSocketClosed = false;
            let rootActor = this.firefoxDebugConnection.rootActor;
            rootActor.onTabOpened(([tabActor, consoleActor]) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                log.info(`Tab opened with url ${tabActor.url}`);
                let tabId = this.tabs.register(tabActor);
                let threadAdapter = yield this.attachTabOrAddon(tabActor, consoleActor, `Tab ${tabId}`, tabId);
                if (threadAdapter !== undefined) {
                    this.attachConsole(consoleActor, threadAdapter);
                }
            }));
            rootActor.onTabListChanged(() => {
                rootActor.fetchTabs();
            });
            rootActor.onInit(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield misc_1.delay(200);
                let actors = yield rootActor.fetchTabs();
                if (this.addonManager) {
                    this.addonManager.sessionStarted(rootActor, actors.addons, actors.preference, this);
                }
                this.reloadTabs = false;
            }));
            socket.on('close', () => {
                log.info('Connection to Firefox closed - terminating debug session');
                this.firefoxDebugSocketClosed = true;
                this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
            });
            if (this.config.reloadOnChange) {
                this.reloadWatcher = chokidar.watch(this.config.reloadOnChange.watch, {
                    ignored: this.config.reloadOnChange.ignore,
                    ignoreInitial: true
                });
                let reload;
                if (this.config.addon) {
                    reload = () => {
                        if (this.addonManager) {
                            log.debug('Reloading add-on');
                            this.addonManager.reloadAddon();
                        }
                    };
                }
                else {
                    reload = () => {
                        log.debug('Reloading tabs');
                        for (let [, tabActor] of this.tabs) {
                            tabActor.reload();
                        }
                    };
                }
                if (this.config.reloadOnChange.debounce > 0) {
                    reload = debounce(reload, this.config.reloadOnChange.debounce);
                }
                this.reloadWatcher.on('add', reload);
                this.reloadWatcher.on('change', reload);
                this.reloadWatcher.on('unlink', reload);
            }
            this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
        });
    }
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let detachPromises = [];
            if (!this.firefoxDebugSocketClosed) {
                for (let [, threadAdapter] of this.threads) {
                    detachPromises.push(threadAdapter.detach());
                }
            }
            yield Promise.all(detachPromises);
            yield this.disconnectFirefoxAndCleanup();
        });
    }
    setExceptionBreakpoints(exceptionBreakpoints) {
        this.exceptionBreakpoints = exceptionBreakpoints;
        for (let [, threadAdapter] of this.threads) {
            threadAdapter.setExceptionBreakpoints(this.exceptionBreakpoints);
        }
    }
    setActiveThread(threadAdapter) {
        this.lastActiveThreadId = threadAdapter.id;
    }
    getActiveThread() {
        let threadAdapter = this.threads.find(this.lastActiveThreadId);
        if (threadAdapter !== undefined) {
            return threadAdapter;
        }
        for (let [, threadAdapter] of this.threads) {
            this.setActiveThread(threadAdapter);
            return threadAdapter;
        }
        return undefined;
    }
    getOrCreateObjectGripActorProxy(objectGrip) {
        return this.firefoxDebugConnection.getOrCreate(objectGrip.actor, () => new index_1.ObjectGripActorProxy(objectGrip, this.firefoxDebugConnection));
    }
    getOrCreateLongStringGripActorProxy(longStringGrip) {
        return this.firefoxDebugConnection.getOrCreate(longStringGrip.actor, () => new index_1.LongStringGripActorProxy(longStringGrip, this.firefoxDebugConnection));
    }
    connectToFirefox() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let socket = undefined;
            if (this.config.attach) {
                try {
                    socket = yield net_1.connect(this.config.attach.port, this.config.attach.host);
                    this.reloadTabs = this.config.attach.reloadTabs;
                }
                catch (err) {
                    if (!this.config.launch) {
                        throw err;
                    }
                }
            }
            if (socket === undefined) {
                let sendToConsole = (this.config.addon && this.config.addon.type === 'addonSdk') ?
                    (msg) => this.sendEvent(new vscode_debugadapter_1.OutputEvent(msg + '\n', 'stdout')) :
                    (msg) => undefined;
                this.firefoxProc = yield launch_1.launchFirefox(this.config.launch, sendToConsole, this.addonManager);
                socket = yield net_1.waitForSocket(this.config.launch.port);
            }
            return socket;
        });
    }
    disconnectFirefoxAndCleanup() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.reloadWatcher !== undefined) {
                this.reloadWatcher.close();
                this.reloadWatcher = undefined;
            }
            if (!this.firefoxDebugSocketClosed) {
                yield this.firefoxDebugConnection.disconnect();
            }
            if (this.config.launch) {
                let launchConfig = this.config.launch;
                if (this.firefoxProc) {
                    let firefoxProc = this.firefoxProc;
                    if (launchConfig.tmpDirs.length > 0) {
                        yield new Promise((resolve) => {
                            this.firefoxProc.once('exit', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                                try {
                                    yield Promise.all(launchConfig.tmpDirs.map((tmpDir) => fs_1.tryRemoveRepeatedly(tmpDir)));
                                }
                                catch (err) {
                                    log.warn(`Failed to remove temporary directory: ${err}`);
                                }
                                resolve();
                            }));
                            firefoxProc.kill('SIGTERM');
                        });
                    }
                    else {
                        firefoxProc.kill('SIGTERM');
                    }
                    this.firefoxProc = undefined;
                }
            }
        });
    }
    attachTabOrAddon(tabActor, consoleActor, threadName, tabId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let reload = (tabId != null) && this.reloadTabs;
            let threadActor;
            try {
                threadActor = yield tabActor.attach();
            }
            catch (err) {
                log.error(`Failed attaching to tab: ${err}`);
                return undefined;
            }
            log.debug(`Attached to tab ${tabActor.name}`);
            let threadAdapter = new index_2.ThreadAdapter(threadActor, consoleActor, this.threadPauseCoordinator, threadName, this);
            this.sendThreadStartedEvent(threadAdapter);
            this.attachThread(threadAdapter, threadActor.name);
            tabActor.onFramesDestroyed(() => {
                this.sendEvent(new vscode_debugadapter_1.Event('removeSources', {
                    threadId: threadAdapter.id
                }));
            });
            if (tabId != null) {
                let nextWorkerId = 1;
                tabActor.onWorkerStarted((workerActor) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    log.info(`Worker started with url ${tabActor.url}`);
                    let workerId = nextWorkerId++;
                    try {
                        yield this.attachWorker(workerActor, tabId, workerId);
                    }
                    catch (err) {
                        log.error(`Failed attaching to worker: ${err}`);
                    }
                }));
                tabActor.onWorkerListChanged(() => tabActor.fetchWorkers());
                tabActor.fetchWorkers();
                tabActor.onDetached(() => {
                    this.threadPauseCoordinator.threadTerminated(threadAdapter.id, threadAdapter.name);
                    if (this.threads.has(threadAdapter.id)) {
                        this.threads.unregister(threadAdapter.id);
                        this.sendThreadExitedEvent(threadAdapter);
                    }
                    threadAdapter.dispose();
                    this.tabs.unregister(tabId);
                    tabActor.dispose();
                });
            }
            try {
                yield threadAdapter.init(this.exceptionBreakpoints);
                if (reload) {
                    yield tabActor.reload();
                }
                return threadAdapter;
            }
            catch (err) {
                log.info(`Failed attaching to tab: ${err}`);
                return undefined;
            }
        });
    }
    attachWorker(workerActor, tabId, workerId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield workerActor.attach();
            let [threadActor, consoleActor] = yield workerActor.connect();
            log.debug(`Attached to worker ${workerActor.name}`);
            let threadAdapter = new index_2.ThreadAdapter(threadActor, consoleActor, this.threadPauseCoordinator, `Worker ${tabId}/${workerId}`, this);
            this.sendThreadStartedEvent(threadAdapter);
            this.attachThread(threadAdapter, threadActor.name);
            yield threadAdapter.init(this.exceptionBreakpoints);
            workerActor.onClose(() => {
                this.threads.unregister(threadAdapter.id);
                this.sendThreadExitedEvent(threadAdapter);
            });
        });
    }
    attachThread(threadAdapter, actorName) {
        threadAdapter.onNewSource((sourceActor) => {
            this.attachSource(sourceActor, threadAdapter);
        });
        threadAdapter.onPaused((reason) => {
            log.info(`Thread ${actorName} paused , reason: ${reason.type}`);
            this.sendStoppedEvent(threadAdapter, reason);
        });
        threadAdapter.onResumed(() => {
            log.info(`Thread ${actorName} resumed unexpectedly`);
            this.sendEvent(new vscode_debugadapter_1.ContinuedEvent(threadAdapter.id));
        });
        threadAdapter.onExited(() => {
            log.info(`Thread ${actorName} exited`);
            this.threads.unregister(threadAdapter.id);
            this.sendThreadExitedEvent(threadAdapter);
        });
    }
    attachSource(sourceActor, threadAdapter) {
        const source = sourceActor.source;
        let sourceAdapter = threadAdapter.findCorrespondingSourceAdapter(source);
        if (sourceAdapter !== undefined) {
            sourceAdapter.actor = sourceActor;
            this.sendNewSourceEvent(threadAdapter, sourceAdapter);
            return;
        }
        const sourcePath = this.pathMapper.convertFirefoxSourceToPath(source);
        sourceAdapter = threadAdapter.createSourceAdapter(sourceActor, sourcePath);
        this.sendNewSourceEvent(threadAdapter, sourceAdapter);
        let skipThisSource = undefined;
        if (sourcePath !== undefined) {
            skipThisSource = this.skipFilesManager.shouldSkipPath(sourcePath);
        }
        else if (source.generatedUrl && (!source.url || !pathMapper_1.urlDetector.test(source.url))) {
            skipThisSource = this.skipFilesManager.shouldSkipUrl(source.generatedUrl);
        }
        else if (source.url) {
            skipThisSource = this.skipFilesManager.shouldSkipUrl(source.url);
        }
        if (skipThisSource !== undefined) {
            if (source.isBlackBoxed !== skipThisSource) {
                sourceActor.setBlackbox(skipThisSource);
            }
        }
        this.breakpointsAdapter.setBreakpointsOnNewSource(sourceAdapter, threadAdapter);
    }
    attachConsole(consoleActor, threadAdapter) {
        consoleActor.onConsoleAPICall((consoleEvent) => {
            consoleActorLog.debug(`Console API: ${JSON.stringify(consoleEvent)}`);
            let category = (consoleEvent.level === 'error') ? 'stderr' :
                (consoleEvent.level === 'warn') ? 'console' : 'stdout';
            let outputEvent;
            if ((consoleEvent.arguments.length === 1) && (typeof consoleEvent.arguments[0] !== 'object')) {
                let msg = String(consoleEvent.arguments[0]);
                if (this.config.showConsoleCallLocation) {
                    let filename = this.pathMapper.convertFirefoxUrlToPath(consoleEvent.filename);
                    msg += ` (${filename}:${consoleEvent.lineNumber}:${consoleEvent.columnNumber})`;
                }
                outputEvent = new vscode_debugadapter_1.OutputEvent(msg + '\n', category);
            }
            else {
                let args = consoleEvent.arguments.map((grip, index) => index_2.VariableAdapter.fromGrip(String(index), undefined, undefined, grip, true, threadAdapter));
                if (this.config.showConsoleCallLocation) {
                    let filename = this.pathMapper.convertFirefoxUrlToPath(consoleEvent.filename);
                    let locationVar = new index_2.VariableAdapter('location', undefined, undefined, `(${filename}:${consoleEvent.lineNumber}:${consoleEvent.columnNumber})`, threadAdapter);
                    args.push(locationVar);
                }
                let argsAdapter = new index_2.ConsoleAPICallAdapter(args, threadAdapter);
                outputEvent = new vscode_debugadapter_1.OutputEvent('', category);
                outputEvent.body.variablesReference = argsAdapter.variablesProviderId;
            }
            this.addLocation(outputEvent, consoleEvent.filename, consoleEvent.lineNumber, consoleEvent.columnNumber);
            this.sendEvent(outputEvent);
        });
        consoleActor.onPageErrorCall((err) => {
            consoleActorLog.debug(`Page Error: ${JSON.stringify(err)}`);
            if (err.category === 'content javascript') {
                let category = err.exception ? 'stderr' : 'stdout';
                let outputEvent = new vscode_debugadapter_1.OutputEvent(err.errorMessage + '\n', category);
                this.addLocation(outputEvent, err.sourceName, err.lineNumber, err.columnNumber);
                this.sendEvent(outputEvent);
            }
        });
        consoleActor.startListeners();
        consoleActor.getCachedMessages();
    }
    addLocation(outputEvent, url, line, column) {
        let sourceAdapter = this.findSourceAdapter(url);
        if (sourceAdapter) {
            outputEvent.body.source = sourceAdapter.source;
            outputEvent.body.line = line;
            outputEvent.body.column = column;
        }
    }
    sendStoppedEvent(threadAdapter, reason) {
        let pauseType = reason ? reason.type : 'interrupt';
        let stoppedEvent = new vscode_debugadapter_1.StoppedEvent(pauseType, threadAdapter.id);
        stoppedEvent.body.allThreadsStopped = false;
        if (reason && reason.exception) {
            if (typeof reason.exception === 'string') {
                stoppedEvent.body.text = reason.exception;
            }
            else if ((typeof reason.exception === 'object') && (reason.exception.type === 'object')) {
                let exceptionGrip = reason.exception;
                if (exceptionGrip.preview && (exceptionGrip.preview.kind === 'Error')) {
                    stoppedEvent.body.text = `${exceptionGrip.class}: ${exceptionGrip.preview.message}`;
                }
                else {
                    stoppedEvent.body.text = exceptionGrip.class;
                }
            }
        }
        this.sendEvent(stoppedEvent);
    }
    findSourceAdapter(url, tryWithoutQueryString = false) {
        for (let [, thread] of this.threads) {
            let sources = thread.findSourceAdaptersForPathOrUrl(url);
            if (sources.length > 0) {
                return sources[0];
            }
        }
        if (tryWithoutQueryString && (url.indexOf('?') < 0)) {
            for (let [, thread] of this.threads) {
                let sources = thread.findSourceAdaptersForUrlWithoutQuery(url);
                if (sources.length > 0) {
                    return sources[0];
                }
            }
        }
        return undefined;
    }
    sendThreadStartedEvent(threadAdapter) {
        this.sendEvent(new vscode_debugadapter_1.ThreadEvent('started', threadAdapter.id));
        this.sendEvent(new vscode_debugadapter_1.Event('threadStarted', {
            name: threadAdapter.name,
            id: threadAdapter.id
        }));
    }
    sendThreadExitedEvent(threadAdapter) {
        this.sendEvent(new vscode_debugadapter_1.ThreadEvent('exited', threadAdapter.id));
        this.sendEvent(new vscode_debugadapter_1.Event('threadExited', {
            id: threadAdapter.id
        }));
    }
    sendNewSourceEvent(threadAdapter, sourceAdapter) {
        const sourceUrl = sourceAdapter.actor.url;
        if (sourceUrl && !sourceUrl.startsWith('javascript:')) {
            this.sendEvent(new vscode_debugadapter_1.Event('newSource', {
                threadId: threadAdapter.id,
                sourceId: sourceAdapter.id,
                url: sourceUrl,
                path: sourceAdapter.sourcePath
            }));
        }
    }
}
exports.FirefoxDebugSession = FirefoxDebugSession;
//# sourceMappingURL=firefoxDebugSession.js.map