// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
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
const vscode_1 = require("vscode");
const constants_1 = require("./constants");
const telemetry_1 = require("./telemetry");
const NSAT_SURVEY_URL = 'https://www.surveymonkey.com/r/C2928RZ';
const PROBABILITY = 1;
const SESSION_COUNT_THRESHOLD = 2;
const SESSION_COUNT_KEY = 'nsat/sessionCount';
const LAST_SESSION_DATE_KEY = 'nsat/lastSessionDate';
const TAKE_SURVEY_DATE_KEY = 'nsat/takeSurveyDate';
const DONT_SHOW_DATE_KEY = 'nsat/dontShowDate';
const SKIP_VERSION_KEY = 'nsat/skipVersion';
const IS_CANDIDATE_KEY = 'nsat/isCandidate';
class NSAT {
    static takeSurvey({ globalState }) {
        return __awaiter(this, void 0, void 0, function* () {
            const skipVersion = globalState.get(SKIP_VERSION_KEY, '');
            if (skipVersion) {
                return;
            }
            const date = new Date().toDateString();
            const lastSessionDate = globalState.get(LAST_SESSION_DATE_KEY, new Date(0).toDateString());
            if (date === lastSessionDate) {
                return;
            }
            const sessionCount = globalState.get(SESSION_COUNT_KEY, 0) + 1;
            yield globalState.update(LAST_SESSION_DATE_KEY, date);
            yield globalState.update(SESSION_COUNT_KEY, sessionCount);
            if (sessionCount < SESSION_COUNT_THRESHOLD) {
                return;
            }
            const isCandidate = globalState.get(IS_CANDIDATE_KEY, false) ||
                Math.random() <= PROBABILITY;
            yield globalState.update(IS_CANDIDATE_KEY, isCandidate);
            const properties = {
                result: 'Succeeded',
                error: '',
                errorMessage: ''
            };
            const telemetryContext = { properties, measurements: { duration: 0 } };
            const extension = vscode_1.extensions.getExtension(constants_1.GlobalConstants.extensionId);
            if (!extension) {
                return;
            }
            const extensionVersion = extension.packageJSON.version || 'unknown';
            if (!isCandidate) {
                yield globalState.update(SKIP_VERSION_KEY, extensionVersion);
                return;
            }
            const take = {
                title: 'Take Survey',
                run: () => __awaiter(this, void 0, void 0, function* () {
                    telemetryContext.properties.message = 'nsat.survey/takeShortSurvey';
                    telemetry_1.TelemetryWorker.sendEvent(constants_1.EventNames.nsatsurvery, telemetryContext);
                    vscode_1.commands.executeCommand('vscode.open', vscode_1.Uri.parse(`${NSAT_SURVEY_URL}?o=${encodeURIComponent(process.platform)}&v=${encodeURIComponent(extensionVersion)}`));
                    yield globalState.update(IS_CANDIDATE_KEY, false);
                    yield globalState.update(SKIP_VERSION_KEY, extensionVersion);
                    yield globalState.update(TAKE_SURVEY_DATE_KEY, date);
                }),
            };
            const remind = {
                title: 'Remind Me Later',
                run: () => __awaiter(this, void 0, void 0, function* () {
                    telemetryContext.properties.message = 'nsat.survey/remindMeLater';
                    telemetry_1.TelemetryWorker.sendEvent(constants_1.EventNames.nsatsurvery, telemetryContext);
                    yield globalState.update(SESSION_COUNT_KEY, 0);
                }),
            };
            const never = {
                title: 'Don\'t Show Again',
                run: () => __awaiter(this, void 0, void 0, function* () {
                    telemetryContext.properties.message = 'nsat.survey/dontShowAgain';
                    telemetry_1.TelemetryWorker.sendEvent(constants_1.EventNames.nsatsurvery, telemetryContext);
                    yield globalState.update(IS_CANDIDATE_KEY, false);
                    yield globalState.update(SKIP_VERSION_KEY, extensionVersion);
                    yield globalState.update(DONT_SHOW_DATE_KEY, date);
                }),
            };
            telemetryContext.properties.message = 'nsat.survey/userAsked';
            telemetry_1.TelemetryWorker.sendEvent(constants_1.EventNames.nsatsurvery, telemetryContext);
            const button = yield vscode_1.window.showInformationMessage('Do you mind taking a quick feedback survey about the Azure IoT Device Workbench Extension for VS Code?', take, remind, never);
            yield (button || remind).run();
        });
    }
}
exports.NSAT = NSAT;
//# sourceMappingURL=nsat.js.map