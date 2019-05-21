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
const path = require("path");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const status_1 = require("./status");
const graphql_content_provider_1 = require("./client/graphql-content-provider");
const graphql_codelens_provider_1 = require("./client/graphql-codelens-provider");
const CustomInitializationFailedHandler_1 = require("./CustomInitializationFailedHandler");
function getConfig() {
    return vscode_1.workspace.getConfiguration("vscode-graphql", vscode_1.window.activeTextEditor ? vscode_1.window.activeTextEditor.document.uri : null);
}
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let outputChannel = vscode_1.window.createOutputChannel("GraphQL Language Server");
        const config = getConfig();
        const { debug } = config;
        if (debug) {
            console.log('Extension "vscode-graphql" is now active!');
        }
        const serverModule = context.asAbsolutePath(path.join("out/server", "server.js"));
        const debugOptions = {
            execArgv: ["--nolazy", "--debug=6009", "--inspect=localhost:6009"]
        };
        let serverOptions = {
            run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
            debug: {
                module: serverModule,
                transport: vscode_languageclient_1.TransportKind.ipc,
                options: debug ? debugOptions : {}
            }
        };
        let clientOptions = {
            documentSelector: [{ scheme: "file", language: "graphql" }],
            synchronize: {
                fileEvents: vscode_1.workspace.createFileSystemWatcher("**/*.{graphql,gql}")
            },
            outputChannel: outputChannel,
            outputChannelName: "GraphQL Language Server",
            initializationFailedHandler: CustomInitializationFailedHandler_1.CustomInitializationFailedHandler(outputChannel)
        };
        const client = new vscode_languageclient_1.LanguageClient("vscode-graphql", "GraphQL Language Server", serverOptions, clientOptions, debug);
        const disposableClient = client.start();
        context.subscriptions.push(disposableClient);
        const commandIsDebugging = vscode_1.commands.registerCommand("extension.isDebugging", () => {
            outputChannel.appendLine(`is in debug mode: ${!!debug}`);
        });
        context.subscriptions.push(commandIsDebugging);
        // Manage Status Bar
        context.subscriptions.push(status_1.default);
        client.onReady().then(() => {
            status_1.initStatusBar(status_1.default, client, vscode_1.window.activeTextEditor);
        });
        context.subscriptions.push(vscode_1.languages.registerCodeLensProvider([
            "javascript",
            "typescript",
            "javascriptreact",
            "typescriptreact",
            "graphql"
        ], new graphql_codelens_provider_1.GraphQLCodeLensProvider(outputChannel)));
        const commandContentProvider = vscode_1.commands.registerCommand("extension.contentProvider", (literal) => {
            const uri = vscode_1.Uri.parse("graphql://authority/graphql");
            const contentProvider = new graphql_content_provider_1.GraphQLContentProvider(uri, outputChannel, literal);
            const registration = vscode_1.workspace.registerTextDocumentContentProvider("graphql", contentProvider);
            context.subscriptions.push(registration);
            return vscode_1.commands
                .executeCommand("vscode.previewHtml", uri, vscode_1.ViewColumn.Two, "GraphQL Content Provider")
                .then(_ => { }, _ => {
                vscode_1.window.showErrorMessage("Error opening content.");
            });
        });
        context.subscriptions.push(commandContentProvider);
    });
}
exports.activate = activate;
function deactivate() {
    console.log('Extension "vscode-graphql" is now de-active!');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map