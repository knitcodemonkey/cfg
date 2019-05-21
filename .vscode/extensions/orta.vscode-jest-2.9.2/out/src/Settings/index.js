"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isDefaultPathToJest(str) {
    return str === null || str === '';
}
exports.isDefaultPathToJest = isDefaultPathToJest;
function hasUserSetPathToJest(str) {
    return !isDefaultPathToJest(str);
}
exports.hasUserSetPathToJest = hasUserSetPathToJest;
//# sourceMappingURL=index.js.map