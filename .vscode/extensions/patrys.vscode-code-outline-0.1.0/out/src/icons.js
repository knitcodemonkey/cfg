"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
exports.getIcon = (kind, context) => {
    let icon;
    switch (kind) {
        case vscode_1.SymbolKind.Class:
            icon = "class";
            break;
        case vscode_1.SymbolKind.Constant:
            icon = "constant";
            break;
        case vscode_1.SymbolKind.Constructor:
        case vscode_1.SymbolKind.Function:
        case vscode_1.SymbolKind.Method:
            icon = "function";
            break;
        case vscode_1.SymbolKind.Interface:
            icon = "interface";
        case vscode_1.SymbolKind.Module:
        case vscode_1.SymbolKind.Namespace:
        case vscode_1.SymbolKind.Object:
        case vscode_1.SymbolKind.Package:
            icon = "module";
            break;
        case vscode_1.SymbolKind.Property:
            icon = "property";
            break;
        default:
            icon = "variable";
            break;
    }
    icon = `icon-${icon}.svg`;
    return {
        dark: context.asAbsolutePath(path.join("resources", "dark", icon)),
        light: context.asAbsolutePath(path.join("resources", "light", icon))
    };
};
//# sourceMappingURL=icons.js.map