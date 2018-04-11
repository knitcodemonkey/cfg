"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const enums_1 = require("./enums");
const fs = require("fs");
class Environment {
    constructor(context) {
        this.isInsiders = null;
        this.homeDir = null;
        this.USER_FOLDER = null;
        this.ExtensionFolder = null;
        this.PATH = null;
        this.OsType = null;
        this.FILE_SETTING = null;
        this.FILE_LAUNCH = null;
        this.FILE_KEYBINDING = null;
        this.FILE_LOCALE = null;
        this.FILE_EXTENSION = null;
        this.FILE_CLOUDSETTINGS = null;
        this.FILE_SYNC_LOCK = null;
        this.FILE_CUSTOMIZEDSETTINGS_NAME = "syncLocalSettings.json";
        this.FILE_CUSTOMIZEDSETTINGS = null;
        this.FILE_SETTING_NAME = "settings.json";
        this.FILE_LAUNCH_NAME = "launch.json";
        this.FILE_KEYBINDING_NAME = "keybindings.json";
        this.FILE_KEYBINDING_MAC = "keybindingsMac.json";
        this.FILE_KEYBINDING_DEFAULT = "keybindings.json";
        this.FILE_EXTENSION_NAME = "extensions.json";
        this.FILE_LOCALE_NAME = "locale.json";
        this.FILE_SYNC_LOCK_NAME = "sync.lock";
        this.FILE_CLOUDSETTINGS_NAME = "cloudSettings";
        this.FOLDER_SNIPPETS = null;
        this.APP_SUMMARY_NAME = "syncSummary.txt";
        this.APP_SUMMARY = null;
        this.context = context;
        this.isInsiders = /insiders/.test(context.asAbsolutePath(""));
        this.homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
        this.ExtensionFolder = path.join(this.homeDir, this.isInsiders ? '.vscode-insiders' : '.vscode', 'extensions');
        var os = require("os");
        //console.log(os.type());
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        this.PATH = process.env.APPDATA;
        this.OsType = enums_1.OsType.Windows;
        if (!this.PATH) {
            if (process.platform == 'darwin') {
                this.PATH = process.env.HOME + '/Library/Application Support';
                this.OsType = enums_1.OsType.Mac;
            }
            else if (process.platform == 'linux') {
                var os = require("os");
                this.PATH = os.homedir() + '/.config';
                this.OsType = enums_1.OsType.Linux;
            }
            else {
                this.PATH = '/var/local';
                this.OsType = enums_1.OsType.Linux;
            }
        }
        if (this.OsType == enums_1.OsType.Linux) {
            let myExt = "chmod +x " + this.ExtensionFolder + "/Shan.code-settings-sync-" + Environment.getVersion() + "/node_modules/opn/xdg-open";
            var exec = require('child_process').exec;
            exec(myExt, function (error, stdout, stderr) {
                //debugger;
                // command output is in stdout
            });
        }
        const possibleCodePaths = [this.isInsiders ? '/Code - Insiders' : '/Code', '/Code - OSS'];
        for (const _path of possibleCodePaths) {
            try {
                fs.statSync(this.PATH + _path);
                this.PATH = this.PATH + _path;
                break;
            }
            catch (e) {
                console.error("Error :" + _path);
                console.error(e);
            }
        }
        this.USER_FOLDER = this.PATH.concat("/User/");
        this.FILE_EXTENSION = this.PATH.concat("/User/", this.FILE_EXTENSION_NAME);
        this.FILE_SETTING = this.PATH.concat("/User/", this.FILE_SETTING_NAME);
        this.FILE_LAUNCH = this.PATH.concat("/User/", this.FILE_LAUNCH_NAME);
        this.FILE_KEYBINDING = this.PATH.concat("/User/", this.FILE_KEYBINDING_NAME);
        this.FILE_LOCALE = this.PATH.concat("/User/", this.FILE_LOCALE_NAME);
        this.FOLDER_SNIPPETS = this.PATH.concat("/User/snippets/");
        this.APP_SUMMARY = this.PATH.concat("/User/", this.APP_SUMMARY_NAME);
        this.FILE_CLOUDSETTINGS = this.PATH.concat("/User/", this.FILE_CLOUDSETTINGS_NAME);
        this.FILE_CUSTOMIZEDSETTINGS = this.PATH.concat("/User/", this.FILE_CUSTOMIZEDSETTINGS_NAME);
        this.FILE_SYNC_LOCK = this.PATH.concat("/User/", this.FILE_SYNC_LOCK_NAME);
    }
    static getVersion() {
        var txt2 = Environment.CURRENT_VERSION.toString().slice(0, 1) + "." + Environment.CURRENT_VERSION.toString().slice(1, 2) + "." + Environment.CURRENT_VERSION.toString().slice(2, 3);
        return txt2;
    }
}
Environment.CURRENT_VERSION = 290;
exports.Environment = Environment;
//# sourceMappingURL=environmentPath.js.map