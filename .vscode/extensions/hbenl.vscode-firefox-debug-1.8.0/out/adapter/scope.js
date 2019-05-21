"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const index_1 = require("./index");
const vscode_debugadapter_1 = require("vscode-debugadapter");
class ScopeAdapter {
    constructor(name, referenceFrame) {
        this.name = name;
        this.referenceFrame = referenceFrame;
        this.referenceExpression = '';
        this.threadAdapter.registerScopeAdapter(this);
        this.variablesProviderId = this.threadAdapter.debugSession.variablesProviders.register(this);
    }
    get threadAdapter() {
        return this.referenceFrame.threadAdapter;
    }
    static fromGrip(name, grip, referenceFrame) {
        if ((typeof grip === 'object') && (grip.type === 'object')) {
            return new ObjectScopeAdapter(name, grip, referenceFrame);
        }
        else {
            return new SingleValueScopeAdapter(name, grip, referenceFrame);
        }
    }
    addThis(thisValue) {
        this.thisVariable = index_1.VariableAdapter.fromGrip('this', this.referenceExpression, this.referenceFrame, thisValue, false, this.threadAdapter);
    }
    addReturnValue(returnValue) {
        this.returnVariable = index_1.VariableAdapter.fromGrip('Return value', undefined, this.referenceFrame, returnValue, false, this.threadAdapter);
    }
    getScope() {
        return new vscode_debugadapter_1.Scope(this.name, this.variablesProviderId);
    }
    getVariables() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let variables = yield this.getVariablesInt();
            if (this.thisVariable) {
                variables.unshift(this.thisVariable);
            }
            if (this.returnVariable) {
                variables.unshift(this.returnVariable);
            }
            return variables;
        });
    }
    dispose() {
        this.threadAdapter.debugSession.variablesProviders.unregister(this.variablesProviderId);
    }
}
exports.ScopeAdapter = ScopeAdapter;
class SingleValueScopeAdapter extends ScopeAdapter {
    constructor(name, grip, referenceFrame) {
        super(name, referenceFrame);
        this.variableAdapter = index_1.VariableAdapter.fromGrip('', this.referenceExpression, this.referenceFrame, grip, false, this.threadAdapter);
    }
    getVariablesInt() {
        return Promise.resolve([this.variableAdapter]);
    }
}
exports.SingleValueScopeAdapter = SingleValueScopeAdapter;
class ObjectScopeAdapter extends ScopeAdapter {
    constructor(name, object, referenceFrame) {
        super(name, referenceFrame);
        this.variableAdapter = index_1.VariableAdapter.fromGrip('', this.referenceExpression, this.referenceFrame, object, false, this.threadAdapter);
    }
    getVariablesInt() {
        return this.variableAdapter.variablesProvider.getVariables();
    }
}
exports.ObjectScopeAdapter = ObjectScopeAdapter;
class LocalVariablesScopeAdapter extends ScopeAdapter {
    constructor(name, variableDescriptors, referenceFrame) {
        super(name, referenceFrame);
        this.variables = [];
        for (let varname in variableDescriptors) {
            this.variables.push(index_1.VariableAdapter.fromPropertyDescriptor(varname, this.referenceExpression, this.referenceFrame, variableDescriptors[varname], false, this.threadAdapter));
        }
        index_1.VariableAdapter.sortVariables(this.variables);
    }
    getVariablesInt() {
        return Promise.resolve(this.variables);
    }
}
exports.LocalVariablesScopeAdapter = LocalVariablesScopeAdapter;
class FunctionScopeAdapter extends ScopeAdapter {
    constructor(name, bindings, referenceFrame) {
        super(name, referenceFrame);
        this.variables = [];
        bindings.arguments.forEach((arg) => {
            for (let varname in arg) {
                this.variables.push(index_1.VariableAdapter.fromPropertyDescriptor(varname, this.referenceExpression, this.referenceFrame, arg[varname], false, this.threadAdapter));
            }
        });
        for (let varname in bindings.variables) {
            this.variables.push(index_1.VariableAdapter.fromPropertyDescriptor(varname, this.referenceExpression, this.referenceFrame, bindings.variables[varname], false, this.threadAdapter));
        }
        index_1.VariableAdapter.sortVariables(this.variables);
    }
    getVariablesInt() {
        return Promise.resolve(this.variables);
    }
}
exports.FunctionScopeAdapter = FunctionScopeAdapter;
//# sourceMappingURL=scope.js.map