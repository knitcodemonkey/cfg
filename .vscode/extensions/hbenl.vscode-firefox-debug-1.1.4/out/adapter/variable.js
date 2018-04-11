"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../util/log");
const index_1 = require("./index");
const vscode_debugadapter_1 = require("vscode-debugadapter");
const misc_1 = require("../util/misc");
const preview_1 = require("./preview");
const getterValue_1 = require("./getterValue");
let log = log_1.Log.create('VariableAdapter');
class VariableAdapter {
    constructor(varname, referenceExpression, referenceFrame, displayValue, threadAdapter) {
        this.varname = varname;
        this.referenceExpression = referenceExpression;
        this.referenceFrame = referenceFrame;
        this.displayValue = displayValue;
        this.threadAdapter = threadAdapter;
    }
    get variablesProvider() {
        return this._variablesProvider;
    }
    getVariable() {
        let variable = new vscode_debugadapter_1.Variable(this.varname, this.displayValue, this.variablesProvider ? this.variablesProvider.variablesProviderId : undefined);
        variable.evaluateName = this.referenceExpression;
        return variable;
    }
    static fromGrip(varname, parentReferenceExpression, referenceFrame, grip, threadLifetime, threadAdapter, useParentReferenceExpression) {
        let referenceExpression = useParentReferenceExpression ?
            parentReferenceExpression :
            misc_1.accessorExpression(parentReferenceExpression, varname);
        if ((typeof grip === 'boolean') || (typeof grip === 'number')) {
            return new VariableAdapter(varname, referenceExpression, referenceFrame, grip.toString(), threadAdapter);
        }
        else if (typeof grip === 'string') {
            return new VariableAdapter(varname, referenceExpression, referenceFrame, `"${grip}"`, threadAdapter);
        }
        else {
            switch (grip.type) {
                case 'null':
                case 'undefined':
                case 'Infinity':
                case '-Infinity':
                case 'NaN':
                case '-0':
                    return new VariableAdapter(varname, referenceExpression, referenceFrame, grip.type, threadAdapter);
                case 'longString':
                    return new VariableAdapter(varname, referenceExpression, referenceFrame, grip.initial, threadAdapter);
                case 'symbol':
                    let symbolName = grip.name;
                    return new VariableAdapter(varname, referenceExpression, referenceFrame, `Symbol(${symbolName})`, threadAdapter);
                case 'object':
                    let objectGrip = grip;
                    let displayValue = preview_1.renderPreview(objectGrip);
                    let variableAdapter = new VariableAdapter(varname, referenceExpression, referenceFrame, displayValue, threadAdapter);
                    variableAdapter._variablesProvider = new index_1.ObjectGripAdapter(variableAdapter, objectGrip, threadLifetime);
                    return variableAdapter;
                default:
                    log.warn(`Unexpected object grip of type ${grip.type}: ${JSON.stringify(grip)}`);
                    return new VariableAdapter(varname, referenceExpression, referenceFrame, grip.type, threadAdapter);
            }
        }
    }
    static fromPropertyDescriptor(varname, parentReferenceExpression, referenceFrame, propertyDescriptor, threadLifetime, threadAdapter) {
        if (propertyDescriptor.value !== undefined) {
            return VariableAdapter.fromGrip(varname, parentReferenceExpression, referenceFrame, propertyDescriptor.value, threadLifetime, threadAdapter);
        }
        else {
            let referenceExpression = misc_1.accessorExpression(parentReferenceExpression, varname);
            let accessorPropertyDescriptor = propertyDescriptor;
            let hasGetter = VariableAdapter.isFunctionGrip(accessorPropertyDescriptor.get);
            let hasSetter = VariableAdapter.isFunctionGrip(accessorPropertyDescriptor.set);
            let displayValue;
            if (hasGetter) {
                displayValue = 'Getter';
                if (hasSetter) {
                    displayValue += ' & Setter';
                }
                displayValue += ' - expand to execute Getter';
            }
            else if (hasSetter) {
                displayValue = 'Setter';
            }
            else {
                log.error(`${referenceExpression} is neither a data property nor does it have a getter or setter`);
                displayValue = 'Error';
            }
            let variableAdapter = new VariableAdapter(varname, referenceExpression, referenceFrame, displayValue, threadAdapter);
            if (hasGetter) {
                variableAdapter._variablesProvider = new getterValue_1.GetterValueAdapter(variableAdapter);
            }
            return variableAdapter;
        }
    }
    static fromSafeGetterValueDescriptor(varname, parentReferenceExpression, referenceFrame, safeGetterValueDescriptor, threadLifetime, threadAdapter) {
        return VariableAdapter.fromGrip(varname, parentReferenceExpression, referenceFrame, safeGetterValueDescriptor.getterValue, threadLifetime, threadAdapter);
    }
    static sortVariables(variables) {
        variables.sort((var1, var2) => VariableAdapter.compareStrings(var1.varname, var2.varname));
    }
    static compareStrings(s1, s2) {
        if (s1 < s2) {
            return -1;
        }
        else if (s1 === s2) {
            return 0;
        }
        else {
            return 1;
        }
    }
    static isFunctionGrip(grip) {
        return ((typeof grip === 'object') &&
            (grip.type === 'object') &&
            (grip.class === 'Function'));
    }
}
exports.VariableAdapter = VariableAdapter;
//# sourceMappingURL=variable.js.map