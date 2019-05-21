"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JestProcess_1 = require("./JestProcess");
const Jest_1 = require("../Jest");
class JestProcessManager {
    constructor({ projectWorkspace, runAllTestsFirstInWatchMode = true, }) {
        this.jestProcesses = [];
        this.projectWorkspace = projectWorkspace;
        this.runAllTestsFirstInWatchMode = runAllTestsFirstInWatchMode;
    }
    removeJestProcessReference(jestProcess) {
        const index = this.jestProcesses.indexOf(jestProcess);
        if (index !== -1) {
            this.jestProcesses.splice(index, 1);
        }
    }
    runJest({ watchMode, keepAlive, exitCallback }) {
        const jestProcess = new JestProcess_1.JestProcess({
            projectWorkspace: this.projectWorkspace,
            watchMode,
            keepAlive,
        });
        this.jestProcesses.unshift(jestProcess);
        jestProcess.onExit(exitCallback);
        return jestProcess;
    }
    run({ watchMode, keepAlive, exitCallback }) {
        return this.runJest({
            watchMode,
            keepAlive,
            exitCallback: exitedJestProcess => {
                exitCallback(exitedJestProcess);
                if (!exitedJestProcess.keepAlive) {
                    this.removeJestProcessReference(exitedJestProcess);
                }
            },
        });
    }
    runAllTestsFirst(onExit) {
        return this.runJest({
            watchMode: Jest_1.WatchMode.None,
            keepAlive: false,
            exitCallback: onExit,
        });
    }
    startJestProcess({ exitCallback = () => { }, watchMode = Jest_1.WatchMode.None, keepAlive = false, } = {}) {
        if (watchMode !== Jest_1.WatchMode.None && this.runAllTestsFirstInWatchMode) {
            return this.runAllTestsFirst(exitedJestProcess => {
                this.removeJestProcessReference(exitedJestProcess);
                const jestProcessInWatchMode = this.run({
                    watchMode: Jest_1.WatchMode.Watch,
                    keepAlive,
                    exitCallback,
                });
                exitCallback(exitedJestProcess, jestProcessInWatchMode);
            });
        }
        else {
            return this.run({
                watchMode,
                keepAlive,
                exitCallback,
            });
        }
    }
    stopAll() {
        const processesToRemove = [...this.jestProcesses];
        this.jestProcesses = [];
        processesToRemove.forEach(jestProcess => {
            jestProcess.stop();
        });
    }
    stopJestProcess(jestProcess) {
        this.removeJestProcessReference(jestProcess);
        return jestProcess.stop();
    }
    get numberOfProcesses() {
        return this.jestProcesses.length;
    }
}
exports.JestProcessManager = JestProcessManager;
//# sourceMappingURL=JestProcessManager.js.map