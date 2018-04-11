"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class DebugProtocolTransport extends events_1.EventEmitter {
    constructor(socket) {
        super();
        this.socket = socket;
        this.buffer = new Buffer(DebugProtocolTransport.initialBufferLength);
        this.bufferedLength = 0;
        this.receivingHeader = true;
        this.socket.on('data', (chunk) => {
            let processedLength = 0;
            while (processedLength < chunk.length) {
                let copyLength = Math.min(chunk.length - processedLength, this.buffer.length - this.bufferedLength);
                chunk.copy(this.buffer, this.bufferedLength, processedLength, processedLength + copyLength);
                processedLength += copyLength;
                this.bufferedLength += copyLength;
                if (this.receivingHeader) {
                    for (var i = 0; i < this.bufferedLength; i++) {
                        if (this.buffer[i] === 58) {
                            let bodyLength = +this.buffer.toString('ascii', 0, i);
                            let bodyBuffer = new Buffer(bodyLength);
                            this.buffer.copy(bodyBuffer, 0, i + 1);
                            this.buffer = bodyBuffer;
                            this.bufferedLength = this.bufferedLength - (i + 1);
                            this.receivingHeader = false;
                            break;
                        }
                    }
                }
                else {
                    if (this.bufferedLength === this.buffer.length) {
                        let msgString = this.buffer.toString('utf8');
                        this.emit('message', JSON.parse(msgString));
                        this.buffer = new Buffer(DebugProtocolTransport.initialBufferLength);
                        this.bufferedLength = 0;
                        this.receivingHeader = true;
                    }
                }
            }
        });
    }
    sendMessage(msg) {
        let msgBuf = new Buffer(JSON.stringify(msg), 'utf8');
        this.socket.write(msgBuf.length + ':', 'ascii');
        this.socket.write(msgBuf);
    }
    disconnect() {
        return new Promise((resolve, reject) => {
            this.socket.on('close', () => resolve());
            this.socket.end();
        });
    }
}
DebugProtocolTransport.initialBufferLength = 11;
exports.DebugProtocolTransport = DebugProtocolTransport;
//# sourceMappingURL=transport.js.map