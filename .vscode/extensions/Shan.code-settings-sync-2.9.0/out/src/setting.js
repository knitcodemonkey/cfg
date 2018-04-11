"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//"use strict";
const environmentPath_1 = require("./environmentPath");
class ExtensionConfig {
    constructor() {
        this.gist = null;
        this.lastUpload = null;
        this.autoDownload = false;
        this.autoUpload = false;
        this.lastDownload = null;
        this.forceDownload = false;
        this.host = null;
        this.pathPrefix = null;
        this.quietSync = false;
        this.askGistName = false;
        this.removeExtensions = true;
        this.syncExtensions = true;
    }
}
exports.ExtensionConfig = ExtensionConfig;
class LocalConfig {
    constructor() {
        this.publicGist = false;
        this.userName = null;
        this.name = null;
        this.extConfig = null;
        this.customConfig = null;
        this.extConfig = new ExtensionConfig();
        this.customConfig = new CustomSettings();
    }
}
exports.LocalConfig = LocalConfig;
class CloudSetting {
    constructor() {
        this.lastUpload = null;
        this.extensionVersion = null;
        this.extensionVersion = "v" + environmentPath_1.Environment.getVersion();
    }
}
exports.CloudSetting = CloudSetting;
class KeyValue {
    constructor(Key, Value) {
        this.Key = Key;
        this.Value = Value;
    }
}
exports.KeyValue = KeyValue;
class CustomSettings {
    constructor() {
        this.ignoreUploadFiles = null;
        this.ignoreUploadFolders = null;
        this.ignoreUploadSettings = null;
        this.replaceCodeSettings = null;
        this.gistDescription = null;
        this.version = 0;
        this.token = null;
        this.downloadPublicGist = null;
        this.supportedFileExtensions = null;
        this.ignoreUploadFiles = new Array();
        this.ignoreUploadFolders = new Array();
        this.replaceCodeSettings = new Object();
        this.ignoreUploadSettings = new Array();
        this.supportedFileExtensions = new Array();
        this.ignoreUploadFolders.push("workspaceStorage");
        this.ignoreUploadFiles.push("projects.json");
        this.ignoreUploadFiles.push("projects_cache_vscode.json");
        this.ignoreUploadFiles.push("projects_cache_git.json");
        this.ignoreUploadFiles.push("projects_cache_svn.json");
        this.ignoreUploadFiles.push("gpm_projects.json");
        this.ignoreUploadFiles.push("gpm-recentItems.json");
        this.gistDescription = "Visual Studio Code Settings Sync Gist";
        this.version = environmentPath_1.Environment.CURRENT_VERSION;
        this.supportedFileExtensions.push("json");
        this.supportedFileExtensions.push("code-snippets");
        this.token = "";
        this.downloadPublicGist = false;
    }
}
exports.CustomSettings = CustomSettings;
//# sourceMappingURL=setting.js.map