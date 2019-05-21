"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crc_1 = require("crc");
const fs = require("fs-plus");
class OTA {
    static generateCrc(filePath) {
        const data = fs.readFileSync(filePath);
        const size = fs.statSync(filePath).size;
        const crc = crc_1.crc16xmodem(data).toString(16);
        return { crc, size };
    }
}
exports.OTA = OTA;
//# sourceMappingURL=OTA.js.map