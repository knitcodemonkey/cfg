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
const vscode_1 = require("vsls/vscode");
const vscode_2 = require("vscode");
const HostMessagingService_1 = require("./HostMessagingService");
const GuestMessagingService_1 = require("./GuestMessagingService");
const traceSource_1 = require("../tracing/traceSource");
class MessagingService extends vscode_2.EventEmitter {
    constructor(liveShare) {
        super();
        this.liveShare = liveShare;
        this.traceSource = traceSource_1.defaultTraceSource.withName('MessagingService');
        this.liveShare.onDidChangeSession((e) => this.liveShareSessionChanged(e));
        //we try to initialize the notification service, upfront, even if there's no LS session
        this.initPromise = this.getMessageService().then((s) => this.notificationService = s);
    }
    liveShareSessionChanged(e) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initPromise;
            }
            catch (e) {
                this.traceSource.error(`NotificationService initialization failed: ${e.Message}`);
            }
            /**
             * We pre-initialize the notifications service, and create a GuestNotification service.
             * If LS seession changes and the role is Host, or no notification service was pre-initialized,
             * try and create notification service/
             */
            if (e.session.role === vscode_1.Role.Host || !this.notificationService) {
                if (this.notificationService) {
                    this.notificationService.dispose();
                    this.notificationService = null;
                }
                this.notificationService = yield this.getMessageService();
            }
        });
    }
    getMessageService() {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            let notificationService = null;
            switch (this.liveShare.session.role) {
                case vscode_1.Role.Guest:
                case vscode_1.Role.None:
                    notificationService = new GuestMessagingService_1.GuestMessagingService(this.liveShare);
                    break;
                case vscode_1.Role.Host:
                    notificationService = new HostMessagingService_1.HostMessagingService(this.liveShare);
                    break;
            }
            yield notificationService.initialize();
            notificationService.event((data) => { _super("fire").call(this, data); });
            return notificationService;
        });
    }
    fire(data) {
        if (!this.notificationService) {
            this.traceSource.error('No notificationService created');
            return;
        }
        this.notificationService.fire(data);
    }
}
exports.MessagingService = MessagingService;
//# sourceMappingURL=MessagingService.js.map