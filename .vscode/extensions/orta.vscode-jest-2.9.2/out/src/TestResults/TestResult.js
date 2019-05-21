"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
/**
 * Normalize file paths on Windows systems to use lowercase drive letters.
 * This follows the standard used by Visual Studio Code for URIs which includes
 * the document fileName property.
 *
 * @param data Parsed JSON results
 */
function resultsWithLowerCaseWindowsDriveLetters(data) {
    if (path.sep === '\\') {
        return Object.assign({}, data, { coverageMap: coverageMapWithLowerCaseWindowsDriveLetters(data), testResults: testResultsWithLowerCaseWindowsDriveLetters(data.testResults) });
    }
    return data;
}
exports.resultsWithLowerCaseWindowsDriveLetters = resultsWithLowerCaseWindowsDriveLetters;
function coverageMapWithLowerCaseWindowsDriveLetters(data) {
    if (!data.coverageMap) {
        return;
    }
    const result = {};
    const filePaths = Object.keys(data.coverageMap);
    for (const filePath of filePaths) {
        const newFileCoverage = fileCoverageWithLowerCaseWindowsDriveLetter(data.coverageMap[filePath]);
        result[newFileCoverage.path] = newFileCoverage;
    }
    return result;
}
exports.coverageMapWithLowerCaseWindowsDriveLetters = coverageMapWithLowerCaseWindowsDriveLetters;
function fileCoverageWithLowerCaseWindowsDriveLetter(fileCoverage) {
    const newFilePath = withLowerCaseWindowsDriveLetter(fileCoverage.path);
    if (newFilePath) {
        return Object.assign({}, fileCoverage, { path: newFilePath });
    }
    return fileCoverage;
}
function testResultsWithLowerCaseWindowsDriveLetters(testResults) {
    if (!testResults) {
        return testResults;
    }
    return testResults.map(testResultWithLowerCaseWindowsDriveLetter);
}
exports.testResultsWithLowerCaseWindowsDriveLetters = testResultsWithLowerCaseWindowsDriveLetters;
function testResultWithLowerCaseWindowsDriveLetter(testResult) {
    const newFilePath = withLowerCaseWindowsDriveLetter(testResult.name);
    if (newFilePath) {
        return Object.assign({}, testResult, { name: newFilePath });
    }
    return testResult;
}
function withLowerCaseWindowsDriveLetter(filePath) {
    const match = filePath.match(/^([A-Z]:\\)(.*)$/);
    if (match) {
        return `${match[1].toLowerCase()}${match[2]}`;
    }
}
exports.withLowerCaseWindowsDriveLetter = withLowerCaseWindowsDriveLetter;
//# sourceMappingURL=TestResult.js.map