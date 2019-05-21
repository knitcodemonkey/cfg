"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class DebugConfigurationProvider {
    resolveDebugConfiguration(folder, debugConfiguration) {
        const settings = vscode.workspace.getConfiguration('firefox', folder ? folder.uri : null);
        const executable = this.getSetting(settings, 'executable');
        if (executable) {
            debugConfiguration.firefoxExecutable = executable;
        }
        const args = this.getSetting(settings, 'args');
        if (args) {
            debugConfiguration.firefoxArgs = args;
        }
        const profileDir = this.getSetting(settings, 'profileDir');
        if (profileDir) {
            debugConfiguration.profileDir = profileDir;
        }
        const profile = this.getSetting(settings, 'profile');
        if (profile) {
            debugConfiguration.profile = profile;
        }
        const keepProfileChanges = this.getSetting(settings, 'keepProfileChanges');
        if (keepProfileChanges !== undefined) {
            debugConfiguration.keepProfileChanges = keepProfileChanges;
        }
        return debugConfiguration;
    }
    getSetting(settings, key) {
        const values = settings.inspect(key);
        if (!values)
            return undefined;
        if (values.workspaceFolderValue !== undefined)
            return values.workspaceFolderValue;
        if (values.workspaceValue !== undefined)
            return values.workspaceValue;
        if (values.globalValue !== undefined)
            return values.globalValue;
        return undefined;
    }
}
exports.DebugConfigurationProvider = DebugConfigurationProvider;
//# sourceMappingURL=debugConfigurationProvider.js.map