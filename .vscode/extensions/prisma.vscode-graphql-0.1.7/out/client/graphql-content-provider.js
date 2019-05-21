"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const graphql_config_1 = require("graphql-config");
const graphql_1 = require("graphql");
const network_helper_1 = require("./network-helper");
const source_helper_1 = require("./source-helper");
class GraphQLContentProvider {
    constructor(uri, outputChannel, literal) {
        // Event emitter which invokes document updates
        this._onDidChange = new vscode_1.EventEmitter();
        this.html = ""; // HTML document buffer
        this.timeout = ms => new Promise(res => setTimeout(res, ms));
        this.uri = uri;
        this.outputChannel = outputChannel;
        this.networkHelper = new network_helper_1.NetworkHelper(this.outputChannel);
        this.sourceHelper = new source_helper_1.SourceHelper(this.outputChannel);
        try {
            const rootDir = vscode_1.workspace.getWorkspaceFolder(vscode_1.Uri.file(literal.uri));
            if (!rootDir) {
                this.outputChannel.appendLine(`Error: this file is outside the workspace.`);
                this.html = "Error: this file is outside the workspace.";
                this.update(this.uri);
                return;
            }
            else {
                const config = graphql_config_1.getGraphQLConfig(rootDir.uri.fsPath);
                let projectConfig = config.getConfigForFile(literal.uri);
                if (!projectConfig) {
                    projectConfig = this.patchProjectConfig(config);
                }
                if (!projectConfig.endpointsExtension) {
                    this.outputChannel.appendLine(`Error: endpoint data missing from graphql config`);
                    this.html = "Error: endpoint data missing from graphql config";
                    this.update(this.uri);
                    return;
                }
                const endpointNames = Object.keys(projectConfig.endpointsExtension.getRawEndpointsMap());
                if (endpointNames.length === 0) {
                    this.outputChannel.appendLine(`Error: endpoint data missing from graphql config endpoints extension`);
                    this.html =
                        "Error: endpoint data missing from graphql config endpoints extension";
                    this.update(this.uri);
                    return;
                }
                // TODO: Can ask user for the endpoint if muliple exist
                // Endpoints extensions docs say that at least "default" will be there
                const endpointName = endpointNames[0];
                const endpoint = projectConfig.endpointsExtension.getEndpoint(endpointName);
                let variableDefinitionNodes = [];
                graphql_1.visit(literal.ast, {
                    VariableDefinition(node) {
                        variableDefinitionNodes.push(node);
                    }
                });
                const updateCallback = (data, operation) => {
                    if (operation === "subscription") {
                        this.html = `<pre>${data}</pre>` + this.html;
                    }
                    else {
                        this.html += `<pre>${data}</pre>`;
                    }
                    this.update(this.uri);
                };
                if (variableDefinitionNodes.length > 0) {
                    this.getVariablesFromUser(variableDefinitionNodes).then((variables) => {
                        this.networkHelper.executeOperation({
                            endpoint: endpoint,
                            literal: literal,
                            variables: variables,
                            updateCallback
                        });
                    });
                }
                else {
                    this.networkHelper.executeOperation({
                        endpoint: endpoint,
                        literal: literal,
                        variables: {},
                        updateCallback
                    });
                }
            }
        }
        catch (e) {
            this.html = e.toString();
        }
    }
    getVariablesFromUser(variableDefinitionNodes) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.timeout(500);
            let variables = {};
            for (let node of variableDefinitionNodes) {
                variables = Object.assign({}, variables, { [`${node.variable.name.value}`]: this.sourceHelper.typeCast(yield vscode_1.window.showInputBox({
                        ignoreFocusOut: true,
                        placeHolder: `Please enter the value for ${node.variable.name.value}`
                    }), this.sourceHelper.getTypeForVariableDefinitionNode(node)) });
            }
            return variables;
        });
    }
    /*
      Use the configration of first project if heuristics failed
      to find one.
    */
    patchProjectConfig(config) {
        if (!config.config.projects) {
            return config;
        }
        if (config.config.projects) {
            const projectKeys = Object.keys(config.config.projects);
            return config.getProjectConfig(projectKeys[0]);
        }
        return null;
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    update(uri) {
        this._onDidChange.fire(uri);
    }
    provideTextDocumentContent(_) {
        return this.html;
    }
}
exports.GraphQLContentProvider = GraphQLContentProvider;
//# sourceMappingURL=graphql-content-provider.js.map