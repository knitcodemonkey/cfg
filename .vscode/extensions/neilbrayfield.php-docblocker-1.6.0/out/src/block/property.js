"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const block_1 = require("../block");
const doc_1 = require("../doc");
/**
 * Represents an property block
 */
class Property extends block_1.Block {
    constructor() {
        super(...arguments);
        /**
         * @inheritdoc
         */
        this.pattern = /^\s*(static)?\s*(protected|private|public)\s+(static)?\s*(\$[A-Za-z0-9_]+)\s*\=?\s*([^;]*)/m;
    }
    /**
     * @inheritdoc
     */
    parse() {
        let params = this.match();
        let doc = new doc_1.Doc('Undocumented variable');
        if (params[5]) {
            doc.var = this.getTypeFromValue(params[5]);
        }
        else {
            doc.var = '[type]';
        }
        return doc;
    }
}
exports.default = Property;
//# sourceMappingURL=property.js.map