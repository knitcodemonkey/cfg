"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const traceSource_1 = require("../tracing/traceSource");
const _ = require("lodash");
class VSCallingLogger {
    constructor(namespace = []) {
        this.namespace = namespace;
        this.trace = traceSource_1.defaultTraceSource.withName('VSCallingLogger');
    }
    createChild(childNamespace, debug) {
        return new VSCallingLogger([...this.namespace, typeof childNamespace === 'string' ? () => childNamespace : childNamespace]);
    }
    log(...args) {
        return this.trace.info(this.argsToString(args));
    }
    debug(...args) {
        return this.trace.info(this.argsToString(args));
    }
    info(...args) {
        return this.trace.info(this.argsToString(args));
    }
    warn(...args) {
        return this.trace.warning(this.argsToString(args));
    }
    error(...args) {
        return this.trace.error(this.argsToString(args));
    }
    get _prefix() {
        return this.namespace.map(fn => fn()).join('/');
    }
    argsToString(args) {
        try {
            let strings = _.map(args, (arg) => {
                if (!arg) {
                    return '';
                }
                if (arg instanceof String || arg instanceof Number || arg instanceof Error) {
                    return arg.toString();
                }
                return JSON.stringify(arg);
            });
            return this._prefix + ' ' + _.join(strings, ' ');
        }
        catch (e) {
            return 'Failed to convert trace statement';
        }
    }
}
exports.VSCallingLogger = VSCallingLogger;
//# sourceMappingURL=callingLogger.js.map