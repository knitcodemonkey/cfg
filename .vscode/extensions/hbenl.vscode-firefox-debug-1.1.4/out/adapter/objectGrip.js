"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const index_1 = require("./index");
class ObjectGripAdapter {
    constructor(variableAdapter, objectGrip, threadLifetime) {
        this.variableAdapter = variableAdapter;
        this.threadLifetime = threadLifetime;
        this.actor = this.threadAdapter.debugSession.getOrCreateObjectGripActorProxy(objectGrip);
        this.actor.increaseRefCount();
        this.variablesProviderId = this.threadAdapter.debugSession.variablesProviders.register(this);
        this.threadAdapter.registerObjectGripAdapter(this);
    }
    get threadAdapter() {
        return this.variableAdapter.threadAdapter;
    }
    get referenceExpression() {
        return this.variableAdapter.referenceExpression;
    }
    get referenceFrame() {
        return this.variableAdapter.referenceFrame;
    }
    getVariables() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let prototypeAndProperties = yield this.threadAdapter.coordinator.runOnPausedThread(() => this.actor.fetchPrototypeAndProperties());
            let variables = [];
            let symbolVariables = [];
            let safeGetterValues = prototypeAndProperties.safeGetterValues || {};
            let symbolProperties = prototypeAndProperties.ownSymbols || [];
            for (let varname in prototypeAndProperties.ownProperties) {
                if (!safeGetterValues[varname]) {
                    variables.push(index_1.VariableAdapter.fromPropertyDescriptor(varname, this.referenceExpression, this.referenceFrame, prototypeAndProperties.ownProperties[varname], this.threadLifetime, this.threadAdapter));
                }
            }
            for (let varname in safeGetterValues) {
                variables.push(index_1.VariableAdapter.fromSafeGetterValueDescriptor(varname, this.referenceExpression, this.referenceFrame, safeGetterValues[varname], this.threadLifetime, this.threadAdapter));
            }
            for (let symbolProperty of symbolProperties) {
                symbolVariables.push(index_1.VariableAdapter.fromPropertyDescriptor(symbolProperty.name, undefined, undefined, symbolProperty.descriptor, this.threadLifetime, this.threadAdapter));
            }
            index_1.VariableAdapter.sortVariables(variables);
            index_1.VariableAdapter.sortVariables(symbolVariables);
            variables.push(...symbolVariables);
            if (prototypeAndProperties.prototype.type !== 'null') {
                variables.push(index_1.VariableAdapter.fromGrip('__proto__', this.referenceExpression, this.referenceFrame, prototypeAndProperties.prototype, this.threadLifetime, this.threadAdapter));
            }
            return variables;
        });
    }
    dispose() {
        this.actor.decreaseRefCount();
        this.threadAdapter.debugSession.variablesProviders.unregister(this.variablesProviderId);
    }
}
exports.ObjectGripAdapter = ObjectGripAdapter;
//# sourceMappingURL=objectGrip.js.map