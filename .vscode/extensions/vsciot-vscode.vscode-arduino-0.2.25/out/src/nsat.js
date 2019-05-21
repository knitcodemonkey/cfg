// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
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
const compareVersions = require("compare-versions");
const vscode_1 = require("vscode");
const Logger = require("./logger/logger");
const IS_MUST_CANDIDATE_VERSION = false;
const NSAT_SURVEY_URL = "https://www.surveymonkey.com/r/CC2GVRC";
const PROBABILITY = 0.5;
const SESSION_COUNT_THRESHOLD = 5;
const SESSION_COUNT_KEY = "nsat/sessionCount";
const LAST_SESSION_DATE_KEY = "nsat/lastSessionDate";
const TAKE_SURVEY_DATE_KEY = "nsat/takeSurveyDate";
const CANDIDATED_VERSION_KEY = "nsat/candidatedVersion";
const EXTENSION_ID = "vsciot-vscode.vscode-arduino";
class NSAT {
    static takeSurvey({ globalState }) {
        return __awaiter(this, void 0, void 0, function* () {
            const extension = vscode_1.extensions.getExtension(EXTENSION_ID);
            if (!extension) {
                return;
            }
            const today = new Date().toDateString();
            const epoch = new Date(0).toDateString();
            const extensionVersion = extension.packageJSON.version;
            const candidatedVersion = globalState.get(CANDIDATED_VERSION_KEY);
            if (candidatedVersion && candidatedVersion !== "remindmelater") {
                if (candidatedVersion === "*" || !IS_MUST_CANDIDATE_VERSION || compareVersions(extensionVersion, candidatedVersion) <= 0) {
                    return;
                }
                globalState.update(LAST_SESSION_DATE_KEY, today);
            }
            const lastSessionDate = globalState.get(LAST_SESSION_DATE_KEY, epoch);
            if (today === lastSessionDate) {
                return;
            }
            const sessionCount = globalState.get(SESSION_COUNT_KEY, 0) + 1;
            yield globalState.update(LAST_SESSION_DATE_KEY, today);
            yield globalState.update(SESSION_COUNT_KEY, sessionCount);
            if (sessionCount < SESSION_COUNT_THRESHOLD || (candidatedVersion !== "remindmelater" && Math.random() > PROBABILITY)) {
                return;
            }
            const take = {
                title: "Take Survey",
                run: () => __awaiter(this, void 0, void 0, function* () {
                    Logger.traceUserData("nsat.survey/takeShortSurvey");
                    vscode_1.commands.executeCommand("vscode.open", vscode_1.Uri.parse(`${NSAT_SURVEY_URL}?o=${encodeURIComponent(process.platform)}&v=${encodeURIComponent(extensionVersion)}`));
                    yield globalState.update(CANDIDATED_VERSION_KEY, extensionVersion);
                    yield globalState.update(TAKE_SURVEY_DATE_KEY, today);
                    yield globalState.update(SESSION_COUNT_KEY, 0);
                }),
            };
            const remind = {
                title: "Remind Me Later",
                run: () => __awaiter(this, void 0, void 0, function* () {
                    Logger.traceUserData("nsat.survey/remindMeLater");
                    yield globalState.update(CANDIDATED_VERSION_KEY, "remindmelater");
                    yield globalState.update(SESSION_COUNT_KEY, 0);
                }),
            };
            const never = {
                title: "Don't Show Again",
                run: () => __awaiter(this, void 0, void 0, function* () {
                    Logger.traceUserData("nsat.survey/dontShowAgain");
                    yield globalState.update(CANDIDATED_VERSION_KEY, "*");
                }),
            };
            Logger.traceUserData("nsat.survey/userAsked");
            const button = yield vscode_1.window.showInformationMessage("Do you mind taking a quick feedback survey about the Arduino Extension for VS Code?", take, remind, never);
            yield (button || remind).run();
        });
    }
}
exports.NSAT = NSAT;

//# sourceMappingURL=nsat.js.map
