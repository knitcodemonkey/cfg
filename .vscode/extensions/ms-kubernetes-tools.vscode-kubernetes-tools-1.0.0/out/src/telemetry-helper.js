"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const telemetry_1 = require("./telemetry");
function telemetrise(command, kubectl, callback) {
    return (a) => {
        clusterType(kubectl).then((ct) => {
            if (telemetry_1.reporter) {
                telemetry_1.reporter.sendTelemetryEvent("command", { command: command, clusterType: ct });
            }
        });
        return callback(a);
    };
}
exports.telemetrise = telemetrise;
var ClusterType;
(function (ClusterType) {
    ClusterType[ClusterType["Unknown"] = 0] = "Unknown";
    ClusterType[ClusterType["Azure"] = 1] = "Azure";
    ClusterType[ClusterType["Minikube"] = 2] = "Minikube";
    ClusterType[ClusterType["Other"] = 3] = "Other";
})(ClusterType = exports.ClusterType || (exports.ClusterType = {}));
let latestContextName;
let cachedClusterType = ClusterType.Unknown;
const knownClusters = {};
function invalidateClusterType(newContext, kubectl) {
    latestContextName = newContext || null;
    cachedClusterType = ClusterType.Unknown;
    if (kubectl) {
        setImmediate(() => {
            try {
                loadCachedClusterType(kubectl);
            }
            catch (_a) {
                // swallow it
            }
        });
    }
}
exports.invalidateClusterType = invalidateClusterType;
function clusterType(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (cachedClusterType === ClusterType.Unknown) {
            yield loadCachedClusterType(kubectl);
        }
        switch (cachedClusterType) {
            case ClusterType.Azure:
                return 'azure';
            case ClusterType.Minikube:
                return 'minikube';
            case ClusterType.Other:
                return 'other';
            default:
                return 'indeterminate';
        }
    });
}
function loadCachedClusterType(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (latestContextName && knownClusters[latestContextName]) {
            cachedClusterType = knownClusters[latestContextName];
        }
        else {
            cachedClusterType = yield inferCurrentClusterType(kubectl);
            if (latestContextName) {
                knownClusters[latestContextName] = cachedClusterType;
            }
        }
    });
}
function inferCurrentClusterType(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!latestContextName) {
            const ctxsr = yield kubectl.invokeAsync('config current-context');
            if (ctxsr && ctxsr.code === 0) {
                latestContextName = ctxsr.stdout.trim();
            }
            else {
                return ClusterType.Other; // something is terribly wrong; we don't want to retry
            }
        }
        if (latestContextName === 'minikube') {
            return ClusterType.Minikube;
        }
        const cisr = yield kubectl.invokeAsync('cluster-info');
        if (!cisr || cisr.code !== 0) {
            return ClusterType.Unknown;
        }
        const masterInfos = cisr.stdout.split('\n')
            .filter((s) => s.indexOf('master is running at') >= 0);
        if (masterInfos.length === 0) {
            return ClusterType.Other; // something is terribly wrong; we don't want to retry
        }
        const masterInfo = masterInfos[0];
        if (masterInfo.indexOf('azmk8s.io') >= 0 || masterInfo.indexOf('azure.com') >= 0) {
            return ClusterType.Azure;
        }
        if (latestContextName) {
            const gcsr = yield kubectl.invokeAsync(`config get-contexts ${latestContextName}`);
            if (gcsr && gcsr.code === 0) {
                if (gcsr.stdout.indexOf('minikube') >= 0) {
                    return ClusterType.Minikube; // It's pretty heuristic, so don't spend time parsing the table
                }
            }
        }
        return ClusterType.Other;
    });
}
//# sourceMappingURL=telemetry-helper.js.map