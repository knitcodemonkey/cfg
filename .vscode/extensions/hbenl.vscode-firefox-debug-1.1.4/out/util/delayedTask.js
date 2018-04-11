"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const log_1 = require("../util/log");
let log = log_1.Log.create('DelayedTask');
class DelayedTask {
    constructor(task) {
        this.task = task;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        this.state = 'waiting';
    }
    execute() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.state !== 'waiting') {
                log.error(`Tried to execute DelayedTask, but it is ${this.state}`);
                return;
            }
            let result;
            try {
                this.state = 'running';
                result = yield this.task();
                this.resolve(result);
            }
            catch (err) {
                this.reject(err);
                throw err;
            }
            this.state = 'finished';
        });
    }
    cancel(reason) {
        if (this.state !== 'waiting') {
            log.error(`Tried to cancel DelayedTask, but it is ${this.state}`);
            return;
        }
        this.reject(reason);
        this.state = 'finished';
    }
}
exports.DelayedTask = DelayedTask;
//# sourceMappingURL=delayedTask.js.map