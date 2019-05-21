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
const path = require("path");
const vscode = require("vscode");
const vsls = require("vsls/vscode");
const session_1 = require("./session");
const imagesDir = path.resolve(__dirname, '../images');
/** Item context values for tree items provided by this extension. */
var AudioItem;
(function (AudioItem) {
    AudioItem["Disconnected"] = "audio.disconnected";
    AudioItem["StartOrJoin"] = "audio.startOrJoin";
    AudioItem["Connecting"] = "audio.connecting";
    AudioItem["ParticipantsList"] = "audio.participants";
    AudioItem["Participant"] = "audio.participant";
    AudioItem["ParticipantMuted"] = "audio.participant.muted";
    AudioItem["Self"] = "audio.self";
    AudioItem["SelfMuted"] = "audio.self.muted";
})(AudioItem || (AudioItem = {}));
class TreeItem extends vscode.TreeItem {
    constructor(itemType, label, iconPath, command) {
        super(label, itemType === AudioItem.Disconnected || itemType === AudioItem.ParticipantsList ?
            vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
        this.contextValue = itemType;
        this.iconPath = iconPath;
        this.command = command;
    }
}
/**
 * Extends the VSLS session tree view with audio call information and commands.
 */
class SessionTreeDataProvider {
    constructor(liveShare, callingService) {
        this.liveShare = liveShare;
        this.callingService = callingService;
        this.isCallAvailable = false;
        this.changeEventEmitter = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.changeEventEmitter.event;
        this.providerRegistrations = [
            liveShare.registerTreeDataProvider(vsls.View.Session, this),
            liveShare.registerTreeDataProvider(vsls.View.ExplorerSession, this),
        ];
        this.participantsListItem = new TreeItem(AudioItem.ParticipantsList, 'Participants (0)');
        this.participantItems = new Map();
        this.selfItem = new TreeItem(AudioItem.Self, '');
        vscode.commands.registerCommand('liveshare.audio.muteSelf', () => this.callingService.mute());
        vscode.commands.registerCommand('liveshare.audio.unmuteSelf', () => this.callingService.unmute());
        // These commands currently don't work; the Skype muteParticipants() API call has no effect
        // because all participants in the call are anonymous, therefore they don't have the ability
        // to mute others.
        // TODO: Solve this by sending a Live Share message to the participant extension to remotely
        // trigger a local mute/unmute.
        /*
        vscode.commands.registerCommand(
            'liveshare.audio.muteParticipant', (e: TreeItem) => this.muteParticipant(e));
        vscode.commands.registerCommand(
            'liveshare.audio.unmuteParticipant', (e: TreeItem) => this.unmuteParticipant(e));
        */
        session_1.SessionContext.addListener(session_1.SessionEvents.StateChanged, (newState) => this.onSessionStateChanged(newState));
        this.callingService.onNewAudioCallAvailable(() => {
            this.isCallAvailable = true;
            this.changeEventEmitter.fire();
        });
        this.callingService.onMuteChanged((participant) => this.onMuteChanged(participant));
        this.callingService.onParticipantsChanged(() => this.changeEventEmitter.fire(this.participantsListItem));
        this.callingService.onParticipantChanged((participant) => this.onParticipantChanged(participant));
    }
    /** Called by VS Code to get a tree item for a model element. */
    getTreeItem(element) {
        // Data model elements are already tree items, so no conversion is necessary.
        return element;
    }
    /** Called by VS Code to get root element(s) of the tree model or children of a model element. */
    getChildren(element) {
        return element ? this.getChildElements(element) : this.getRootElements();
    }
    getRootElements() {
        switch (this.sessionState) {
            case session_1.SessionState.LiveShareWithoutAudio:
            case session_1.SessionState.AudioConnecting:
                return [
                    new TreeItem(AudioItem.Disconnected, 'Audio Call'),
                ];
            case session_1.SessionState.LiveShareWithAudio:
                const participantCount = 1 + this.callingService.currentParticipants().length;
                this.participantsListItem.label = `Audio Call Participants (${participantCount})`;
                return [
                    this.participantsListItem,
                ];
            default:
                return [];
        }
    }
    getChildElements(element) {
        switch (element.contextValue) {
            case AudioItem.Disconnected:
                switch (this.sessionState) {
                    case session_1.SessionState.LiveShareWithoutAudio:
                        const label = this.isCallAvailable ? 'Join audio call...' : 'Start audio call...';
                        return [
                            new TreeItem(AudioItem.StartOrJoin, label, undefined, {
                                title: label,
                                command: 'liveshare.audio.startOrJoinAudio',
                            }),
                        ];
                    case session_1.SessionState.AudioConnecting:
                        const label2 = this.isCallAvailable ? 'Joining audio call...' : 'Starting audio call...';
                        return [
                            new TreeItem(AudioItem.Connecting, label2, this.getIcon('loading')),
                        ];
                    default:
                        return [];
                }
            case AudioItem.ParticipantsList:
                return this.getCallParticipants();
            default:
                return [];
        }
    }
    getIcon(name) {
        return {
            dark: path.join(imagesDir, 'dark', name + '.svg'),
            light: path.join(imagesDir, 'light', name + '.svg'),
        };
    }
    getCallParticipants() {
        const participantIds = [];
        for (let participant of this.callingService.currentParticipants()) {
            this.createOrUpdateTreeItemForParticipant(participant);
            participantIds.push(participant.id);
        }
        for (let participantId of Array.from(this.participantItems.keys())) {
            if (participantIds.indexOf(participantId) < 0) {
                this.participantItems.delete(participantId);
            }
        }
        return [this.selfItem].concat(Array.from(this.participantItems.values()));
    }
    onParticipantChanged(participant) {
        this.changeEventEmitter.fire(this.createOrUpdateTreeItemForParticipant(participant));
    }
    createOrUpdateTreeItemForParticipant(participant) {
        const isMuted = participant.isServerMuted;
        const isSpeaking = !isMuted && participant.voiceLevel > 0;
        const contextValue = isMuted ? AudioItem.ParticipantMuted : AudioItem.Participant;
        const iconPath = this.getIcon(isMuted ? 'speaker-mute' : isSpeaking ? 'speaker-sound' : 'speaker');
        let participantItem = this.participantItems.get(participant.id);
        if (!participantItem) {
            participantItem = new TreeItem(contextValue, participant.displayName, iconPath);
            participantItem.id = participant.id;
            this.participantItems.set(participant.id, participantItem);
        }
        else {
            participantItem.label = participant.displayName;
            participantItem.contextValue = contextValue;
            participantItem.iconPath = iconPath;
        }
        return participantItem;
    }
    onSessionStateChanged(newState) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sessionState = newState;
            if (newState === session_1.SessionState.LiveShareWithAudio) {
                this.updateTreeItemForSelf();
            }
            this.changeEventEmitter.fire();
        });
    }
    onMuteChanged(participant) {
        return __awaiter(this, void 0, void 0, function* () {
            if (participant) {
                let participantItem = this.participantItems.get(participant.id);
                if (participantItem) {
                    this.changeEventEmitter.fire(participantItem);
                }
            }
            else {
                this.updateTreeItemForSelf();
                this.changeEventEmitter.fire(this.selfItem);
            }
        });
    }
    updateTreeItemForSelf() {
        let displayName = null;
        if (this.liveShare.session && this.liveShare.session.user) {
            displayName = this.liveShare.session.user.displayName ||
                this.liveShare.session.user.userName ||
                this.liveShare.session.user.emailAddress;
        }
        displayName = displayName || 'Unknown user';
        const isMuted = this.callingService.isMuted();
        this.selfItem.label = `${displayName} (you)`;
        this.selfItem.contextValue = isMuted ? AudioItem.SelfMuted : AudioItem.Self;
        this.selfItem.iconPath = this.getIcon(isMuted ? 'speaker-mute' : 'speaker');
    }
    muteParticipant(element) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!element) {
                // The command was invoked via the command palette, so there is no participant element.
                return;
            }
            const participant = this.callingService.currentParticipants().find(p => p.id === element.id);
            if (!participant)
                return;
            yield this.callingService.mute(participant);
            element.contextValue = AudioItem.ParticipantMuted;
            element.iconPath = this.getIcon('speaker-mute');
            this.changeEventEmitter.fire(element);
        });
    }
    unmuteParticipant(element) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!element) {
                // The command was invoked via the command palette, so there is no participant element.
                return;
            }
            const participant = this.callingService.currentParticipants().find(p => p.id === element.id);
            if (!participant)
                return;
            yield this.callingService.unmute(participant);
            element.contextValue = AudioItem.Participant;
            element.iconPath = this.getIcon('speaker');
            this.changeEventEmitter.fire(element);
        });
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            while (this.providerRegistrations.length > 0) {
                const providerRegistration = this.providerRegistrations.pop();
                yield providerRegistration.dispose();
            }
        });
    }
}
exports.SessionTreeDataProvider = SessionTreeDataProvider;
//# sourceMappingURL=sessionTreeDataProvider.js.map