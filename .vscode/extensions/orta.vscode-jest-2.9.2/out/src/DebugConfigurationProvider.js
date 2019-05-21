"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
class DebugConfigurationProvider {
    constructor() {
        this.fileNameToRun = '';
        this.testToRun = '';
    }
    /**
     * Prepares injecting the name of the test, which has to be debugged, into the `DebugConfiguration`,
     * This function has to be called before `vscode.debug.startDebugging`.
     */
    prepareTestRun(fileNameToRun, testToRun) {
        this.fileNameToRun = fileNameToRun;
        this.testToRun = testToRun;
    }
    resolveDebugConfiguration(_folder, debugConfiguration, _token) {
        if (debugConfiguration.name !== 'vscode-jest-tests') {
            return debugConfiguration;
        }
        if (!debugConfiguration.env) {
            debugConfiguration.env = {};
        }
        // necessary for running CRA test scripts in non-watch mode
        debugConfiguration.env.CI = 'vscode-jest-tests';
        if (!debugConfiguration.args) {
            debugConfiguration.args = [];
        }
        if (this.fileNameToRun) {
            debugConfiguration.args.push(this.fileNameToRun);
            if (this.testToRun) {
                debugConfiguration.args.push('--testNamePattern');
                debugConfiguration.args.push(this.testToRun);
            }
            this.fileNameToRun = '';
            this.testToRun = '';
        }
        return debugConfiguration;
    }
    provideDebugConfigurations(folder, _token) {
        // default jest config according to:
        // https://github.com/Microsoft/vscode-recipes/tree/master/debugging-jest-tests#configure-launchjson-file-for-your-test-framework
        // create-react-app config according to:
        // https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#debugging-tests-in-visual-studio-code
        const debugConfiguration = {
            type: 'node',
            name: 'vscode-jest-tests',
            request: 'launch',
            args: ['--runInBand'],
            cwd: '${workspaceFolder}',
            console: 'integratedTerminal',
            internalConsoleOptions: 'neverOpen',
        };
        const testCommand = folder && helpers_1.getTestCommand(folder.uri.fsPath);
        if (helpers_1.isCreateReactAppTestCommand(testCommand)) {
            const craCommand = testCommand.split(' ');
            // Settings specific for projects bootstrapped with `create-react-app`
            debugConfiguration.runtimeExecutable = '${workspaceFolder}/node_modules/.bin/' + craCommand.shift();
            debugConfiguration.args = [...craCommand, ...debugConfiguration.args];
            debugConfiguration.protocol = 'inspector';
        }
        else {
            // Plain jest setup
            debugConfiguration.program = '${workspaceFolder}/node_modules/jest/bin/jest';
        }
        return [debugConfiguration];
    }
}
exports.DebugConfigurationProvider = DebugConfigurationProvider;
//# sourceMappingURL=DebugConfigurationProvider.js.map