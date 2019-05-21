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
const extensionutil_1 = require("./extensionutil");
const session_1 = require("./session");
const traceSource_1 = require("./tracing/traceSource");
class StatusBarController {
    constructor(liveShare, callingService) {
        this.liveShare = liveShare;
        this.callingService = callingService;
        this.updateStatusBarPromise = Promise.resolve();
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);
        this.statusBarItem.hide();
        this.audioConnectedStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);
        this.audioConnectedStatusBarItem.hide();
        this.dominantSpeakerStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);
        this.dominantSpeakerStatusBarItem.hide();
        this.updateStatusBar(new InitialState());
        session_1.SessionContext.addListener(session_1.SessionEvents.StateChanged, (newState, previousState) => __awaiter(this, void 0, void 0, function* () {
            return yield this.onSessionStateChanged(newState);
        }));
        this.callingService.onMuteChanged(() => this.onMuteChanged());
    }
    onMuteChanged() {
        this.audioConnectedStatusBarItem.text = this.callingService.isMuted() ? '$(mute)' : '$(unmute)';
    }
    updateStatusBar(newState) {
        return __awaiter(this, void 0, void 0, function* () {
            const previousState = this.currentState;
            this.currentState = newState;
            if (previousState) {
                previousState.dispose();
            }
            //await newState.updateStatusBarItem(this.statusBarItem);
            //await newState.updateDominantSpeakerStatusBarItem(this.dominantSpeakerStatusBarItem);
            yield newState.updateAudioConnectedStatusBarItem(this.audioConnectedStatusBarItem);
        });
    }
    onSessionStateChanged(newState) {
        return __awaiter(this, void 0, void 0, function* () {
            let newStatusBarState = this.getStatusBarState(newState);
            this.updateStatusBarPromise = this.updateStatusBarPromise.then(() => __awaiter(this, void 0, void 0, function* () {
                yield this.updateStatusBar(newStatusBarState);
                yield vscode.commands.executeCommand('setContext', 'liveshare.audio:state', newState.toString());
            }));
        });
    }
    getStatusBarState(state) {
        switch (state) {
            case session_1.SessionState.Initializing:
                return new InitialState();
            case session_1.SessionState.NoLiveShare:
                return new NoLiveShareState(this.liveShare);
            case session_1.SessionState.LiveShareWithoutAudio:
                return new LiveShareWithoutAudioState(this.liveShare);
            case session_1.SessionState.AudioConnecting:
                return new AudioConnectingState();
            case session_1.SessionState.LiveShareWithAudio:
                return new LiveShareWithAudioState(this.callingService);
            default: {
                traceSource_1.defaultTraceSource.warning(`No status bar defined for state ${state}`);
                return new NoLiveShareState(this.liveShare);
            }
        }
    }
}
exports.StatusBarController = StatusBarController;
/**
 * Base class for the status bar states.
 */
class StatusBarState {
    constructor() {
        this.disposed = false;
    }
    updateStatusBarItem(item) {
        this.hideItem(item);
    }
    updateDominantSpeakerStatusBarItem(item) {
        this.hideItem(item);
    }
    updateAudioConnectedStatusBarItem(item) {
        this.hideItem(item);
    }
    hideItem(item) {
        item.hide();
        item.text = undefined;
        item.command = undefined;
        item.tooltip = undefined;
    }
    /**
     * Conditionally shows quick pick items based on whether they are enabled or not.
     */
    showQuickPick(items, options) {
        return vscode.window.showQuickPick(items.filter(item => item.enabled()), options);
    }
    dispose() {
        this.disposed = true;
    }
}
exports.StatusBarState = StatusBarState;
/**
 * Defines the status bar behavior when VSCode is started. Nothing is shown in the status bar.
 * This is just the initial state, we transition to a different state as soon as extension activation is completed.
 */
class InitialState extends StatusBarState {
    updateStatusBarItem(statusBarItem) {
        return __awaiter(this, void 0, void 0, function* () {
            this.hideItem(statusBarItem);
        });
    }
}
exports.InitialState = InitialState;
/**
 * Defines the status bar behavior when there is Live Share in progress, but no Audio
 */
class LiveShareWithoutAudioState extends StatusBarState {
    constructor(liveShare) {
        super();
        this.liveShare = liveShare;
        this.disconnectedQuickPickItems = [
            {
                label: '$(plug) Connect/Start Audio Call',
                description: '',
                detail: 'Start an audio call or connect to an existing one.',
                command: 'liveshare.audio.startOrJoinAudio',
                enabled: () => !!(this.liveShare.session && this.liveShare.session.id)
            }
        ];
    }
    updateStatusBarItem(statusBarItem) {
        return __awaiter(this, void 0, void 0, function* () {
            const commandId = '_liveShareAudio.disconnectedShowOptions';
            yield extensionutil_1.ExtensionUtil.tryRegisterCommand(commandId, () => {
                return this.showQuickPick(this.disconnectedQuickPickItems, { placeHolder: 'What would you like to do?' })
                    .then(pick => pick && vscode.commands.executeCommand(pick.command, pick.commandArg));
            });
            statusBarItem.text = !(this.liveShare.session && this.liveShare.session.id) ? '$(link-external) Share + Audio' : '$(link-external) Audio';
            statusBarItem.command = commandId;
            statusBarItem.show();
        });
    }
}
exports.LiveShareWithoutAudioState = LiveShareWithoutAudioState;
/**
 * Defines the status bar behavior when there is no Live Share in progress
 */
class NoLiveShareState extends StatusBarState {
    constructor(liveShare) {
        super();
        this.liveShare = liveShare;
    }
    updateStatusBarItem(statusBarItem) {
        return __awaiter(this, void 0, void 0, function* () {
            statusBarItem.hide();
        });
    }
}
exports.NoLiveShareState = NoLiveShareState;
class AudioConnectingState extends StatusBarState {
    updateStatusBarItem(statusBarItem) {
        return __awaiter(this, void 0, void 0, function* () {
            this.hideItem(statusBarItem);
        });
    }
}
exports.AudioConnectingState = AudioConnectingState;
class LiveShareWithAudioState extends StatusBarState {
    constructor(callingService) {
        super();
        this.callingService = callingService;
        this.connectedQuickPickItems = () => {
            let isMuted = this.callingService.isMuted();
            return [
                {
                    label: '$(x) Disconnect',
                    description: '',
                    detail: 'Disconnect from the audio call.',
                    command: 'liveshare.audio.leaveAudio',
                    enabled: () => true
                },
                {
                    label: isMuted ? '$(unmute) Unmute Yourself' : '$(mute) Mute Yourself',
                    description: '',
                    detail: isMuted ? 'Unmute your microphone so others can hear you.' : 'Mute yourself so others cannot hear you.',
                    command: 'liveshare.audio.muteUnmute',
                    enabled: () => true
                },
                {
                    label: '$(organization) View Participants',
                    description: '',
                    detail: 'View the list of Live Share participants that are currently in the call.',
                    command: 'liveshare.audio.viewRoster',
                    enabled: () => true
                },
                {
                    label: '$(unmute) Configure Speakers',
                    description: '',
                    detail: 'Select which speakers to use for the audio call.',
                    command: 'liveshare.audio.selectSpeakers',
                    enabled: () => true
                },
                {
                    label: '$(megaphone) Configure Microphone',
                    description: '',
                    detail: 'Select which microphone to use for the audio call.',
                    command: 'liveshare.audio.selectMicrophone',
                    enabled: () => true
                },
            ];
        };
    }
    updateAudioConnectedStatusBarItem(statusBarItem) {
        return __awaiter(this, void 0, void 0, function* () {
            const commandId = 'liveshare.audio';
            yield extensionutil_1.ExtensionUtil.tryRegisterCommand(commandId, () => {
                return this.showQuickPick(this.connectedQuickPickItems(), { placeHolder: 'What would you like to do?' })
                    .then(pick => pick && vscode.commands.executeCommand(pick.command, pick.commandArg));
            });
            statusBarItem.text = this.callingService.isMuted() ? '$(mute)' : '$(unmute)';
            statusBarItem.command = commandId;
            statusBarItem.show();
        });
    }
    updateDominantSpeakerStatusBarItem(statusBarItem) {
        return __awaiter(this, void 0, void 0, function* () {
            statusBarItem.command = 'liveshare.audio.viewRoster';
            statusBarItem.text = '';
            statusBarItem.show();
            this.displayDominantSpeaker(statusBarItem);
        });
    }
    /* TODO: wire up some event from SlimCore  */
    displayDominantSpeaker(statusBarItem) {
        if (this.disposed)
            return;
        setTimeout(() => {
            if (this.disposed)
                return;
            if (statusBarItem) {
                let dominantSpeakers = this.callingService.dominantSpeakers();
                let dominatSpeaker = dominantSpeakers && dominantSpeakers[0];
                if (dominatSpeaker) {
                    statusBarItem.text = `🔊 ${dominatSpeaker.displayName} 🔊`;
                    statusBarItem.show();
                }
                else {
                    statusBarItem.text = '';
                    statusBarItem.hide();
                }
                this.displayDominantSpeaker(statusBarItem);
            }
        }, 700);
    }
}
exports.LiveShareWithAudioState = LiveShareWithAudioState;
//# sourceMappingURL=statusbar.js.map