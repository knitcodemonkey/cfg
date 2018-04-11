"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = require("fs-extra");
const misc_1 = require("./misc");
const log_1 = require("./log");
let log = log_1.Log.create('fs');
function isExecutable(path) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            yield fs.access(path, fs.constants.X_OK);
            return true;
        }
        catch (e) {
            return false;
        }
    });
}
exports.isExecutable = isExecutable;
function tryRemoveRepeatedly(dir) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        for (var i = 0; i < 5; i++) {
            try {
                yield fs.remove(dir);
                log.debug(`Removed ${dir}`);
                return;
            }
            catch (err) {
                if (i < 4) {
                    log.debug(`Attempt to remove ${dir} failed, will retry in 100ms`);
                    yield misc_1.delay(100);
                }
                else {
                    log.debug(`Attempt to remove ${dir} failed, giving up`);
                    throw err;
                }
            }
        }
    });
}
exports.tryRemoveRepeatedly = tryRemoveRepeatedly;
//# sourceMappingURL=fs.js.map