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
const electronStackProvider = require("./electronStackProvider");
const _ = require("lodash");
const traceSource_1 = require("../tracing/traceSource");
const callingUtils_1 = require("./callingUtils");
const MessagingService_1 = require("../messaging/MessagingService");
const callingEvents_1 = require("./callingEvents");
const callsTracker_1 = require("./callsTracker");
class CallingService {
    constructor(liveShare, delayInitialization) {
        this.currentCallParticipants = {};
        this.newCallEventEmitter = new vscode.EventEmitter();
        this.onNewAudioCallAvailable = this.newCallEventEmitter.event;
        this.muteChangedEventEmitter = new vscode.EventEmitter();
        this.onMuteChanged = this.muteChangedEventEmitter.event;
        this.participantsChangedEventEmitter = new vscode.EventEmitter();
        this.onParticipantsChanged = this.participantsChangedEventEmitter.event;
        this.participantChangedEventEmitter = new vscode.EventEmitter();
        this.onParticipantChanged = this.participantChangedEventEmitter.event;
        this.onMessagingServiceEvent = (eventMessage) => {
            let callingEvent = eventMessage;
            if (callingEvent
                && callingEvent.callingEventType === callingEvents_1.CallingEventType.CallInformationRequest
                && this.currentCall
                && this.currentCall.state === 3 /* Connected */) {
                this.messagingService.fire({
                    callingEventType: callingEvents_1.CallingEventType.CallStarted,
                    groupContext: this.currentCall.threadId,
                    callId: this.currentCall.callId
                });
            }
        };
        this.trace = traceSource_1.defaultTraceSource.withName('CallingService');
        this.liveShare = liveShare;
        this.messagingService = new MessagingService_1.MessagingService(liveShare);
        this.messagingService.event(this.onMessagingServiceEvent);
        this.callsTracker = new callsTracker_1.CallsTracker(this.messagingService);
        this.callsTracker.onNewAudioCallAvailable(() => this.newCallEventEmitter.fire());
        if (!delayInitialization) {
            this.initialize();
        }
        else {
            this.trace.info('Calling stack will be lazy loaded');
        }
    }
    getVSLSToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentToken && new Date().getTime() < this.currentToken.expiresIn - (3600 * 1000)) {
                return this.currentToken;
            }
            this.currentToken = yield callingUtils_1.getVSLSTokenFromAuthService();
            return this.currentToken;
        });
    }
    initialize() {
        if (!this.initPromise) {
            this.initPromise = this.initializeCallingStack();
            this.initPromise.catch((e) => {
                this.trace.error(`'Failed to initialize calling stack ${e.message} ${e.stack}`);
            });
        }
        return this.initPromise;
    }
    initializeCallingStack() {
        return __awaiter(this, void 0, void 0, function* () {
            let callingStack = null;
            let displayName = null;
            if (this.liveShare.session && this.liveShare.session.user) {
                displayName = this.liveShare.session.user.displayName || this.liveShare.session.user.userName || this.liveShare.session.user.emailAddress;
            }
            displayName = displayName || 'Unknown user';
            this.trace.info('Getting SkypeToken');
            let skypeToken = yield this.getVSLSToken();
            this.trace.info('Initializing SlimCore');
            callingStack = yield electronStackProvider.build();
            if (!callingStack) {
                throw new Error('SlimCore load failed.');
            }
            this.callRegistry = callingStack.getCallRegistry();
            this.trace.info('Initializing call registry');
            yield this.callRegistry.init({
                displayName: displayName, id: skypeToken.skypeId, tokenProvider: () => {
                    return Promise.resolve(skypeToken.skypeToken);
                }
            });
            this.trace.info('Initializing device manager');
            this.deviceManager = callingStack.getDeviceManager();
            return new Promise((resolve, reject) => {
                setTimeout(() => resolve(), 1500);
            });
        });
    }
    getCurrentCall() {
        return this.currentCall;
    }
    checkIfCallIsAvailable() {
        this.trace.info('checkIfCallIsAvailable');
        this.messagingService.fire({
            callingEventType: callingEvents_1.CallingEventType.CallInformationRequest
        });
    }
    handleLiveShareSessionEnded() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.endAndCleanUpCurrentCall();
            }
            catch (e) {
                this.trace.error(`Failed to clean up call: ${e.message} ${e.stack}`);
            }
        });
    }
    connectToCall(groupContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentCall) {
                this.trace.warning('Already connected to a call');
                return this.endAndCleanUpCurrentCall().then(() => {
                    return Promise.reject(new Error('Already connected to a call. Ending current call. Retry audio join'));
                });
            }
            yield this.initialize();
            yield this.connectToCallInternal(groupContext);
        });
    }
    connectToCallInternal(groupContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentCall) {
                this.trace.warning('Already connected to a call');
                return this.endAndCleanUpCurrentCall().then(() => {
                    return Promise.reject(new Error('Already connected to a call. Ending current call. Please retry audio join'));
                });
            }
            try {
                let mriGroupContext = `99:${groupContext}`;
                this.trace.info(`Connecting to call with group context: ${mriGroupContext}`);
                let call = this.callRegistry.createCall(mriGroupContext);
                call.init({ threadId: mriGroupContext, mediaPeerType: 2 /* ConsumerMultiParty */ });
                call.on('participantAdded', () => {
                    _.forEach(call.participants, (participant) => {
                        if (!(participant.id in this.currentCallParticipants)) {
                            this.currentCallParticipants[participant.id] = participant;
                            this.participantsChangedEventEmitter.fire();
                            //this.notifyOfParticipantAdded(participant.displayName);
                        }
                    });
                });
                call.on('participantRemoved', () => {
                    let stillInCall = {};
                    _.forEach(call.participants, (participant) => {
                        stillInCall[participant.id] = participant;
                    });
                    let toRemove = [];
                    _.forEach(Object.keys(this.currentCallParticipants), (participantId) => {
                        if (!(participantId in stillInCall)) {
                            toRemove.push(this.currentCallParticipants[participantId]);
                        }
                    });
                    _.forEach(toRemove, (participant) => {
                        delete this.currentCallParticipants[participant.id];
                        this.participantsChangedEventEmitter.fire();
                        //this.notifyOfParticipantRemoved(participant.displayName);
                    });
                    toRemove = null;
                });
                call.on('callStateChanged', () => {
                    this.trace.info(`callStateChanged: ${call.state}`);
                    switch (call.state) {
                        case 3 /* Connected */:
                            {
                                this.messagingService.fire({
                                    callingEventType: callingEvents_1.CallingEventType.CallStarted,
                                    groupContext: call.threadId,
                                    callId: call.callId
                                });
                            }
                            break;
                        default:
                            return;
                    }
                });
                call.on('serverMutedChanged', (isServerMuted) => {
                    this.trace.info(`serverMutedChanged: ${isServerMuted}`);
                    this.muteChangedEventEmitter.fire(null);
                });
                call.on('participantUpdated', (participant) => {
                    this.participantChangedEventEmitter.fire(participant);
                });
                this.currentCall = call;
                yield call.start({ screenshareDirection: 0 /* Disabled */ });
            }
            catch (e) {
                this.trace.error(`Caught error while connecting to call: ${e.message}`);
                throw e;
            }
        });
    }
    notifyOfParticipantAdded(participantName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.window.showInformationMessage(`${participantName} joined the audio call`);
        });
    }
    notifyOfParticipantRemoved(participantName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.window.showInformationMessage(`${participantName} left the audio call`);
        });
    }
    mute(participant) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentCall)
                return;
            if (participant) {
                // Mute a participant.
                const mutedParticipants = _.filter(this.currentCallParticipants, p => p.isServerMuted);
                if (mutedParticipants.indexOf(participant) < 0) {
                    // Add the participant to the list of muted participants.
                    mutedParticipants.push(participant);
                }
                yield this.currentCall.muteParticipants(1 /* Specified */, mutedParticipants);
            }
            else {
                // Mute my own microphone.
                yield this.currentCall.mute();
                this.muteChangedEventEmitter.fire();
            }
        });
    }
    unmute(participant) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentCall)
                return;
            if (participant) {
                // Unmute a participant.
                const mutedParticipants = _.filter(this.currentCallParticipants, p => p.isServerMuted);
                const index = mutedParticipants.indexOf(participant);
                if (index >= 0) {
                    // Remove the participant from the list of muted participants.
                    mutedParticipants.splice(index, 1);
                }
                yield this.currentCall.muteParticipants(1 /* Specified */, mutedParticipants);
            }
            else {
                // Unmute my own microphone.
                yield this.currentCall.unmute();
                this.muteChangedEventEmitter.fire();
            }
        });
    }
    isMuted() {
        if (!this.currentCall)
            return true;
        return this.currentCall.isMuted || this.currentCall.isServerMuted;
    }
    enumerateDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.deviceManager.enumerateDevicesAsync();
        });
    }
    getCurrentDevices() {
        return this.deviceManager.getSelectedDevices();
    }
    selectDevice(deviceId, deviceType) {
        let selectedDevice = this.getCurrentDevices();
        switch (deviceType) {
            case 2 /* Microphone */:
                selectedDevice.microphone = deviceId;
                break;
            case 3 /* Speaker */:
                selectedDevice.speaker = deviceId;
                break;
            default:
                break;
        }
        this.deviceManager.selectDevices(selectedDevice);
    }
    endAndCleanUpCurrentCall() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentCall)
                return;
            try {
                yield this.currentCall.stop();
            }
            finally {
                this.currentCall = null;
                this.currentCallParticipants = {};
            }
        });
    }
    currentParticipants() {
        return this.currentCallParticipants ? _.values(this.currentCallParticipants) : [];
    }
    dominantSpeakers() {
        return _.map(this.currentCall.dominantSpeakerInfo.speakerList, (x) => {
            return this.currentCallParticipants[x];
        });
    }
    dispose() {
        electronStackProvider.dispose();
    }
}
exports.CallingService = CallingService;
//# sourceMappingURL=callingService.js.map