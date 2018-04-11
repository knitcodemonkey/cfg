"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const danger_1 = require("danger");
const fs = require("fs");
const pr = danger_1.danger.github.pr;
const modified = danger_1.danger.git.modified_files;
const bodyAndTitle = (pr.body + pr.title).toLowerCase();
const trivialPR = bodyAndTitle.includes('#trivial');
const typescriptOnly = (file) => file.includes('.ts');
const filesOnly = (file) => fs.existsSync(file) && fs.lstatSync(file).isFile();
// Custom subsets of known files
const modifiedAppFiles = modified.filter(p => p.includes('src/')).filter(p => filesOnly(p) && typescriptOnly(p));
// Rules
// When there are app-changes and it's not a PR marked as trivial, expect
// there to be CHANGELOG changes.
const changelogChanges = modified.includes('CHANGELOG.md');
if (modifiedAppFiles.length > 0 && !trivialPR && !changelogChanges) {
    danger_1.fail('**No CHANGELOG added.** If this is a small PR, or a bug-fix for an unreleased bug add `#trivial` to your PR message and re-run CI.');
}
//# sourceMappingURL=dangerfile.js.map