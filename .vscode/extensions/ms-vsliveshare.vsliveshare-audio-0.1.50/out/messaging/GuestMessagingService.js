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
const IMessagingService_1 = require("./IMessagingService");
const vscode_1 = require("vscode");
const IMessagingService_2 = require("./IMessagingService");
const traceSource_1 = require("../tracing/traceSource");
class GuestMessagingService extends vscode_1.EventEmitter {
    constructor(liveShare) {
        super();
        this.liveShare = liveShare;
        this.onNotificationReceived = (message) => {
            this.trace.info(`onNotificationReceived: ${JSON.stringify(message)}`);
            //notify subscribers about this message
            super.fire(message);
        };
        this.trace = traceSource_1.defaultTraceSource.withName('GuestMessagingService');
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.shareService = yield this.liveShare.getSharedService(IMessagingService_2.MessagingServiceName);
            this.shareService.onNotify(IMessagingService_1.MessagingServiceNotificationEventName, this.onNotificationReceived);
        });
    }
    fire(event) {
        if (!event) {
            this.trace.error(`Cannot emit a null event`);
            throw new Error('Cannot emit a null event');
        }
        if (!this.shareService || !this.shareService.isServiceAvailable) {
            this.trace.error(`SharedServiceProxy is not available`);
            return;
        }
        this.trace.info(`Notify: ${JSON.stringify(event)}`);
        this.shareService.notify(IMessagingService_1.MessagingServiceNotificationEventName, event);
    }
}
exports.GuestMessagingService = GuestMessagingService;
//# sourceMappingURL=GuestMessagingService.js.map