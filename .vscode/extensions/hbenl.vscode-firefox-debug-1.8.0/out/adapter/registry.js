"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Registry {
    constructor() {
        this.objectsById = new Map();
        this.nextId = 1;
    }
    register(obj) {
        let id = this.nextId++;
        this.objectsById.set(id, obj);
        return id;
    }
    unregister(id) {
        return this.objectsById.delete(id);
    }
    has(id) {
        return this.objectsById.has(id);
    }
    find(id) {
        return this.objectsById.get(id);
    }
    get count() {
        return this.objectsById.size;
    }
    [Symbol.iterator]() {
        return this.objectsById[Symbol.iterator]();
    }
    map(f) {
        let result = [];
        for (let [, obj] of this.objectsById) {
            result.push(f(obj));
        }
        return result;
    }
}
exports.Registry = Registry;
//# sourceMappingURL=registry.js.map