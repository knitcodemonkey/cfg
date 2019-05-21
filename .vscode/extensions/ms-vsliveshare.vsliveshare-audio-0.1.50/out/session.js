"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const traceSource_1 = require("./tracing/traceSource");
var SessionState;
(function (SessionState) {
    SessionState["AudioConnecting"] = "AudioConnecting";
    SessionState["Initializing"] = "Initializing";
    SessionState["LiveShareWithoutAudio"] = "LiveShareWithoutAudio";
    SessionState["LiveShareWithAudio"] = "LiveShareWithAudio";
    SessionState["NoLiveShare"] = "NoLiveShare";
})(SessionState = exports.SessionState || (exports.SessionState = {}));
var SessionAction;
(function (SessionAction) {
    SessionAction[SessionAction["InitializeDone"] = 0] = "InitializeDone";
    SessionAction[SessionAction["LiveShareSessionStarted"] = 1] = "LiveShareSessionStarted";
    SessionAction[SessionAction["LiveShareSessionEnded"] = 2] = "LiveShareSessionEnded";
    SessionAction[SessionAction["AttemptConnectAudio"] = 3] = "AttemptConnectAudio";
    SessionAction[SessionAction["AudioConnected"] = 4] = "AudioConnected";
    SessionAction[SessionAction["AudioDisconnected"] = 5] = "AudioDisconnected";
    SessionAction[SessionAction["AudioConnectionFailed"] = 6] = "AudioConnectionFailed";
})(SessionAction = exports.SessionAction || (exports.SessionAction = {}));
// Description of the transitions of a FSM for a session
// TODO: refactor as a statechart
exports.sessionMachine = {
    [SessionState.Initializing]: {
        [SessionAction.InitializeDone]: SessionState.NoLiveShare,
    },
    [SessionState.NoLiveShare]: {
        [SessionAction.LiveShareSessionStarted]: SessionState.LiveShareWithoutAudio
    },
    [SessionState.LiveShareWithoutAudio]: {
        [SessionAction.AttemptConnectAudio]: SessionState.AudioConnecting,
        [SessionAction.LiveShareSessionStarted]: SessionState.LiveShareWithoutAudio,
        [SessionAction.AudioConnected]: SessionState.LiveShareWithAudio,
        [SessionAction.LiveShareSessionEnded]: SessionState.NoLiveShare,
    },
    [SessionState.AudioConnecting]: {
        [SessionAction.AudioConnected]: SessionState.LiveShareWithAudio,
        [SessionAction.AudioConnectionFailed]: SessionState.LiveShareWithoutAudio,
        [SessionAction.LiveShareSessionEnded]: SessionState.NoLiveShare,
    },
    [SessionState.LiveShareWithAudio]: {
        [SessionAction.AudioDisconnected]: SessionState.LiveShareWithoutAudio,
        [SessionAction.LiveShareSessionEnded]: SessionState.NoLiveShare,
    }
};
var SessionEvents;
(function (SessionEvents) {
    SessionEvents["StateChanged"] = "StateChanged";
})(SessionEvents = exports.SessionEvents || (exports.SessionEvents = {}));
class SessionContext extends events_1.EventEmitter {
    constructor() {
        super();
        this.currentState = SessionState.Initializing; // initial state
    }
    static get Instance() {
        if (!SessionContext.singleton) {
            SessionContext.singleton = new SessionContext();
        }
        return SessionContext.singleton;
    }
    get State() {
        return SessionContext.Instance.currentState;
    }
    transition(action) {
        const currentStateConfig = exports.sessionMachine[this.State];
        traceSource_1.defaultTraceSource.verbose(`Current state: ${this.State}, Action: ${SessionAction[action]}`);
        if (currentStateConfig) {
            const nextState = currentStateConfig[action];
            if (nextState !== undefined) {
                // Transition to the determined next state
                SessionContext.Instance.setState(nextState);
                return SessionContext.Instance.State;
            }
            traceSource_1.defaultTraceSource.warning(`No transition exists for action: ${SessionAction[action]}`);
            // No transition exists for the given action
            return undefined;
        }
        traceSource_1.defaultTraceSource.warning(`No config for the given state exists in the machine: action ${SessionAction[action]}`);
        // No config for the given state exists in the machine
        return undefined;
    }
    setState(newState) {
        const previousState = SessionContext.Instance.currentState;
        if (previousState === newState)
            return;
        SessionContext.Instance.currentState = newState;
        SessionContext.Instance.emit(SessionEvents.StateChanged, newState, previousState);
    }
}
const sessionContextInstance = SessionContext.Instance;
exports.SessionContext = sessionContextInstance;
//# sourceMappingURL=session.js.map