'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const pluginService_1 = require("./service/pluginService");
const environmentPath_1 = require("./environmentPath");
const fileService_1 = require("./service/fileService");
const commons_1 = require("./commons");
const githubService_1 = require("./service/githubService");
const setting_1 = require("./setting");
const enums_1 = require("./enums");
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        var fs = require('fs');
        const lockfile = require('proper-lockfile');
        var en = new environmentPath_1.Environment(context);
        var common = new commons_1.default(en, context);
        let lockExist = yield fileService_1.FileService.FileExists(en.FILE_SYNC_LOCK);
        if (!lockExist) {
            fs.closeSync(fs.openSync(en.FILE_SYNC_LOCK, 'w'));
        }
        let locked = lockfile.checkSync(en.FILE_SYNC_LOCK);
        if (locked) {
            lockfile.unlockSync(en.FILE_SYNC_LOCK);
        }
        yield common.StartMigrationProcess();
        let startUpSetting = yield common.GetSettings();
        let startUpCustomSetting = yield common.GetCustomSettings();
        if (startUpSetting) {
            let tokenAvailable = (startUpCustomSetting.token != null) && (startUpCustomSetting.token != "");
            let gistAvailable = (startUpSetting.gist != null) && (startUpSetting.gist != "");
            if (gistAvailable == true && startUpSetting.autoDownload == true) {
                vscode.commands.executeCommand('extension.downloadSettings').then(suc => {
                    if (startUpSetting.autoUpload && tokenAvailable && gistAvailable) {
                        common.StartWatch();
                    }
                });
            }
            if (startUpSetting.autoUpload && tokenAvailable && gistAvailable) {
                common.StartWatch();
            }
        }
        var updateSettings = vscode.commands.registerCommand('extension.updateSettings', function () {
            return __awaiter(this, arguments, void 0, function* () {
                let args = arguments;
                let en = new environmentPath_1.Environment(context);
                let common = new commons_1.default(en, context);
                let myGi = null;
                let localConfig = new setting_1.LocalConfig();
                let allSettingFiles = new Array();
                let uploadedExtensions = new Array();
                let dateNow = new Date();
                common.CloseWatch();
                let ignoreSettings = new Object();
                try {
                    localConfig = yield common.InitalizeSettings(true, false);
                    localConfig.publicGist = false;
                    if (args.length > 0) {
                        if (args[0] == "publicGIST") {
                            localConfig.publicGist = true;
                        }
                    }
                    myGi = new githubService_1.GitHubService(localConfig.customConfig.token);
                    //ignoreSettings = await common.GetIgnoredSettings(localConfig.customConfig.ignoreUploadSettings);
                    yield startGitProcess(localConfig.extConfig, localConfig.customConfig);
                    //await common.SetIgnoredSettings(ignoreSettings);
                }
                catch (error) {
                    commons_1.default.LogException(error, common.ERROR_MESSAGE, true);
                    return;
                }
                function startGitProcess(syncSetting, customSettings) {
                    return __awaiter(this, void 0, void 0, function* () {
                        vscode.window.setStatusBarMessage("Sync : Uploading / Updating Your Settings In GitHub.", 2000);
                        if (customSettings.downloadPublicGist) {
                            if (customSettings.token == null || customSettings.token == "") {
                                vscode.window.showInformationMessage("Sync : Set GitHub Token or disable 'downloadPublicGist' from local Sync settings file.");
                                ;
                                return;
                            }
                        }
                        syncSetting.lastUpload = dateNow;
                        vscode.window.setStatusBarMessage("Sync : Reading Settings and Extensions.", 2000);
                        // var remoteList = ExtensionInformation.fromJSONList(file.content);
                        // var deletedList = PluginService.GetDeletedExtensions(uploadedExtensions);
                        if (syncSetting.syncExtensions) {
                            uploadedExtensions = pluginService_1.PluginService.CreateExtensionList();
                            uploadedExtensions.sort(function (a, b) {
                                return a.name.localeCompare(b.name);
                            });
                            let fileName = en.FILE_EXTENSION_NAME;
                            let filePath = en.FILE_EXTENSION;
                            let fileContent = JSON.stringify(uploadedExtensions, undefined, 2);
                            let file = new fileService_1.File(fileName, fileContent, filePath, fileName);
                            allSettingFiles.push(file);
                        }
                        let contentFiles = new Array();
                        contentFiles = yield fileService_1.FileService.ListFiles(en.USER_FOLDER, 0, 2, customSettings.supportedFileExtensions);
                        let customExist = yield fileService_1.FileService.FileExists(en.FILE_CUSTOMIZEDSETTINGS);
                        if (customExist) {
                            customSettings = yield common.GetCustomSettings();
                            contentFiles = contentFiles.filter((file, index) => {
                                let a = file.fileName != en.FILE_CUSTOMIZEDSETTINGS_NAME;
                                return a;
                            });
                            if (customSettings.ignoreUploadFiles.length > 0) {
                                contentFiles = contentFiles.filter((file, index) => {
                                    let a = customSettings.ignoreUploadFiles.indexOf(file.fileName) == -1 && file.fileName != en.FILE_CUSTOMIZEDSETTINGS_NAME;
                                    return a;
                                });
                            }
                            if (customSettings.ignoreUploadFolders.length > 0) {
                                contentFiles = contentFiles.filter((file, index) => {
                                    let matchedFolders = customSettings.ignoreUploadFolders.filter((folder) => {
                                        return file.filePath.indexOf(folder) == -1;
                                    });
                                    return matchedFolders.length > 0;
                                });
                            }
                        }
                        else {
                            commons_1.default.LogException(null, common.ERROR_MESSAGE, true);
                            return;
                        }
                        contentFiles.forEach(snippetFile => {
                            if (snippetFile.fileName != en.APP_SUMMARY_NAME && snippetFile.fileName != en.FILE_KEYBINDING_MAC) {
                                if (snippetFile.content != "") {
                                    if (snippetFile.fileName == en.FILE_KEYBINDING_NAME) {
                                        var destinationKeyBinding = "";
                                        if (en.OsType == enums_1.OsType.Mac) {
                                            destinationKeyBinding = en.FILE_KEYBINDING_MAC;
                                        }
                                        else {
                                            destinationKeyBinding = en.FILE_KEYBINDING_DEFAULT;
                                        }
                                        snippetFile.gistName = destinationKeyBinding;
                                    }
                                    allSettingFiles.push(snippetFile);
                                }
                            }
                        });
                        var extProp = new setting_1.CloudSetting();
                        extProp.lastUpload = dateNow;
                        var fileName = en.FILE_CLOUDSETTINGS_NAME;
                        var fileContent = JSON.stringify(extProp);
                        var file = new fileService_1.File(fileName, fileContent, "", fileName);
                        allSettingFiles.push(file);
                        let completed = false;
                        let newGIST = false;
                        if (syncSetting.gist == null || syncSetting.gist === "") {
                            if (syncSetting.askGistName) {
                                customSettings.gistDescription = yield common.AskGistName();
                            }
                            newGIST = true;
                            yield myGi.CreateEmptyGIST(localConfig.publicGist, customSettings.gistDescription).then(function (gistID) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    if (gistID) {
                                        syncSetting.gist = gistID;
                                        vscode.window.setStatusBarMessage("Sync : New gist created.", 2000);
                                    }
                                    else {
                                        vscode.window.showInformationMessage("Sync : Unable to create Gist.");
                                        return;
                                    }
                                });
                            }, function (error) {
                                commons_1.default.LogException(error, common.ERROR_MESSAGE, true);
                                return;
                            });
                        }
                        yield myGi.ReadGist(syncSetting.gist).then(function (gistObj) {
                            return __awaiter(this, void 0, void 0, function* () {
                                if (gistObj) {
                                    if (gistObj.data.owner != null) {
                                        let gistOwnerName = gistObj.data.owner.login.trim();
                                        if (myGi.userName != null) {
                                            let userName = myGi.userName.trim();
                                            if (gistOwnerName != userName) {
                                                commons_1.default.LogException(null, "Sync : You cant edit GIST for user : " + gistObj.data.owner.login, true, function () {
                                                    console.log("Sync : Current User : " + "'" + userName + "'");
                                                    console.log("Sync : Gist Owner User : " + "'" + gistOwnerName + "'");
                                                });
                                                return;
                                            }
                                        }
                                    }
                                    if (gistObj.public == true) {
                                        localConfig.publicGist = true;
                                    }
                                    vscode.window.setStatusBarMessage("Sync : Uploading Files Data.", 3000);
                                    gistObj = myGi.UpdateGIST(gistObj, allSettingFiles);
                                    yield myGi.SaveGIST(gistObj.data).then(function (saved) {
                                        return __awaiter(this, void 0, void 0, function* () {
                                            if (saved) {
                                                completed = true;
                                            }
                                            else {
                                                vscode.window.showErrorMessage("GIST NOT SAVED");
                                                return;
                                            }
                                        });
                                    }, function (error) {
                                        commons_1.default.LogException(error, common.ERROR_MESSAGE, true);
                                        return;
                                    });
                                }
                                else {
                                    vscode.window.showErrorMessage("GIST ID: " + syncSetting.gist + " UNABLE TO READ.");
                                    return;
                                }
                            });
                        }, function (gistReadError) {
                            commons_1.default.LogException(gistReadError, common.ERROR_MESSAGE, true);
                            return;
                        });
                        if (completed) {
                            yield common.SaveSettings(syncSetting).then(function (added) {
                                if (added) {
                                    if (newGIST) {
                                        vscode.window.showInformationMessage("Sync : Upload Complete." + " GIST ID :  " + syncSetting.gist + " . Please copy and use this ID in other machines to download settings.");
                                    }
                                    if (localConfig.publicGist) {
                                        vscode.window.showInformationMessage("Sync : Share the Id with other extension users to share the settings.");
                                    }
                                    if (!syncSetting.quietSync) {
                                        common.ShowSummmaryOutput(true, allSettingFiles, null, uploadedExtensions, localConfig);
                                        vscode.window.setStatusBarMessage("").dispose();
                                    }
                                    else {
                                        vscode.window.setStatusBarMessage("").dispose();
                                        vscode.window.setStatusBarMessage("Sync : Uploaded Successfully.", 5000);
                                    }
                                    if (syncSetting.autoUpload) {
                                        common.StartWatch();
                                    }
                                }
                            }, function (err) {
                                commons_1.default.LogException(err, common.ERROR_MESSAGE, true);
                                return;
                            });
                        }
                    });
                }
            });
        });
        var downloadSettings = vscode.commands.registerCommand('extension.downloadSettings', function () {
            return __awaiter(this, void 0, void 0, function* () {
                var en = new environmentPath_1.Environment(context);
                var common = new commons_1.default(en, context);
                var myGi = null;
                var localSettings = new setting_1.LocalConfig();
                let ignoreSettings = new Object();
                common.CloseWatch();
                try {
                    localSettings = yield common.InitalizeSettings(true, true);
                    //ignoreSettings = await common.GetIgnoredSettings(localSettings.customConfig.ignoreUploadSettings);
                    yield StartDownload(localSettings.extConfig, localSettings.customConfig);
                    //await common.SetIgnoredSettings(ignoreSettings);
                }
                catch (error) {
                    commons_1.default.LogException(error, common.ERROR_MESSAGE, true);
                    return;
                }
                function StartDownload(syncSetting, customSettings) {
                    return __awaiter(this, void 0, void 0, function* () {
                        myGi = new githubService_1.GitHubService(customSettings.token);
                        vscode.window.setStatusBarMessage("").dispose();
                        vscode.window.setStatusBarMessage("Sync : Reading Settings Online.", 2000);
                        myGi.ReadGist(syncSetting.gist).then(function (res) {
                            return __awaiter(this, void 0, void 0, function* () {
                                var addedExtensions = new Array();
                                var deletedExtensions = new Array();
                                var updatedFiles = new Array();
                                var actionList = new Array();
                                if (res) {
                                    if (res.data.public == true) {
                                        localSettings.publicGist = true;
                                    }
                                    var keys = Object.keys(res.data.files);
                                    if (keys.indexOf(en.FILE_CLOUDSETTINGS_NAME) > -1) {
                                        var cloudSettGist = JSON.parse(res.data.files[en.FILE_CLOUDSETTINGS_NAME].content);
                                        var cloudSett = Object.assign(new setting_1.CloudSetting(), cloudSettGist);
                                        ;
                                        let lastUploadStr = (syncSetting.lastUpload) ? syncSetting.lastUpload.toString() : "";
                                        let lastDownloadStr = (syncSetting.lastDownload) ? syncSetting.lastDownload.toString() : "";
                                        var upToDate = false;
                                        if (lastDownloadStr != "") {
                                            upToDate = new Date(lastDownloadStr).getTime() === new Date(cloudSett.lastUpload).getTime();
                                        }
                                        if (lastUploadStr != "") {
                                            upToDate = upToDate || new Date(lastUploadStr).getTime() === new Date(cloudSett.lastUpload).getTime();
                                        }
                                        if (!syncSetting.forceDownload) {
                                            if (upToDate) {
                                                vscode.window.setStatusBarMessage("").dispose();
                                                vscode.window.setStatusBarMessage("Sync : You already have latest version of saved settings.", 5000);
                                                return;
                                            }
                                        }
                                        syncSetting.lastDownload = cloudSett.lastUpload;
                                    }
                                    keys.forEach(gistName => {
                                        if (res.data.files[gistName]) {
                                            if (res.data.files[gistName].content) {
                                                if (gistName.indexOf(".") > -1) {
                                                    if (en.OsType == enums_1.OsType.Mac && gistName == en.FILE_KEYBINDING_DEFAULT) {
                                                        return;
                                                    }
                                                    if (en.OsType != enums_1.OsType.Mac && gistName == en.FILE_KEYBINDING_MAC) {
                                                        return;
                                                    }
                                                    var f = new fileService_1.File(gistName, res.data.files[gistName].content, null, gistName);
                                                    updatedFiles.push(f);
                                                }
                                            }
                                        }
                                        else {
                                            console.log(gistName + " key in response is empty.");
                                        }
                                    });
                                    for (var index = 0; index < updatedFiles.length; index++) {
                                        var file = updatedFiles[index];
                                        var path = null;
                                        var writeFile = false;
                                        var content = file.content;
                                        if (content != "") {
                                            if (file.gistName == en.FILE_EXTENSION_NAME) {
                                                if (syncSetting.syncExtensions) {
                                                    var extDelStatus = new Array();
                                                    if (syncSetting.removeExtensions) {
                                                        try {
                                                            deletedExtensions = yield pluginService_1.PluginService.DeleteExtensions(file.content, en.ExtensionFolder);
                                                        }
                                                        catch (uncompletedExtensions) {
                                                            vscode.window.showErrorMessage("Sync : Unable to remove some extensions.");
                                                            deletedExtensions = uncompletedExtensions;
                                                        }
                                                    }
                                                    try {
                                                        addedExtensions = yield pluginService_1.PluginService.InstallExtensions(file.content, en.ExtensionFolder, function (message, dispose) {
                                                            //TODO:
                                                            if (dispose) {
                                                                vscode.window.setStatusBarMessage(message, 2000);
                                                            }
                                                            else {
                                                                vscode.window.setStatusBarMessage(message, 5000);
                                                            }
                                                        });
                                                    }
                                                    catch (extensions) {
                                                        addedExtensions = extensions;
                                                    }
                                                }
                                            }
                                            else {
                                                writeFile = true;
                                                if (file.gistName == en.FILE_KEYBINDING_DEFAULT || file.gistName == en.FILE_KEYBINDING_MAC) {
                                                    let test = "";
                                                    en.OsType == enums_1.OsType.Mac ? test = en.FILE_KEYBINDING_MAC : test = en.FILE_KEYBINDING_DEFAULT;
                                                    if (file.gistName != test) {
                                                        writeFile = false;
                                                    }
                                                }
                                                if (writeFile) {
                                                    if (file.gistName == en.FILE_KEYBINDING_MAC) {
                                                        file.fileName = en.FILE_KEYBINDING_DEFAULT;
                                                    }
                                                    let filePath = yield fileService_1.FileService.CreateDirTree(en.USER_FOLDER, file.fileName);
                                                    yield actionList.push(fileService_1.FileService.WriteFile(filePath, content).then(function (added) {
                                                        //TODO : add Name attribute in File and show information message here with name , when required.
                                                    }, function (error) {
                                                        commons_1.default.LogException(error, common.ERROR_MESSAGE, true);
                                                        return;
                                                    }));
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    commons_1.default.LogException(res, "Sync : Unable to Read Gist.", true);
                                }
                                Promise.all(actionList)
                                    .then(function () {
                                    return __awaiter(this, void 0, void 0, function* () {
                                        // if (!syncSetting.showSummary) {
                                        //     if (missingList.length == 0) {
                                        //         //vscode.window.showInformationMessage("No extension need to be installed");
                                        //     }
                                        //     else {
                                        //         //extension message when summary is turned off
                                        //         vscode.window.showInformationMessage("Sync : " + missingList.length + " extensions installed Successfully, Restart Required.");
                                        //     }
                                        //     if (deletedExtensions.length > 0) {
                                        //         vscode.window.showInformationMessage("Sync : " + deletedExtensions.length + " extensions deleted Successfully, Restart Required.");
                                        //     }
                                        // }
                                        yield common.SaveSettings(syncSetting).then(function (added) {
                                            return __awaiter(this, void 0, void 0, function* () {
                                                if (added) {
                                                    if (!syncSetting.quietSync) {
                                                        common.ShowSummmaryOutput(false, updatedFiles, deletedExtensions, addedExtensions, localSettings);
                                                        vscode.window.setStatusBarMessage("").dispose();
                                                    }
                                                    else {
                                                        vscode.window.setStatusBarMessage("").dispose();
                                                        vscode.window.setStatusBarMessage("Sync : Download Complete.", 5000);
                                                    }
                                                    if (Object.keys(customSettings.replaceCodeSettings).length > 0) {
                                                        let config = vscode.workspace.getConfiguration();
                                                        let keysDefined = Object.keys(customSettings.replaceCodeSettings);
                                                        keysDefined.forEach((key, index) => {
                                                            let c = undefined;
                                                            let value = customSettings.replaceCodeSettings[key];
                                                            value == "" ? c == undefined : c = value;
                                                            config.update(key, c, true);
                                                        });
                                                    }
                                                    if (syncSetting.autoUpload) {
                                                        common.StartWatch();
                                                    }
                                                }
                                                else {
                                                    vscode.window.showErrorMessage("Sync : Unable to save extension settings file.");
                                                }
                                            });
                                        }, function (errSave) {
                                            commons_1.default.LogException(errSave, common.ERROR_MESSAGE, true);
                                            return;
                                        });
                                    });
                                })
                                    .catch(function (e) {
                                    commons_1.default.LogException(e, common.ERROR_MESSAGE, true);
                                });
                            });
                        }, function (err) {
                            commons_1.default.LogException(err, common.ERROR_MESSAGE, true);
                            return;
                        });
                    });
                }
            });
        });
        var resetSettings = vscode.commands.registerCommand('extension.resetSettings', () => __awaiter(this, void 0, void 0, function* () {
            var extSettings = null;
            var localSettings = null;
            yield Init();
            function Init() {
                return __awaiter(this, void 0, void 0, function* () {
                    vscode.window.setStatusBarMessage("Sync : Resetting Your Settings.", 2000);
                    try {
                        var en = new environmentPath_1.Environment(context);
                        var common = new commons_1.default(en, context);
                        extSettings = new setting_1.ExtensionConfig();
                        localSettings = new setting_1.CustomSettings();
                        let extSaved = yield common.SaveSettings(extSettings);
                        let customSaved = yield common.SetCustomSettings(localSettings);
                        let lockExist = yield fileService_1.FileService.FileExists(en.FILE_SYNC_LOCK);
                        if (!lockExist) {
                            fs.closeSync(fs.openSync(en.FILE_SYNC_LOCK, 'w'));
                        }
                        let locked = lockfile.checkSync(en.FILE_SYNC_LOCK);
                        if (locked) {
                            lockfile.unlockSync(en.FILE_SYNC_LOCK);
                        }
                        if (extSaved && customSaved) {
                            vscode.window.showInformationMessage("Sync : Settings Cleared.");
                        }
                    }
                    catch (err) {
                        commons_1.default.LogException(err, "Sync : Unable to clear settings. Error Logged on console. Please open an issue.", true);
                    }
                });
            }
        }));
        var howSettings = vscode.commands.registerCommand('extension.HowSettings', () => __awaiter(this, void 0, void 0, function* () {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('"http://shanalikhan.github.io/2015/12/15/Visual-Studio-Code-Sync-Settings.html'));
        }));
        var otherOptions = vscode.commands.registerCommand('extension.otherOptions', () => __awaiter(this, void 0, void 0, function* () {
            var en = new environmentPath_1.Environment(context);
            var common = new commons_1.default(en, context);
            var setting = yield common.GetSettings();
            let customSettings = yield common.GetCustomSettings();
            var localSetting = new setting_1.LocalConfig();
            var tokenAvailable = customSettings.token != null && customSettings.token != "";
            var gistAvailable = setting.gist != null && setting.gist != "";
            let items = new Array();
            items.push("Sync : Edit Extension Local Settings");
            items.push("Sync : Share Settings with Public GIST");
            items.push("Sync : Download Settings from Public GIST");
            items.push("Sync : Toggle Force Download");
            items.push("Sync : Toggle Auto-Upload On Settings Change");
            items.push("Sync : Toggle Auto-Download On Startup");
            items.push("Sync : Toggle Show Summary Page On Upload / Download");
            items.push("Sync : Preserve Setting To Stop Override After Download");
            items.push("Sync : Join Community");
            items.push("Sync : Open Issue");
            items.push("Sync : Release Notes");
            var selectedItem = 0;
            var settingChanged = false;
            vscode.window.showQuickPick(items).then((resolve) => __awaiter(this, void 0, void 0, function* () {
                switch (resolve) {
                    case items[0]: {
                        //extension local settings
                        var file = vscode.Uri.file(en.FILE_CUSTOMIZEDSETTINGS);
                        fs.openSync(file.fsPath, 'r');
                        yield vscode.workspace.openTextDocument(file).then((a) => {
                            vscode.window.showTextDocument(a, vscode.ViewColumn.One, true);
                        });
                        break;
                    }
                    case items[1]: {
                        //share public gist
                        yield vscode.window.showInformationMessage("Sync : This will remove current GIST and upload settings on new public GIST. Do you want to continue ?", "Yes").then((resolve) => __awaiter(this, void 0, void 0, function* () {
                            if (resolve == "Yes") {
                                localSetting.publicGist = true;
                                settingChanged = true;
                                setting.gist = "";
                                selectedItem = 1;
                                customSettings.downloadPublicGist = false;
                                let done = yield common.SetCustomSettings(customSettings);
                            }
                        }), (reject) => {
                            return;
                        });
                        break;
                    }
                    case items[2]: {
                        //Download Settings from Public GIST
                        selectedItem = 2;
                        customSettings.downloadPublicGist = true;
                        settingChanged = true;
                        let done = yield common.SetCustomSettings(customSettings);
                        break;
                    }
                    case items[3]: {
                        //toggle force download
                        selectedItem = 3;
                        settingChanged = true;
                        if (setting.forceDownload) {
                            setting.forceDownload = false;
                        }
                        else {
                            setting.forceDownload = true;
                        }
                        break;
                    }
                    case items[4]: {
                        //toggle auto upload
                        selectedItem = 4;
                        settingChanged = true;
                        if (setting.autoUpload) {
                            setting.autoUpload = false;
                        }
                        else {
                            setting.autoUpload = true;
                        }
                        break;
                    }
                    case items[5]: {
                        //auto downlaod on startup
                        selectedItem = 5;
                        settingChanged = true;
                        if (!setting) {
                            vscode.commands.executeCommand('extension.HowSettings');
                            return;
                        }
                        if (!gistAvailable) {
                            vscode.commands.executeCommand('extension.HowSettings');
                            return;
                        }
                        if (setting.autoDownload) {
                            setting.autoDownload = false;
                        }
                        else {
                            setting.autoDownload = true;
                        }
                        break;
                    }
                    case items[6]: {
                        //page summary toggle
                        selectedItem = 6;
                        settingChanged = true;
                        if (!tokenAvailable || !gistAvailable) {
                            vscode.commands.executeCommand('extension.HowSettings');
                            return;
                        }
                        if (setting.quietSync) {
                            setting.quietSync = false;
                        }
                        else {
                            setting.quietSync = true;
                        }
                        break;
                    }
                    case items[7]: {
                        //preserve
                        let options = {
                            ignoreFocusOut: true,
                            placeHolder: "Enter any Key from settings.json to preserve.",
                            prompt: "Example : Write 'http.proxy' => store this computer proxy and overwrite it , if set empty it will remove proxy."
                        };
                        vscode.window.showInputBox(options).then((res) => __awaiter(this, void 0, void 0, function* () {
                            if (res) {
                                let settingKey = res;
                                let a = vscode.workspace.getConfiguration();
                                let val = a.get(settingKey);
                                customSettings.replaceCodeSettings[res] = val;
                                let done = yield common.SetCustomSettings(customSettings);
                                if (done) {
                                    if (val == "") {
                                        vscode.window.showInformationMessage("Sync : Done. " + res + " value will be removed from settings.json after downloading.");
                                    }
                                    else {
                                        vscode.window.showInformationMessage("Sync : Done. Extension will keep " + res + " : " + val + " in setting.json after downloading.");
                                    }
                                }
                            }
                        }));
                        break;
                    }
                    case items[8]: {
                        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://join.slack.com/t/codesettingssync/shared_invite/enQtMzE3MjY5NTczNDMwLTYwMTIwNGExOGE2MTJkZWU0OTU5MmI3ZTc4N2JkZjhjMzY1OTk5OGExZjkwMDMzMDU4ZTBlYjk5MGQwZmMyNzk'));
                        break;
                    }
                    case items[9]: {
                        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://github.com/shanalikhan/code-settings-sync/issues/new'));
                        break;
                    }
                    case items[10]: {
                        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('http://shanalikhan.github.io/2016/05/14/Visual-studio-code-sync-settings-release-notes.html'));
                        break;
                    }
                    default: {
                        break;
                    }
                }
            }), (reject) => {
                commons_1.default.LogException(reject, "Error", true);
                return;
            }).then((resolve) => __awaiter(this, void 0, void 0, function* () {
                if (settingChanged) {
                    if (selectedItem == 1) {
                        common.CloseWatch();
                    }
                    yield common.SaveSettings(setting).then(function (added) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (added) {
                                switch (selectedItem) {
                                    case 5: {
                                        if (setting.autoDownload) {
                                            vscode.window.showInformationMessage("Sync : Auto Download turned ON upon VSCode Startup.");
                                        }
                                        else {
                                            vscode.window.showInformationMessage("Sync : Auto Download turned OFF upon VSCode Startup.");
                                        }
                                        break;
                                    }
                                    case 6: {
                                        if (!setting.quietSync) {
                                            vscode.window.showInformationMessage("Sync : Summary will be shown upon download / upload.");
                                        }
                                        else {
                                            vscode.window.showInformationMessage("Sync : Status bar will be updated upon download / upload.");
                                        }
                                        break;
                                    }
                                    case 3: {
                                        if (setting.forceDownload) {
                                            vscode.window.showInformationMessage("Sync : Force Download Turned On.");
                                        }
                                        else {
                                            vscode.window.showInformationMessage("Sync : Force Download Turned Off.");
                                        }
                                        break;
                                    }
                                    case 4: {
                                        if (setting.autoUpload) {
                                            vscode.window.showInformationMessage("Sync : Auto upload on Setting Change Turned On. Will be affected after restart.");
                                        }
                                        else {
                                            vscode.window.showInformationMessage("Sync : Auto upload on Setting Change Turned Off.");
                                        }
                                        break;
                                    }
                                    case 1: {
                                        yield vscode.commands.executeCommand('extension.updateSettings', "publicGIST");
                                        break;
                                    }
                                    case 2: {
                                        vscode.window.showInformationMessage("Sync : Settings Sync will not ask for GitHub Token from now on.");
                                    }
                                }
                            }
                            else {
                                vscode.window.showErrorMessage("Unable to Toggle.");
                            }
                        });
                    }, function (err) {
                        commons_1.default.LogException(err, "Sync : Unable to toggle. Please open an issue.", true);
                        return;
                    });
                }
            }), (reject) => {
                commons_1.default.LogException(reject, "Error", true);
                return;
            });
        }));
        context.subscriptions.push(updateSettings);
        context.subscriptions.push(downloadSettings);
        context.subscriptions.push(resetSettings);
        context.subscriptions.push(howSettings);
        context.subscriptions.push(otherOptions);
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map