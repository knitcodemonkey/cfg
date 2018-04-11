"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs = require("fs-extra");
let args = process.argv.splice(2);
let cmd = args.shift();
if (cmd === 'spawnDetached') {
    let exe = args.shift();
    let childProc = child_process_1.spawn(exe, args, { detached: true, stdio: 'ignore' });
    childProc.unref();
}
else if (cmd === 'spawnAndRemove') {
    let pathToRemove = args.shift();
    let exe = args.shift();
    let childProc = child_process_1.spawn(exe, args);
    childProc.once('exit', () => setTimeout(() => fs.remove(pathToRemove), 500));
}
else if (cmd === 'spawnAndRemove2') {
    let pathToRemove = args.shift();
    let pathToRemove2 = args.shift();
    let exe = args.shift();
    let childProc = child_process_1.spawn(exe, args);
    childProc.once('exit', () => setTimeout(() => fs.remove(pathToRemove, () => fs.remove(pathToRemove2)), 500));
}
//# sourceMappingURL=forkedLauncher.js.map