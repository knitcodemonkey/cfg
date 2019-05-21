//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const traceSource_1 = require("./traceSource");
class OutputTraceListener extends traceSource_1.TraceListener {
    constructor(outputChannelName) {
        super();
        this.channelName = outputChannelName;
    }
    writeLine(line) {
        if (this.channel != null) {
            this.channel.appendLine(line);
        }
    }
    writeEvent(source, eventType, id, message) {
        const line = traceSource_1.TraceFormat.formatEvent(null, source, eventType, id, message);
        this.writeLine(line);
    }
    addOutputChannel() {
        if (this.channel != null) {
            return;
        }
        this.channel = vscode.window.createOutputChannel(this.channelName);
    }
    removeOutputChannel() {
        if (this.channel == null) {
            return;
        }
        this.channel.dispose();
        this.channel = null;
    }
}
exports.OutputTraceListener = OutputTraceListener;
//# sourceMappingURL=outputTraceListener.js.map