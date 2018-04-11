"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jest_editor_support_1 = require("jest-editor-support");
const jest_test_typescript_parser_1 = require("jest-test-typescript-parser");
function getParser(filePath) {
    const isTypeScript = filePath.match(/\.tsx?$/);
    return isTypeScript ? jest_test_typescript_parser_1.parse : jest_editor_support_1.parse;
}
exports.getParser = getParser;
function parseTest(filePath) {
    const parser = getParser(filePath);
    return parser(filePath);
}
exports.parseTest = parseTest;
//# sourceMappingURL=TestParser.js.map