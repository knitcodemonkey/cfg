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
const config = require("./components/config/config");
function findBinary(shell, binName) {
    return __awaiter(this, void 0, void 0, function* () {
        let cmd = `which ${binName}`;
        if (shell.isWindows()) {
            cmd = `where.exe ${binName}.exe`;
        }
        const opts = {
            async: true,
            env: {
                HOME: process.env.HOME,
                PATH: process.env.PATH
            }
        };
        const execResult = yield shell.execCore(cmd, opts);
        if (execResult.code) {
            return { err: execResult.code, output: execResult.stderr };
        }
        return { err: null, output: execResult.stdout };
    });
}
function execPath(shell, basePath) {
    let bin = basePath;
    if (shell.isWindows() && bin && !(bin.endsWith('.exe'))) {
        bin = bin + '.exe';
    }
    return bin;
}
exports.execPath = execPath;
function alertNoBin(host, binName, failureReason, message, installDependencies) {
    switch (failureReason) {
        case 'inferFailed':
            host.showErrorMessage(message, 'Install dependencies', 'Learn more').then((str) => {
                switch (str) {
                    case 'Learn more':
                        host.showInformationMessage(`Add ${binName} directory to path, or set "vs-kubernetes.${binName}-path" config to ${binName} binary.`);
                        break;
                    case 'Install dependencies':
                        installDependencies();
                        break;
                }
            });
            break;
        case 'configuredFileMissing':
            host.showErrorMessage(message, 'Install dependencies').then((str) => {
                if (str === 'Install dependencies') {
                    installDependencies();
                }
            });
            break;
    }
}
function checkForBinary(context, bin, binName, inferFailedMessage, configuredFileMissingMessage, alertOnFail) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!bin) {
            const fb = yield findBinary(context.shell, binName);
            if (fb.err || fb.output.length === 0) {
                if (alertOnFail) {
                    alertNoBin(context.host, binName, 'inferFailed', inferFailedMessage, context.installDependenciesCallback);
                }
                return false;
            }
            context.binFound = true;
            return true;
        }
        if (!config.getUseWsl()) {
            context.binFound = context.fs.existsSync(bin);
        }
        else {
            const sr = yield context.shell.exec(`ls ${bin}`);
            context.binFound = (!!sr && sr.code === 0);
        }
        if (context.binFound) {
            context.binPath = bin;
        }
        else {
            if (alertOnFail) {
                alertNoBin(context.host, binName, 'configuredFileMissing', configuredFileMissingMessage, context.installDependenciesCallback);
            }
        }
        return context.binFound;
    });
}
exports.checkForBinary = checkForBinary;
//# sourceMappingURL=binutil.js.map