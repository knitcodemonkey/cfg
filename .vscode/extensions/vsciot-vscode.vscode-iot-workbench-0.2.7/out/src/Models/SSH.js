"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-plus");
const path = require("path");
const ssh2 = require("ssh2");
const vscode = require("vscode");
class SSH {
    constructor(channel) {
        this._connected = false;
        this._channel = null;
        this._client = new ssh2.Client();
        if (channel) {
            this._channel = channel;
        }
    }
    connect(host, port, username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const conn = this._client;
                conn.on('ready', () => {
                    this._connected = true;
                    return resolve(true);
                })
                    .on('end', () => {
                    this._connected = false;
                    return resolve(false);
                })
                    .on('close', () => {
                    this._connected = false;
                    return resolve(false);
                })
                    .connect({ host, port, username, password });
            });
        });
    }
    upload(filePath, remoteRootPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this._connected) {
                    return resolve(false);
                }
                if (!fs.existsSync(filePath)) {
                    return resolve(false);
                }
                filePath = filePath.replace(/[\\\/]+/g, '/');
                const rootPath = (fs.isDirectorySync(filePath) ? filePath : path.dirname(filePath))
                    .replace(/\/$/, '');
                const files = fs.listTreeSync(filePath);
                if (this._channel) {
                    this._channel.show();
                    this._channel.appendLine('');
                }
                const conn = this._client;
                conn.sftp((err, sftp) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        if (this._channel) {
                            this._channel.appendLine(`SFTP Error:`);
                            this._channel.appendLine(err.message);
                        }
                        return resolve(false);
                    }
                    const rootPathExist = yield this.isExist(sftp, remoteRootPath);
                    if (rootPathExist) {
                        const overwriteOption = yield vscode.window.showInformationMessage(`${remoteRootPath} exists, overwrite?`, 'Yes', 'No', 'Cancel');
                        if (overwriteOption === 'Cancel') {
                            if (this._channel) {
                                this._channel.appendLine('Device upload cancelled.');
                            }
                            vscode.window.showWarningMessage('Device upload cancelled.');
                            return resolve(true);
                        }
                        if (overwriteOption === 'No') {
                            const raspiPathOption = {
                                value: 'IoTProject',
                                prompt: `Please input Raspberry Pi path here.`,
                                ignoreFocusOut: true
                            };
                            let raspiPath = yield vscode.window.showInputBox(raspiPathOption);
                            if (raspiPath === undefined) {
                                return false;
                            }
                            raspiPath = raspiPath || 'IoTProject';
                            const res = yield this.upload(filePath, raspiPath);
                            return resolve(res);
                        }
                        const rmDirRes = yield this.shell(`rm -rf ${remoteRootPath}`);
                        if (!rmDirRes) {
                            if (this._channel) {
                                this._channel.appendLine(`Directory Error: remove ${remoteRootPath} failed.`);
                            }
                            return resolve(false);
                        }
                    }
                    const rootPathCreated = yield this.ensureDir(sftp, remoteRootPath);
                    if (!rootPathCreated) {
                        if (this._channel) {
                            this._channel.appendLine(`Directory Error: ${remoteRootPath}`);
                            this._channel.appendLine(err);
                        }
                        return resolve(false);
                    }
                    for (const file of files) {
                        const res = yield this.uploadSingleFile(sftp, file, rootPath, remoteRootPath);
                        if (!res) {
                            return resolve(false);
                        }
                    }
                    return resolve(true);
                }));
            });
        });
    }
    isExist(sftp, remotePath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                sftp.readdir(remotePath, (err, list) => {
                    if (err) {
                        return resolve(false);
                    }
                    return resolve(true);
                });
            });
        });
    }
    ensureDir(sftp, remotePath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const dirExist = yield this.isExist(sftp, remotePath);
                if (!dirExist) {
                    sftp.mkdir(remotePath, (err) => __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            return resolve(false);
                        }
                        return resolve(true);
                    }));
                }
                return resolve(true);
            }));
        });
    }
    uploadSingleFile(sftp, filePath, rootPath, remoteRootPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const relativePath = filePath.replace(/[\\\/]+/g, '/').substr(rootPath.length + 1);
                if (/(^|\/)node_modules(\/|$)/.test(relativePath) ||
                    /(^|\/).vscode(\/|$)/.test(relativePath) ||
                    relativePath === '.iotworkbenchproject') {
                    return resolve(true);
                }
                const remotePath = path.join(remoteRootPath, relativePath).replace(/[\\\/]+/g, '/');
                if (fs.isDirectorySync(filePath)) {
                    const pathCreated = yield this.ensureDir(sftp, remotePath);
                    if (!pathCreated) {
                        if (this._channel) {
                            this._channel.appendLine(`Directory Error: ${relativePath}`);
                        }
                        return resolve(false);
                    }
                    return resolve(true);
                }
                else {
                    sftp.fastPut(filePath, remotePath, err => {
                        if (err) {
                            if (this._channel) {
                                this._channel.appendLine(`File Error: ${relativePath}`);
                            }
                            return resolve(false);
                        }
                        if (this._channel) {
                            this._channel.appendLine(`File Uploaded: ${relativePath}`);
                        }
                        return resolve(true);
                    });
                }
            }));
        });
    }
    shell(command, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this._connected) {
                    return resolve(false);
                }
                let timeoutCounter;
                if (timeout) {
                    timeoutCounter = setTimeout(() => {
                        return resolve(false);
                    }, timeout);
                }
                const conn = this._client;
                conn.shell((err, stream) => {
                    if (err) {
                        if (this._channel) {
                            this._channel.appendLine(`Shell Error:`);
                            this._channel.appendLine(err.message);
                        }
                        return resolve(false);
                    }
                    if (this._channel) {
                        this._channel.show();
                        this._channel.appendLine('');
                    }
                    stream
                        .on('close', () => {
                        clearTimeout(timeoutCounter);
                        if (this._channel) {
                            this._channel.appendLine('');
                        }
                        return resolve(true);
                    })
                        .on('data', (data) => {
                        if (this._channel) {
                            const output = data.toString().replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
                            this._channel.append(output);
                        }
                    })
                        .stderr.on('data', (data) => {
                        if (this._channel) {
                            const output = data.toString().replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
                            this._channel.append(output);
                        }
                    });
                    stream.setWindow(10, 500, 10, 100);
                    stream.end(command + '\nexit\n');
                });
            });
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            this._client.end();
            return Promise.resolve(true);
        });
    }
}
exports.SSH = SSH;
//# sourceMappingURL=SSH.js.map