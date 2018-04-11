"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../util/log");
const index_1 = require("../adapter/index");
const vscode_debugadapter_1 = require("vscode-debugadapter");
let log = log_1.Log.create('FrameAdapter');
class FrameAdapter {
    constructor(frameRegistry, frame, threadAdapter) {
        this.frameRegistry = frameRegistry;
        this.frame = frame;
        this.threadAdapter = threadAdapter;
        this.id = frameRegistry.register(this);
        let environmentAdapter = index_1.EnvironmentAdapter.from(this.frame.environment);
        this.scopeAdapters = environmentAdapter.getScopeAdapters(this);
        if (this.frame.this !== undefined) {
            this.scopeAdapters[0].addThis(this.frame.this);
        }
    }
    getStackframe() {
        let sourceActorName = this.frame.where.source.actor;
        let sourceAdapter = this.threadAdapter.findSourceAdapterForActorName(sourceActorName);
        if (!sourceAdapter) {
            throw new Error(`Couldn't find source adapter for ${sourceActorName}`);
        }
        let name;
        switch (this.frame.type) {
            case 'call':
                let callee = this.frame.callee;
                if ((typeof callee === 'object') && (callee.type === 'object') &&
                    (callee.class === 'Function')) {
                    let functionGrip = callee;
                    let calleeName = functionGrip.name || functionGrip.displayName;
                    name = (calleeName !== undefined) ? calleeName : '[anonymous function]';
                }
                else {
                    log.error(`Unexpected callee in call frame: ${JSON.stringify(callee)}`);
                    name = '[unknown]';
                }
                break;
            case 'global':
                name = '[Global]';
                break;
            case 'eval':
            case 'clientEvaluate':
                name = '[eval]';
                break;
            case 'wasmcall':
                name = '[wasm]';
                break;
            default:
                name = `[${this.frame.type}]`;
                log.error(`Unexpected frame type ${this.frame.type}`);
                break;
        }
        return new vscode_debugadapter_1.StackFrame(this.id, name, sourceAdapter.source, this.frame.where.line, this.frame.where.column);
    }
    dispose() {
        this.frameRegistry.unregister(this.id);
    }
}
exports.FrameAdapter = FrameAdapter;
//# sourceMappingURL=frame.js.map