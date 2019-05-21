'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/localizedConstants");
const connectionCredentials_1 = require("../models/connectionCredentials");
const connectionProfile_1 = require("../models/connectionProfile");
const interfaces_1 = require("../models/interfaces");
const question_1 = require("../prompts/question");
const utils_1 = require("../models/utils");
const Utils = require("../models/utils");
const vscodeWrapper_1 = require("../controllers/vscodeWrapper");
/**
 * The different tasks for managing connection profiles.
 */
var ManageProfileTask;
(function (ManageProfileTask) {
    ManageProfileTask[ManageProfileTask["Create"] = 1] = "Create";
    ManageProfileTask[ManageProfileTask["ClearRecentlyUsed"] = 2] = "ClearRecentlyUsed";
    ManageProfileTask[ManageProfileTask["Edit"] = 3] = "Edit";
    ManageProfileTask[ManageProfileTask["Remove"] = 4] = "Remove";
})(ManageProfileTask || (ManageProfileTask = {}));
class ConnectionUI {
    constructor(_connectionManager, _connectionStore, _prompter, _vscodeWrapper) {
        this._connectionManager = _connectionManager;
        this._connectionStore = _connectionStore;
        this._prompter = _prompter;
        this._vscodeWrapper = _vscodeWrapper;
        this._errorOutputChannel = vscode.window.createOutputChannel(LocalizedConstants.connectionErrorChannelName);
        if (!this.vscodeWrapper) {
            this.vscodeWrapper = new vscodeWrapper_1.default();
        }
    }
    get connectionManager() {
        return this._connectionManager;
    }
    /**
     * Exposed for testing purposes
     */
    get vscodeWrapper() {
        return this._vscodeWrapper;
    }
    /**
     * Exposed for testing purposes
     */
    set vscodeWrapper(wrapper) {
        this._vscodeWrapper = wrapper;
    }
    // Show connection errors in an output window
    showConnectionErrors(errorMessages) {
        this._errorOutputChannel.clear();
        this._errorOutputChannel.append(errorMessages);
        this._errorOutputChannel.show(true);
    }
    // Helper to let user choose a connection from a picklist
    // Return the ConnectionInfo for the user's choice
    showConnections() {
        const self = this;
        return new Promise((resolve, reject) => {
            let picklist = self._connectionStore.getPickListItems();
            if (picklist.length === 0) {
                // No connections - go to the create profile workflow
                self.createAndSaveProfile().then(resolvedProfile => {
                    resolve(resolvedProfile);
                });
            }
            else {
                // We have recent connections - show them in a picklist
                self.promptItemChoice({
                    placeHolder: LocalizedConstants.recentConnectionsPlaceholder,
                    matchOnDescription: true
                }, picklist)
                    .then(selection => {
                    if (selection) {
                        resolve(self.handleSelectedConnection(selection));
                    }
                    else {
                        resolve(undefined);
                    }
                });
            }
        });
    }
    promptLanguageFlavor() {
        const self = this;
        return new Promise((resolve, reject) => {
            let picklist = [
                {
                    label: LocalizedConstants.mssqlProviderName,
                    description: LocalizedConstants.flavorDescriptionMssql,
                    providerId: Constants.mssqlProviderName
                },
                {
                    label: LocalizedConstants.noneProviderName,
                    description: LocalizedConstants.flavorDescriptionNone,
                    providerId: Constants.noneProviderName
                }
            ];
            self.promptItemChoice({
                placeHolder: LocalizedConstants.flavorChooseLanguage,
                matchOnDescription: true
            }, picklist).then(selection => {
                if (selection) {
                    resolve(selection.providerId);
                }
                else {
                    resolve(undefined);
                }
            });
        });
    }
    // requests the user to choose an item from the list
    promptItemChoice(options, choices) {
        let question = {
            type: question_1.QuestionTypes.expand,
            name: 'question',
            message: options.placeHolder,
            matchOptions: options,
            choices: choices
        };
        return this._prompter.promptSingle(question);
    }
    /**
     * Helper for waitForLanguageModeToBeSql() method.
     */
    waitForLanguageModeToBeSqlHelper(resolve, timer) {
        if (timer.getDuration() > Constants.timeToWaitForLanguageModeChange) {
            resolve(false);
        }
        else if (this.vscodeWrapper.isEditingSqlFile) {
            resolve(true);
        }
        else {
            setTimeout(this.waitForLanguageModeToBeSqlHelper.bind(this, resolve, timer), 50);
        }
    }
    /**
     * Wait for up to 10 seconds for the language mode to change to SQL.
     */
    waitForLanguageModeToBeSql() {
        const self = this;
        return new Promise((resolve, reject) => {
            let timer = new utils_1.Timer();
            timer.start();
            self.waitForLanguageModeToBeSqlHelper(resolve, timer);
        });
    }
    /**
     * Prompt the user if they would like to cancel connecting.
     */
    promptToCancelConnection() {
        const self = this;
        return new Promise((resolve, reject) => {
            let question = {
                type: question_1.QuestionTypes.confirm,
                name: LocalizedConstants.msgPromptCancelConnect,
                message: LocalizedConstants.msgPromptCancelConnect
            };
            self._prompter.promptSingle(question).then(result => {
                resolve(result ? true : false);
            }).catch(err => {
                resolve(false);
            });
        });
    }
    /**
     * Prompt the user to change language mode to SQL.
     * @returns resolves to true if the user changed the language mode to SQL.
     */
    promptToChangeLanguageMode() {
        const self = this;
        return new Promise((resolve, reject) => {
            let question = {
                type: question_1.QuestionTypes.confirm,
                name: LocalizedConstants.msgChangeLanguageMode,
                message: LocalizedConstants.msgChangeLanguageMode
            };
            self._prompter.promptSingle(question).then(value => {
                if (value) {
                    vscode.commands.executeCommand('workbench.action.editor.changeLanguageMode').then(() => {
                        self.waitForLanguageModeToBeSql().then(result => {
                            resolve(result);
                        });
                    });
                }
                else {
                    resolve(false);
                }
            }).catch(err => {
                resolve(false);
            });
        });
    }
    // Helper to let the user choose a database on the current server
    showDatabasesOnCurrentServer(currentCredentials, databaseNames) {
        const self = this;
        return new Promise((resolve, reject) => {
            const pickListItems = databaseNames.map(name => {
                let newCredentials = {};
                Object.assign(newCredentials, currentCredentials);
                if (newCredentials['profileName']) {
                    delete newCredentials['profileName'];
                }
                newCredentials.database = name;
                return {
                    label: name,
                    description: '',
                    detail: '',
                    connectionCreds: newCredentials,
                    quickPickItemType: interfaces_1.CredentialsQuickPickItemType.Mru
                };
            });
            // Add an option to disconnect from the current server
            const disconnectItem = {
                label: LocalizedConstants.disconnectOptionLabel,
                description: LocalizedConstants.disconnectOptionDescription
            };
            pickListItems.push(disconnectItem);
            const pickListOptions = {
                placeHolder: LocalizedConstants.msgChooseDatabasePlaceholder
            };
            // show database picklist, and modify the current connection to switch the active database
            self.vscodeWrapper.showQuickPick(pickListItems, pickListOptions).then(selection => {
                if (selection === disconnectItem) {
                    self.handleDisconnectChoice().then(() => resolve(undefined), err => reject(err));
                }
                else if (typeof selection !== 'undefined') {
                    resolve(selection.connectionCreds);
                }
                else {
                    resolve(undefined);
                }
            });
        });
    }
    handleDisconnectChoice() {
        const self = this;
        return new Promise((resolve, reject) => {
            let question = {
                type: question_1.QuestionTypes.confirm,
                name: LocalizedConstants.disconnectConfirmationMsg,
                message: LocalizedConstants.disconnectConfirmationMsg
            };
            self._prompter.promptSingle(question).then(result => {
                if (result === true) {
                    self.connectionManager.onDisconnect().then(() => resolve(), err => reject(err));
                }
                else {
                    resolve();
                }
            }, err => reject(err));
        });
    }
    createProfileWithDifferentCredentials(connection) {
        return new Promise((resolve, reject) => {
            this.promptForRetryConnectWithDifferentCredentials().then(result => {
                if (result) {
                    let connectionWithoutCredentials = Object.assign({}, connection, { user: '', password: '', emptyPasswordInput: false });
                    connectionCredentials_1.ConnectionCredentials.ensureRequiredPropertiesSet(connectionWithoutCredentials, // connection profile
                    true, // isProfile
                    false, // isPasswordRequired
                    true, // wasPasswordEmptyInConfigFile
                    this._prompter, this._connectionStore, connection).then(connectionResult => {
                        resolve(connectionResult);
                    }, error => {
                        reject(error);
                    });
                }
                else {
                    resolve(undefined);
                }
            });
        });
    }
    handleSelectedConnection(selection) {
        const self = this;
        return new Promise((resolve, reject) => {
            if (selection !== undefined) {
                let connectFunc;
                if (selection.quickPickItemType === interfaces_1.CredentialsQuickPickItemType.NewConnection) {
                    // call the workflow to create a new connection
                    connectFunc = self.createAndSaveProfile();
                }
                else {
                    // user chose a connection from picklist. Prompt for mandatory info that's missing (e.g. username and/or password)
                    connectFunc = self.fillOrPromptForMissingInfo(selection);
                }
                connectFunc.then((resolvedConnectionCreds) => {
                    if (!resolvedConnectionCreds) {
                        resolve(undefined);
                    }
                    resolve(resolvedConnectionCreds);
                }, err => reject(err));
            }
            else {
                resolve(undefined);
            }
        });
    }
    promptToClearRecentConnectionsList() {
        const self = this;
        return new Promise((resolve, reject) => {
            let question = {
                type: question_1.QuestionTypes.confirm,
                name: LocalizedConstants.msgPromptClearRecentConnections,
                message: LocalizedConstants.msgPromptClearRecentConnections
            };
            self._prompter.promptSingle(question).then(result => {
                resolve(result ? true : false);
            }).catch(err => {
                resolve(false);
            });
        });
    }
    promptToManageProfiles() {
        const self = this;
        return new Promise((resolve, reject) => {
            // Create profile, clear recent connections, edit profiles, or remove profile?
            let choices = [
                { name: LocalizedConstants.CreateProfileLabel, value: ManageProfileTask.Create },
                { name: LocalizedConstants.ClearRecentlyUsedLabel, value: ManageProfileTask.ClearRecentlyUsed },
                { name: LocalizedConstants.EditProfilesLabel, value: ManageProfileTask.Edit },
                { name: LocalizedConstants.RemoveProfileLabel, value: ManageProfileTask.Remove }
            ];
            let question = {
                type: question_1.QuestionTypes.expand,
                name: LocalizedConstants.ManageProfilesPrompt,
                message: LocalizedConstants.ManageProfilesPrompt,
                choices: choices,
                onAnswered: (value) => {
                    switch (value) {
                        case ManageProfileTask.Create:
                            self.connectionManager.onCreateProfile().then(result => {
                                resolve(result);
                            });
                            break;
                        case ManageProfileTask.ClearRecentlyUsed:
                            self.promptToClearRecentConnectionsList().then(result => {
                                if (result) {
                                    self.connectionManager.clearRecentConnectionsList().then(() => {
                                        self.vscodeWrapper.showInformationMessage(LocalizedConstants.msgClearedRecentConnections);
                                        resolve(true);
                                    });
                                }
                                else {
                                    resolve(false);
                                }
                            });
                            break;
                        case ManageProfileTask.Edit:
                            self.vscodeWrapper.executeCommand('workbench.action.openGlobalSettings').then(() => {
                                resolve(true);
                            });
                            break;
                        case ManageProfileTask.Remove:
                            self.connectionManager.onRemoveProfile().then(result => {
                                resolve(result);
                            });
                            break;
                        default:
                            resolve(false);
                            break;
                    }
                }
            };
            this._prompter.promptSingle(question);
        });
    }
    /**
     * Calls the create profile workflow
     * @param validate whether the profile should be connected to and validated before saving
     * @returns undefined if profile creation failed
     */
    createAndSaveProfile(validate = true) {
        let self = this;
        return self.promptForCreateProfile()
            .then(profile => {
            if (profile) {
                if (validate) {
                    // Validate the profile before saving
                    return self.validateAndSaveProfile(profile);
                }
                else {
                    // Save the profile without validation
                    return self.saveProfile(profile);
                }
            }
            return undefined;
        }).then(savedProfile => {
            if (savedProfile) {
                if (validate) {
                    self.vscodeWrapper.showInformationMessage(LocalizedConstants.msgProfileCreatedAndConnected);
                }
                else {
                    self.vscodeWrapper.showInformationMessage(LocalizedConstants.msgProfileCreated);
                }
            }
            return savedProfile;
        });
    }
    /**
     * Validate a connection profile by connecting to it, and save it if we are successful.
     */
    validateAndSaveProfile(profile) {
        const self = this;
        return self.connectionManager.connect(self.vscodeWrapper.activeTextEditorUri, profile).then(result => {
            if (result) {
                // Success! save it
                return self.saveProfile(profile);
            }
            else {
                // Error! let the user try again, prefilling values that they already entered
                return self.promptForRetryCreateProfile(profile).then(updatedProfile => {
                    if (updatedProfile) {
                        return self.validateAndSaveProfile(updatedProfile);
                    }
                    else {
                        return undefined;
                    }
                });
            }
        });
    }
    /**
     * Save a connection profile using the connection store.
     */
    saveProfile(profile) {
        return this._connectionStore.saveProfile(profile);
    }
    promptForCreateProfile() {
        return connectionProfile_1.ConnectionProfile.createProfile(this._prompter);
    }
    promptForRetryCreateProfile(profile) {
        // Ask if the user would like to fix the profile
        return this._vscodeWrapper.showErrorMessage(LocalizedConstants.msgPromptRetryCreateProfile, LocalizedConstants.retryLabel).then(result => {
            if (result === LocalizedConstants.retryLabel) {
                return connectionProfile_1.ConnectionProfile.createProfile(this._prompter, profile);
            }
            else {
                return undefined;
            }
        });
    }
    promptForRetryConnectWithDifferentCredentials() {
        // Ask if the user would like to fix the profile
        return this._vscodeWrapper.showErrorMessage(LocalizedConstants.msgPromptRetryConnectionDifferentCredentials, LocalizedConstants.retryLabel).then(result => {
            if (result === LocalizedConstants.retryLabel) {
                return true;
            }
            else {
                return false;
            }
        });
    }
    fillOrPromptForMissingInfo(selection) {
        // If a connection string is present, don't prompt for any other info
        if (selection.connectionCreds.connectionString) {
            return new Promise((resolve, reject) => {
                resolve(selection.connectionCreds);
            });
        }
        const passwordEmptyInConfigFile = Utils.isEmpty(selection.connectionCreds.password);
        return this._connectionStore.addSavedPassword(selection)
            .then(sel => {
            return connectionCredentials_1.ConnectionCredentials.ensureRequiredPropertiesSet(sel.connectionCreds, selection.quickPickItemType === interfaces_1.CredentialsQuickPickItemType.Profile, false, passwordEmptyInConfigFile, this._prompter, this._connectionStore);
        });
    }
    // Prompts the user to pick a profile for removal, then removes from the global saved state
    removeProfile() {
        let self = this;
        // Flow: Select profile to remove, confirm removal, remove, notify
        let profiles = self._connectionStore.getProfilePickListItems(false);
        return self.selectProfileForRemoval(profiles)
            .then(profile => {
            if (profile) {
                return self._connectionStore.removeProfile(profile);
            }
            return false;
        }).then(result => {
            if (result) {
                // TODO again consider moving information prompts to the prompt package
                vscode.window.showInformationMessage(LocalizedConstants.msgProfileRemoved);
            }
            return result;
        });
    }
    selectProfileForRemoval(profiles) {
        let self = this;
        if (!profiles || profiles.length === 0) {
            // Inform the user we have no profiles available for deletion
            // TODO: consider moving to prompter if we separate all UI logic from workflows in the future
            vscode.window.showErrorMessage(LocalizedConstants.msgNoProfilesSaved);
            return Promise.resolve(undefined);
        }
        let chooseProfile = 'ChooseProfile';
        let confirm = 'ConfirmRemoval';
        let questions = [
            {
                // 1: what profile should we remove?
                type: question_1.QuestionTypes.expand,
                name: chooseProfile,
                message: LocalizedConstants.msgSelectProfileToRemove,
                matchOptions: { matchOnDescription: true },
                choices: profiles
            },
            {
                // 2: Confirm removal before proceeding
                type: question_1.QuestionTypes.confirm,
                name: confirm,
                message: LocalizedConstants.confirmRemoveProfilePrompt
            }
        ];
        // Prompt and return the value if the user confirmed
        return self._prompter.prompt(questions).then(answers => {
            if (answers && answers[confirm]) {
                let profilePickItem = answers[chooseProfile];
                return profilePickItem.connectionCreds;
            }
            else {
                return undefined;
            }
        });
    }
}
exports.ConnectionUI = ConnectionUI;

//# sourceMappingURL=connectionUI.js.map
