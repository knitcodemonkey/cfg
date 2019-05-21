"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../util/log");
const scope_1 = require("./scope");
let log = log_1.Log.create('EnvironmentAdapter');
class EnvironmentAdapter {
    constructor(environment) {
        this.environment = environment;
        if (environment.parent !== undefined) {
            this.parent = EnvironmentAdapter.from(environment.parent);
        }
    }
    static from(environment) {
        switch (environment.type) {
            case 'object':
                return new ObjectEnvironmentAdapter(environment);
            case 'function':
                return new FunctionEnvironmentAdapter(environment);
            case 'with':
                return new WithEnvironmentAdapter(environment);
            case 'block':
                return new BlockEnvironmentAdapter(environment);
            default:
                throw new Error(`Unknown environment type ${environment.type}`);
        }
    }
    getScopeAdapters(frameAdapter) {
        let scopes = this.getAllScopeAdapters(frameAdapter);
        return scopes;
    }
    getAllScopeAdapters(frameAdapter) {
        let scopes;
        if (this.parent !== undefined) {
            scopes = this.parent.getAllScopeAdapters(frameAdapter);
        }
        else {
            scopes = [];
        }
        let ownScope = this.getOwnScopeAdapter(frameAdapter);
        scopes.unshift(ownScope);
        return scopes;
    }
}
exports.EnvironmentAdapter = EnvironmentAdapter;
class ObjectEnvironmentAdapter extends EnvironmentAdapter {
    constructor(environment) {
        super(environment);
    }
    getOwnScopeAdapter(frameAdapter) {
        let grip = this.environment.object;
        if ((typeof grip === 'boolean') || (typeof grip === 'number') || (typeof grip === 'string')) {
            throw new Error(`Object environment with unexpected grip of type ${typeof grip}`);
        }
        else if (grip.type !== 'object') {
            throw new Error(`Object environment with unexpected grip of type ${grip.type}`);
        }
        else {
            let objectGrip = grip;
            let name = `Object: ${objectGrip.class}`;
            return new scope_1.ObjectScopeAdapter(name, objectGrip, frameAdapter);
        }
    }
}
exports.ObjectEnvironmentAdapter = ObjectEnvironmentAdapter;
class FunctionEnvironmentAdapter extends EnvironmentAdapter {
    constructor(environment) {
        super(environment);
    }
    getOwnScopeAdapter(frameAdapter) {
        let func = this.environment.function;
        let scopeName;
        if ((typeof func === 'object') && (func.type === 'object') &&
            (func.class === 'Function')) {
            let funcName = func.name;
            scopeName = (funcName !== undefined) ? `Local: ${funcName}` : 'Local';
        }
        else {
            log.error(`Unexpected function grip in function environment: ${JSON.stringify(func)}`);
            scopeName = '[unknown]';
        }
        return new scope_1.FunctionScopeAdapter(scopeName, this.environment.bindings, frameAdapter);
    }
}
exports.FunctionEnvironmentAdapter = FunctionEnvironmentAdapter;
class WithEnvironmentAdapter extends EnvironmentAdapter {
    constructor(environment) {
        super(environment);
    }
    getOwnScopeAdapter(frameAdapter) {
        let grip = this.environment.object;
        if ((typeof grip === 'boolean') || (typeof grip === 'number') || (typeof grip === 'string')) {
            throw new Error(`"with" environment with unexpected grip of type ${typeof grip}`);
        }
        else if (grip.type !== 'object') {
            throw new Error(`"with" environment with unexpected grip of type ${grip.type}`);
        }
        else {
            let objectGrip = grip;
            let name = `With: ${objectGrip.class}`;
            return new scope_1.ObjectScopeAdapter(name, objectGrip, frameAdapter);
        }
    }
}
exports.WithEnvironmentAdapter = WithEnvironmentAdapter;
class BlockEnvironmentAdapter extends EnvironmentAdapter {
    constructor(environment) {
        super(environment);
    }
    getOwnScopeAdapter(frameAdapter) {
        return new scope_1.LocalVariablesScopeAdapter('Block', this.environment.bindings.variables, frameAdapter);
    }
}
exports.BlockEnvironmentAdapter = BlockEnvironmentAdapter;
//# sourceMappingURL=environment.js.map