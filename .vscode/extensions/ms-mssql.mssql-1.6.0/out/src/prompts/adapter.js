'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// This code is originally from https://github.com/DonJayamanne/bowerVSCode
// License: https://github.com/DonJayamanne/bowerVSCode/blob/master/LICENSE
const vscode_1 = require("vscode");
const Constants = require("../constants/constants");
const nodeUtil = require("util");
const factory_1 = require("./factory");
const EscapeException_1 = require("../utils/EscapeException");
// Supports simple pattern for prompting for user input and acting on this
class CodeAdapter {
    constructor() {
        this.outBuffer = '';
        this.messageLevelFormatters = {};
        // TODO Decide whether output channel logging should be saved here?
        this.outChannel = vscode_1.window.createOutputChannel(Constants.outputChannelName);
        // this.outChannel.clear();
    }
    logError(message) {
        let line = `error: ${message.message}\n    Code - ${message.code}`;
        this.outBuffer += `${line}\n`;
        this.outChannel.appendLine(line);
    }
    // private formatInfo(message: any) {
    //     const prefix = `${message.level}: (${message.id}) `;
    //     if (message.id === "json") {
    //         let jsonString = JSON.stringify(message.data, undefined, 4);
    //         return `${prefix}${message.message}\n${jsonString}`;
    //     }
    //     else {
    //         return `${prefix}${message.message}`;
    //     }
    // }
    // private formatAction(message: any) {
    //     const prefix = `info: ${message.level}: (${message.id}) `;
    //     return `${prefix}${message.message}`;
    // }
    formatMessage(message) {
        const prefix = `${message.level}: (${message.id}) `;
        return `${prefix}${message.message}`;
    }
    // private formatConflict(message: any) {
    //     var msg = message.message + ':\n';
    //     var picks = (<any[]>message.data.picks);
    //     var pickCount = 1;
    //     picks.forEach((pick) => {
    //         let pickMessage = (pickCount++).toString() + "). " + pick.endpoint.name + "#" + pick.endpoint.target;
    //         if (pick.pkgMeta._resolution && pick.pkgMeta._resolution.tag) {
    //             pickMessage += " which resolved to " + pick.pkgMeta._resolution.tag
    //         }
    //         if (Array.isArray(pick.dependants) && pick.dependants.length > 0) {
    //             pickMessage += " and is required by ";
    //             pick.dependants.forEach((dep) => {
    //                 pickMessage += " " + dep.endpoint.name + "#" + dep.endpoint.target;
    //             });
    //         }
    //         msg += "    " + pickMessage + "\n";
    //     });
    //     var prefix = (message.id === "solved"? "info" : "warn") + `: ${message.level}: (${message.id}) `;
    //     return prefix + msg;
    // }
    log(message) {
        let line = '';
        if (message && typeof (message.level) === 'string') {
            let formatter = this.formatMessage;
            if (this.messageLevelFormatters[message.level]) {
                formatter = this.messageLevelFormatters[message.level];
            }
            line = formatter(message);
        }
        else {
            line = nodeUtil.format(arguments);
        }
        this.outBuffer += `${line}\n`;
        this.outChannel.appendLine(line);
    }
    clearLog() {
        this.outChannel.clear();
    }
    showLog() {
        this.outChannel.show();
    }
    // TODO define question interface
    fixQuestion(question) {
        if (question.type === 'checkbox' && Array.isArray(question.choices)) {
            // For some reason when there's a choice of checkboxes, they aren't formatted properly
            // Not sure where the issue is
            question.choices = question.choices.map(item => {
                if (typeof (item) === 'string') {
                    return { checked: false, name: item, value: item };
                }
                else {
                    return item;
                }
            });
        }
    }
    promptSingle(question, ignoreFocusOut) {
        let questions = [question];
        return this.prompt(questions, ignoreFocusOut).then(answers => {
            if (answers) {
                return answers[question.name] || false;
            }
        });
    }
    prompt(questions, ignoreFocusOut) {
        let answers = {};
        // Collapse multiple questions into a set of prompt steps
        let promptResult = questions.reduce((promise, question) => {
            this.fixQuestion(question);
            return promise.then(() => {
                return factory_1.default.createPrompt(question, ignoreFocusOut);
            }).then(prompt => {
                // Original Code: uses jQuery patterns. Keeping for reference
                // if (!question.when || question.when(answers) === true) {
                //     return prompt.render().then(result => {
                //         answers[question.name] = question.filter ? question.filter(result) : result;
                //     });
                // }
                if (!question.shouldPrompt || question.shouldPrompt(answers) === true) {
                    return prompt.render().then(result => {
                        answers[question.name] = result;
                        if (question.onAnswered) {
                            question.onAnswered(result);
                        }
                        return answers;
                    });
                }
                return answers;
            });
        }, Promise.resolve());
        return promptResult.catch(err => {
            if (err instanceof EscapeException_1.default || err instanceof TypeError) {
                return;
            }
            vscode_1.window.showErrorMessage(err.message);
        });
    }
    // Helper to make it possible to prompt using callback pattern. Generally Promise is a preferred flow
    promptCallback(questions, callback) {
        // Collapse multiple questions into a set of prompt steps
        this.prompt(questions).then(answers => {
            if (callback) {
                callback(answers);
            }
        });
    }
}
exports.default = CodeAdapter;

//# sourceMappingURL=adapter.js.map
