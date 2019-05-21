"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TestResults_1 = require("../TestResults");
var TestState;
(function (TestState) {
    TestState["Fail"] = "fail";
    TestState["Pass"] = "pass";
    TestState["Skip"] = "skip";
    TestState["Unknown"] = "unknown";
})(TestState = exports.TestState || (exports.TestState = {}));
exports.TestStateByTestReconciliationState = {
    [TestResults_1.TestReconciliationState.KnownFail]: TestState.Fail,
    [TestResults_1.TestReconciliationState.KnownSkip]: TestState.Skip,
    [TestResults_1.TestReconciliationState.KnownSuccess]: TestState.Pass,
    [TestResults_1.TestReconciliationState.Unknown]: TestState.Unknown,
};
//# sourceMappingURL=TestState.js.map