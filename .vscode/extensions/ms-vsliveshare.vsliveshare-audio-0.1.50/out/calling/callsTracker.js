"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const callingEvents_1 = require("./callingEvents");
class CallsTracker {
    constructor(messagingService) {
        this.newCallEventEmitter = new vscode.EventEmitter();
        this.onNewAudioCallAvailable = this.newCallEventEmitter.event;
        this.onMessagingServiceEvent = (eventMessage) => {
            let callStartedMessage = eventMessage;
            if (callStartedMessage.callingEventType === callingEvents_1.CallingEventType.CallStarted
                && callStartedMessage.groupContext
                && callStartedMessage.callId) {
                if (!this.trackedCalls.has(callStartedMessage.callId)) {
                    this.trackedCalls.set(callStartedMessage.callId, true);
                    this.newCallEventEmitter.fire();
                }
            }
        };
        this.trackedCalls = new Map();
        this.messagingService = messagingService;
        this.messagingService.event(this.onMessagingServiceEvent);
    }
}
exports.CallsTracker = CallsTracker;
//# sourceMappingURL=callsTracker.js.map