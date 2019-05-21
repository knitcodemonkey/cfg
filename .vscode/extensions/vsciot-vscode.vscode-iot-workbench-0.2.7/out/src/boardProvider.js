// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const path = require("path");
class BoardProvider {
    constructor(context) {
        this.context = context;
    }
    get list() {
        const boardList = this.context.asAbsolutePath(path.join(constants_1.FileNames.resourcesFolderName, constants_1.FileNames.boardListFileName));
        const boardsJson = require(boardList);
        return boardsJson.boards;
    }
    find(option) {
        const list = this.list;
        return list.find(board => {
            for (const key of Object.keys(option)) {
                const boardProperty = Object.getOwnPropertyDescriptor(board, key);
                const optionProperty = Object.getOwnPropertyDescriptor(option, key);
                if (!optionProperty) {
                    continue;
                }
                if (!boardProperty) {
                    return false;
                }
                if (key === 'vendorId' || key === 'productId') {
                    const optionId = typeof optionProperty.value === 'number' ?
                        optionProperty.value :
                        Number(`0x${optionProperty.value}`);
                    const boardId = Number(`0x${boardProperty.value}`);
                    if (optionId !== boardId) {
                        return false;
                    }
                }
                else if (optionProperty.value !== boardProperty.value) {
                    return false;
                }
            }
            return true;
        });
    }
}
exports.BoardProvider = BoardProvider;
//# sourceMappingURL=boardProvider.js.map