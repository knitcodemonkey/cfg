"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WatchMode;
(function (WatchMode) {
    WatchMode["None"] = "none";
    WatchMode["Watch"] = "watch";
    WatchMode["WatchAll"] = "watchAll";
})(WatchMode = exports.WatchMode || (exports.WatchMode = {}));
exports.isWatchNotSupported = (str = '') => new RegExp('^s*--watch is not supported without git/hg, please use --watchAlls*', 'im').test(str);
//# sourceMappingURL=index.js.map