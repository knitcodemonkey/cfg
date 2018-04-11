"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const jest_editor_support_1 = require("jest-editor-support");
class JestProcess {
    constructor({ projectWorkspace, watchMode = false, keepAlive = false, }) {
        this.keepAlive = keepAlive;
        this.watchMode = watchMode;
        this.projectWorkspace = projectWorkspace;
        this.keepAliveCounter = keepAlive ? JestProcess.keepAliveLimit : 1;
        this.jestSupportEvents = new Map();
        this.startRunner();
    }
    startRunner() {
        this.stopRequested = false;
        let exited = false;
        // Use a shell to run Jest command on Windows in order to correctly spawn `.cmd` files
        // For details see https://github.com/jest-community/vscode-jest/issues/98
        const useShell = os_1.platform() === 'win32';
        this.runner = new jest_editor_support_1.Runner(this.projectWorkspace, { shell: useShell });
        this.restoreJestEvents();
        this.runner.start(this.watchMode);
        this.runner.on('debuggerProcessExit', () => {
            if (!exited) {
                exited = true;
                if (--this.keepAliveCounter > 0) {
                    this.runner.removeAllListeners();
                    this.startRunner();
                }
                else if (this.onExitCallback) {
                    this.onExitCallback(this);
                    if (this.stopRequested) {
                        this.resolve();
                    }
                }
            }
        });
    }
    restoreJestEvents() {
        for (const [event, callback] of this.jestSupportEvents.entries()) {
            this.runner.on(event, callback);
        }
    }
    onExit(callback) {
        this.onExitCallback = callback;
    }
    onJestEditorSupportEvent(event, callback) {
        this.jestSupportEvents.set(event, callback);
        this.runner.on(event, callback);
        return this;
    }
    stop() {
        this.stopRequested = true;
        this.keepAliveCounter = 1;
        this.jestSupportEvents.clear();
        this.runner.closeProcess();
        return new Promise(resolve => {
            this.resolve = resolve;
        });
    }
    runJestWithUpdateForSnapshots(callback) {
        this.runner.runJestWithUpdateForSnapshots(callback);
    }
}
JestProcess.keepAliveLimit = 5;
exports.JestProcess = JestProcess;
//# sourceMappingURL=JestProcess.js.map