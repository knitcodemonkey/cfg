"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const variable_1 = require("./variable");
class GetterValueAdapter {
    constructor(variableAdapter) {
        this.variableAdapter = variableAdapter;
        this.variablesProviderId = this.threadAdapter.debugSession.variablesProviders.register(this);
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
            if (this.referenceExpression && this.referenceFrame) {
                const grip = yield this.threadAdapter.coordinator.evaluate(this.referenceExpression, this.referenceFrame.frame.actor);
                const variableAdapter = variable_1.VariableAdapter.fromGrip('Value from Getter', this.referenceExpression, this.referenceFrame, grip, false, this.threadAdapter, true);
                return [variableAdapter];
            }
            else {
                return [];
            }
        });
    }
}
exports.GetterValueAdapter = GetterValueAdapter;
//# sourceMappingURL=getterValue.js.map