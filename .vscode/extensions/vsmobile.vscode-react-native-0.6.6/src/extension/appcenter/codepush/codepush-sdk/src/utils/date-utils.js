"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
function formatDate(unixOffset) {
    let formattedDateString;
    const date = new Date(unixOffset);
    if (date_fns_1.differenceInMinutes(Date.now(), date) < 2) {
        formattedDateString = "Just now";
    }
    else {
        formattedDateString = date_fns_1.format(date, "MMM DD, hh:mm A");
    }
    return formattedDateString;
}
exports.formatDate = formatDate;

//# sourceMappingURL=date-utils.js.map
