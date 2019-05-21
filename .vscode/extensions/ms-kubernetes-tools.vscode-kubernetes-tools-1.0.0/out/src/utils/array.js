"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function flatten(...arrays) {
    return Array.of().concat(...arrays);
}
exports.flatten = flatten;
function definedOf(...items) {
    return items.filter((i) => i !== undefined).map((i) => i);
}
exports.definedOf = definedOf;
if (!Array.prototype.choose) {
    Array.prototype.choose = function (fn) {
        return this.map(fn).filter((u) => u !== undefined).map((u) => u);
    };
}
//# sourceMappingURL=array.js.map