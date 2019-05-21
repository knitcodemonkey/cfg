"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vsls = require("vsls/vscode");
const callingService_1 = require("./calling/callingService");
const statusbar_1 = require("./statusbar");
const extensionutil_1 = require("./extensionutil");
const session_1 = require("./session");
const traceSource_1 = require("./tracing/traceSource");
const telemetry_1 = require("./telemetry/telemetry");
const telemetryStrings_1 = require("./telemetry/telemetryStrings");
const sessionTreeDataProvider_1 = require("./sessionTreeDataProvider");
const globalStateNewInstall = 'isNewInstall';
const joinAudioPromptJoin = 'Join';
const joinAudioPromptAlwaysJoin = 'Always join';
const startAudioPromptStartCall = 'Start call';
const startAudioPromptAlwaysStartCall = 'Always start call';
class App {
    constructor(extensionContext, liveShare) {
        this.extensionContext = extensionContext;
        this.liveShare = liveShare;
        this.trace = traceSource_1.defaultTraceSource;
        telemetry_1.Telemetry.addContextProperty(telemetryStrings_1.TelemetryPropertyNames.ROLE, vsls.Role[vsls.Role.None]);
        this.callingService = new callingService_1.CallingService(liveShare, true);
        this.callingService.onNewAudioCallAvailable(() => this.onNewAudioCallAvailable());
        this.registerCommands();
        this.statusBarController = new statusbar_1.StatusBarController(liveShare, this.callingService);
        this.extensionContext.subscriptions.push(this.liveShare.onDidChangeSession(this.liveShareSessionChanged.bind(this)));
        if (liveShare.registerTreeDataProvider) {
            this.treeDataProvider = new sessionTreeDataProvider_1.SessionTreeDataProvider(liveShare, this.callingService);
            this.extensionContext.subscriptions.push(this.treeDataProvider);
        }
        session_1.SessionContext.transition(session_1.SessionAction.InitializeDone);
    }
    get CurrentlyTrackedSession() {
        return this.currentlyTrackedSession;
    }
    onNewAudioCallAvailable() {
        if (!this.callingService.getCurrentCall()) {
            this.promptToJoinCall();
        }
    }
    buildDeviceList(deviceType, deviceTypeFriendlyName) {
        return __awaiter(this, void 0, void 0, function* () {
            let allDevices = yield this.callingService.enumerateDevices();
            let currentlySelectedDevices = yield this.callingService.getCurrentDevices();
            let quickPick = allDevices
                .filter((device) => device.kind === deviceType)
                .map((device) => {
                return {
                    command: `liveshare.audio.selectDevice.${deviceTypeFriendlyName}`,
                    commandArg: device.id,
                    label: `${this.isSelectedDevice(device, currentlySelectedDevices) ? '$(check)' : '   '} ${device.label}`,
                    enabled: () => true
                };
            });
            return quickPick;
        });
    }
    isSelectedDevice(device, currentlySelectedDevices) {
        if (!device)
            return false;
        switch (device.kind) {
            case 1 /* Camera */:
                return currentlySelectedDevices.camera && device.id === currentlySelectedDevices.camera;
            case 2 /* Microphone */:
                return currentlySelectedDevices.microphone && device.id === currentlySelectedDevices.microphone;
            case 3 /* Speaker */:
                return currentlySelectedDevices.speaker && device.id === currentlySelectedDevices.speaker;
            default:
                return false;
        }
    }
    showEnabledQuickPick(items, options) {
        return vscode.window.showQuickPick(items.filter(item => item.enabled()), options);
    }
    registerCommands() {
        this.extensionContext.subscriptions.push(extensionutil_1.ExtensionUtil.registerCommand('liveshare.audio.startOrJoinAudio', () => this.commandStartOrJoinAudio()));
        this.extensionContext.subscriptions.push(extensionutil_1.ExtensionUtil.registerCommand('liveshare.audio.leaveAudio', () => this.commandLeaveAudio()));
        this.extensionContext.subscriptions.push(extensionutil_1.ExtensionUtil.registerCommand('liveshare.audio.muteUnmute', () => this.commandMuteUnmute()));
        this.extensionContext.subscriptions.push(extensionutil_1.ExtensionUtil.registerCommand('liveshare.audio.selectMicrophone', () => this.commandShowMicrophoneOptions()));
        this.extensionContext.subscriptions.push(extensionutil_1.ExtensionUtil.registerCommand('liveshare.audio.selectSpeakers', () => this.commandShowSpeakerOptions()));
        this.extensionContext.subscriptions.push(extensionutil_1.ExtensionUtil.registerCommand('liveshare.audio.selectDevice.speaker', (deviceId) => this.commandSelectDevice(deviceId, 3 /* Speaker */)));
        this.extensionContext.subscriptions.push(extensionutil_1.ExtensionUtil.registerCommand('liveshare.audio.selectDevice.microphone', (deviceId) => this.commandSelectDevice(deviceId, 2 /* Microphone */)));
        this.extensionContext.subscriptions.push(extensionutil_1.ExtensionUtil.registerCommand('liveshare.audio.viewRoster', () => this.commandViewRoster()));
        this.extensionContext.subscriptions.push(this.liveShare.registerCommand('liveshare.audio.startOrJoinAudio', () => session_1.SessionContext.State === session_1.SessionState.LiveShareWithoutAudio));
        this.extensionContext.subscriptions.push(this.liveShare.registerCommand('liveshare.audio', () => session_1.SessionContext.State === session_1.SessionState.LiveShareWithAudio));
    }
    liveShareSessionChanged(e) {
        return __awaiter(this, void 0, void 0, function* () {
            this.trace.info('LiveShare session changed:' + JSON.stringify(e));
            telemetry_1.Telemetry.addContextProperty(telemetryStrings_1.TelemetryPropertyNames.ROLE, vsls.Role[e.session.role]);
            if (e.session.user) {
                telemetry_1.Telemetry.setUserInfo(e.session.user);
            }
            if (e.session.id !== this.currentlyTrackedSession) {
                if (!e.session.id) {
                    //session was destroyed
                    session_1.SessionContext.transition(session_1.SessionAction.LiveShareSessionEnded);
                    yield this.callingService.handleLiveShareSessionEnded();
                    return;
                }
                // new session was connected. ensure we're not yet connected to the other audio session, and prompt for adding audio
                this.currentlyTrackedSession = e.session.id;
                yield this.callingService.endAndCleanUpCurrentCall();
                session_1.SessionContext.transition(session_1.SessionAction.LiveShareSessionStarted);
                //for guests joining, check if there's already a call available
                //the notification service for guests is pre-initialized
                if (e.session.role === vsls.Role.Guest) {
                    this.callingService.checkIfCallIsAvailable();
                }
                else if (e.session.role === vsls.Role.Host) {
                    this.promptToStartCall();
                }
            }
        });
    }
    promptToJoinCall() {
        return __awaiter(this, void 0, void 0, function* () {
            const audioConfiguration = vscode.workspace.getConfiguration('liveshare.audio');
            const joinCallBehaviorSetting = audioConfiguration.get('joinCallBehavior');
            if (joinCallBehaviorSetting === 'accept') {
                yield this.commandStartOrJoinAudio();
                return;
            }
            const selectedValue = yield vscode.window.showInformationMessage('An audio call has been started for this collaboration session.', joinAudioPromptJoin, joinAudioPromptAlwaysJoin);
            switch (selectedValue) {
                case joinAudioPromptAlwaysJoin:
                    yield audioConfiguration.update('joinCallBehavior', 'accept', vscode.ConfigurationTarget.Global);
                    yield this.commandStartOrJoinAudio();
                    break;
                case joinAudioPromptJoin:
                    yield this.commandStartOrJoinAudio();
                    break;
                default:
            }
            telemetry_1.Telemetry.sendTelemetryEvent(telemetryStrings_1.TelemetryEventNames.JOIN_PROMPT_DISPLAYED, { [telemetryStrings_1.TelemetryPropertyNames.SELECTED_ACTION]: selectedValue });
        });
    }
    promptToStartCall() {
        return __awaiter(this, void 0, void 0, function* () {
            const audioConfiguration = vscode.workspace.getConfiguration('liveshare.audio');
            const startCallOnShare = audioConfiguration.get('startCallOnShare');
            if (startCallOnShare) {
                yield this.commandStartOrJoinAudio();
                return;
            }
            const isNewInstall = this.extensionContext.globalState.get(globalStateNewInstall, true);
            if (isNewInstall) {
                yield this.extensionContext.globalState.update(globalStateNewInstall, false);
                const response = yield vscode.window.showInformationMessage('You can now start audio calls as part of your collaboration sessions, without needing to install any other tools.', startAudioPromptStartCall, startAudioPromptAlwaysStartCall);
                if (response) {
                    yield this.commandStartOrJoinAudio();
                    if (response === startAudioPromptAlwaysStartCall) {
                        yield audioConfiguration.update('startCallOnShare', true, vscode.ConfigurationTarget.Global);
                    }
                }
                telemetry_1.Telemetry.sendTelemetryEvent(telemetryStrings_1.TelemetryEventNames.START_PROMPT_DISPLAYED, { [telemetryStrings_1.TelemetryPropertyNames.SELECTED_ACTION]: response });
            }
        });
    }
    commandStartOrJoinAudio() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.liveShare.session) {
                vscode.window.showInformationMessage('No Live Share session in progress');
                return;
            }
            const connectEvent = telemetry_1.Telemetry.startTimedEvent(telemetryStrings_1.TelemetryEventNames.CONNECT_CALL);
            try {
                session_1.SessionContext.transition(session_1.SessionAction.AttemptConnectAudio);
                yield extensionutil_1.ExtensionUtil.runWithProgress(() => __awaiter(this, void 0, void 0, function* () { return yield this.callingService.connectToCall(this.liveShare.session.id); }), 'Connecting audio...');
                session_1.SessionContext.transition(session_1.SessionAction.AudioConnected);
            }
            catch (e) {
                this.trace.error(`startOrJoinAudio: Caught error while trying to connect to audio: ${e.message} ${e.stack}`);
                session_1.SessionContext.transition(session_1.SessionAction.AudioConnectionFailed);
                connectEvent.end(telemetry_1.TelemetryResult.Failure, e.message);
                throw e;
            }
            connectEvent.end(telemetry_1.TelemetryResult.Success);
        });
    }
    commandLeaveAudio() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.callingService.endAndCleanUpCurrentCall();
                session_1.SessionContext.transition(session_1.SessionAction.AudioDisconnected);
            }
            catch (e) {
                this.trace.error(`leaveAudio: Caught error: ${e.message} ${e.stack}`);
                session_1.SessionContext.transition(session_1.SessionAction.AudioConnectionFailed);
                throw e;
            }
        });
    }
    commandMuteUnmute() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.callingService.isMuted()) {
                    yield this.callingService.unmute();
                }
                else {
                    yield this.callingService.mute();
                }
            }
            catch (e) {
                this.trace.error(`muteUnmute: Caught error: ${e.message} ${e.stack}`);
                throw e;
            }
        });
    }
    commandShowMicrophoneOptions() {
        return __awaiter(this, void 0, void 0, function* () {
            let microphoneOptions = yield this.buildDeviceList(2 /* Microphone */, 'microphone');
            return this.showEnabledQuickPick(microphoneOptions, { placeHolder: 'Select the microphone to use' })
                .then(pick => pick && vscode.commands.executeCommand(pick.command, pick.commandArg));
        });
    }
    commandShowSpeakerOptions() {
        return __awaiter(this, void 0, void 0, function* () {
            let speakerOptions = yield this.buildDeviceList(3 /* Speaker */, 'speaker');
            return this.showEnabledQuickPick(speakerOptions, { placeHolder: 'Select the speaker to use' })
                .then(pick => pick && vscode.commands.executeCommand(pick.command, pick.commandArg));
        });
    }
    commandViewRoster() {
        return __awaiter(this, void 0, void 0, function* () {
            let participants = this.callingService.currentParticipants().map((participant) => {
                return {
                    label: '',
                    description: participant.displayName,
                };
            });
            return vscode.window.showQuickPick(participants, { placeHolder: 'Audio Call Participants' });
        });
    }
    commandSelectDevice(deviceId, deviceType) {
        return __awaiter(this, void 0, void 0, function* () {
            this.callingService.selectDevice(deviceId, deviceType);
        });
    }
    dispose() {
        if (this.callingService) {
            this.callingService.dispose();
            this.callingService = null;
        }
    }
}
exports.App = App;
//# sourceMappingURL=app.js.map