"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_client_1 = require("apollo-client");
const graphql_tag_1 = require("graphql-tag");
const apollo_link_ws_1 = require("apollo-link-ws");
const apollo_cache_inmemory_1 = require("apollo-cache-inmemory");
const ws = require("ws");
const http_link_dataloader_1 = require("http-link-dataloader");
class NetworkHelper {
    constructor(outputChannel) {
        this.outputChannel = outputChannel;
    }
    executeOperation({ endpoint, literal, variables, updateCallback }) {
        const operation = literal.ast.definitions[0]
            .operation;
        this.outputChannel.appendLine(`NetworkHelper: operation: ${operation}`);
        const httpLink = new http_link_dataloader_1.HTTPLinkDataloader({
            uri: endpoint.url,
            headers: endpoint.headers
        });
        const wsEndpointURL = endpoint.url.replace(/^http/, "ws");
        const wsLink = new apollo_link_ws_1.WebSocketLink({
            uri: wsEndpointURL,
            options: {
                reconnect: true,
                inactivityTimeout: 30000
            },
            webSocketImpl: ws
        });
        const apolloClient = new apollo_client_1.default({
            link: operation === "subscription" ? wsLink : httpLink,
            cache: new apollo_cache_inmemory_1.InMemoryCache({
                addTypename: false
            })
        });
        const parsedOperation = graphql_tag_1.default `
      ${literal.content}
    `;
        if (operation === "subscription") {
            apolloClient
                .subscribe({
                query: parsedOperation,
                variables
            })
                .subscribe({
                next(data) {
                    updateCallback(formatData(data), operation);
                }
            });
        }
        else {
            if (operation === "query") {
                apolloClient
                    .query({
                    query: parsedOperation,
                    variables
                })
                    .then((data) => {
                    updateCallback(formatData(data), operation);
                })
                    .catch(err => {
                    updateCallback(err.toString(), operation);
                });
            }
            else {
                apolloClient
                    .mutate({
                    mutation: parsedOperation,
                    variables
                })
                    .then((data) => {
                    updateCallback(formatData(data), operation);
                });
            }
        }
    }
}
exports.NetworkHelper = NetworkHelper;
function formatData({ data, errors }) {
    return JSON.stringify({ data, errors }, null, 2);
}
//# sourceMappingURL=network-helper.js.map