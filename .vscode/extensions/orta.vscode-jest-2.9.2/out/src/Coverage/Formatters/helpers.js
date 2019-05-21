"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isValidLocation(l) {
    return isValidPosition(l.start) && isValidPosition(l.end);
}
exports.isValidLocation = isValidLocation;
function isValidPosition(p) {
    return (p || false) && p.line !== null && p.line >= 0;
}
exports.isValidPosition = isValidPosition;
//# sourceMappingURL=helpers.js.map