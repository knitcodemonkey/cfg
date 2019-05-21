"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TelemetryEventNames {
}
TelemetryEventNames.FAULT_PREFIX = 'Fault/';
TelemetryEventNames.ACTIVATE_EXTENSION = 'activate-extension';
TelemetryEventNames.DEACTIVATE_EXTENSION = 'deactivate-extension';
TelemetryEventNames.ACTIVATE_EXTENSION_FAULT = TelemetryEventNames.FAULT_PREFIX + 'activate-extension-fault';
TelemetryEventNames.DEACTIVATE_EXTENSION_FAULT = TelemetryEventNames.FAULT_PREFIX + 'deactivate-extension-fault';
TelemetryEventNames.UNHANDLED_COMMAND_ERROR_FAULT = TelemetryEventNames.FAULT_PREFIX + 'unhandled-commanderror-fault';
TelemetryEventNames.UNHANDLED_REJECTION_FAULT = TelemetryEventNames.FAULT_PREFIX + 'unhandled-rejection-fault';
TelemetryEventNames.INVOKE_COMMAND = 'invoke-command';
TelemetryEventNames.CONNECT_CALL = 'connect-call';
TelemetryEventNames.JOIN_PROMPT_DISPLAYED = 'join-prompt-displayed';
TelemetryEventNames.START_PROMPT_DISPLAYED = 'start-prompt-displayed';
exports.TelemetryEventNames = TelemetryEventNames;
class TelemetryPropertyNames {
}
TelemetryPropertyNames.FEATURE_NAME = 'liveshare.';
TelemetryPropertyNames.CORRELATION_ID = TelemetryPropertyNames.FEATURE_NAME + 'CorrelationId';
TelemetryPropertyNames.IS_INTERNAL = TelemetryPropertyNames.FEATURE_NAME + 'IsInternal';
TelemetryPropertyNames.EVENT_RESULT = TelemetryPropertyNames.FEATURE_NAME + 'Result';
TelemetryPropertyNames.EVENT_DURATION = TelemetryPropertyNames.FEATURE_NAME + 'Duration';
TelemetryPropertyNames.EVENT_MESSAGE = TelemetryPropertyNames.FEATURE_NAME + 'Message';
TelemetryPropertyNames.EVENT_EXCEPTION_STACK = TelemetryPropertyNames.FEATURE_NAME + 'ExceptionStack';
TelemetryPropertyNames.FAULT_TYPE = TelemetryPropertyNames.FEATURE_NAME + 'FaultType';
TelemetryPropertyNames.INVOKED_COMMAND = TelemetryPropertyNames.FEATURE_NAME + 'InvokedCommand';
TelemetryPropertyNames.ROLE = TelemetryPropertyNames.FEATURE_NAME + 'Role';
TelemetryPropertyNames.SELECTED_ACTION = TelemetryPropertyNames.FEATURE_NAME + 'SelectedAction';
exports.TelemetryPropertyNames = TelemetryPropertyNames;
//# sourceMappingURL=telemetryStrings.js.map