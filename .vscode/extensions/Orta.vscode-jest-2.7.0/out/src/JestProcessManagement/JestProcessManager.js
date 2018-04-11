"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JestProcess_1 = require("./JestProcess");
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
    runJest({ watch, keepAlive, exitCallback }) {
        const jestProcess = new JestProcess_1.JestProcess({
            projectWorkspace: this.projectWorkspace,
            watchMode: watch,
            keepAlive: keepAlive,
        });
        this.jestProcesses.unshift(jestProcess);
        jestProcess.onExit(exitCallback);
        return jestProcess;
    }
    run({ watch, keepAlive, exitCallback }) {
        return this.runJest({
            watch,
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
            watch: false,
            keepAlive: false,
            exitCallback: onExit,
        });
    }
    startJestProcess({ exitCallback = () => { }, watch = false, keepAlive = false, } = {
            exitCallback: () => { },
            watch: false,
            keepAlive: false,
        }) {
        if (watch && this.runAllTestsFirstInWatchMode) {
            return this.runAllTestsFirst(exitedJestProcess => {
                this.removeJestProcessReference(exitedJestProcess);
                const jestProcessInWatchMode = this.run({
                    watch: true,
                    keepAlive: keepAlive,
                    exitCallback: exitCallback,
                });
                exitCallback(exitedJestProcess, jestProcessInWatchMode);
            });
        }
        else {
            return this.run({
                watch: watch,
                keepAlive: keepAlive,
                exitCallback: exitCallback,
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