"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const message = {
    type: 'message',
    data: {
        batchId: undefined,
        isError: true,
        link: undefined,
        message: 'Error occurred',
        time: '12:01:01' // Should be displayed b/c it does not have a batchId
    }
};
exports.default = message;

//# sourceMappingURL=mockMessageError.spec.js.map
