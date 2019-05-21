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
const vscode = require("vscode");
const webpanel_1 = require("../webpanel/webpanel");
class DescribePanel extends webpanel_1.WebPanel {
    constructor(panel, content, resource, refresh) {
        super(panel, content, resource, DescribePanel.currentPanels);
        this.refresh = refresh;
        const setActiveContext = (active) => {
            vscode.commands.executeCommand('setContext', DescribePanel.describeContext, active);
            DescribePanel.activePanel = active ? this : undefined;
        };
        this.panel.onDidChangeViewState((evt) => {
            setActiveContext(evt.webviewPanel.active);
        });
        setActiveContext(true);
        this.panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            switch (message.command) {
                case 'refresh':
                    yield this.doRefresh();
                    break;
            }
        }), undefined);
    }
    static refreshCommand() {
        if (DescribePanel.activePanel) {
            DescribePanel.activePanel.doRefresh();
        }
    }
    static createOrShow(content, resource, refresh) {
        const fn = (panel, content, resource) => {
            return new DescribePanel(panel, content, resource, refresh);
        };
        webpanel_1.WebPanel.createOrShowInternal(content, resource, DescribePanel.viewType, "Kubernetes Describe", DescribePanel.currentPanels, fn);
    }
    doRefresh() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.refresh();
            if (!result) {
                vscode.window.showErrorMessage('Error refreshing!');
                return;
            }
            if (result.code !== 0) {
                vscode.window.showErrorMessage(`Error refreshing: ${result.stderr}`);
                return;
            }
            this.panel.webview.postMessage({
                command: 'content',
                content: result.stdout,
            });
        });
    }
    update() {
        this.panel.title = `Kubernetes describe ${this.resource}`;
        this.panel.webview.html = `
    <!doctype html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Kubernetes describe ${this.resource}</title>
        <script>
            const vscode = acquireVsCodeApi();

            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'content':
                        const elt = document.getElementById('content');
                        elt.innerText = message.content;
                }
            });
        </script>
    </head>
    <body>
        <code>
            <pre id='content'>${this.content}</pre>
        </code>
    </body>
    </html>`;
    }
}
DescribePanel.viewType = 'vscodeKubernetesDescribe';
DescribePanel.describeContext = 'vscodeKubernetesDescribeContext';
DescribePanel.activePanel = undefined;
DescribePanel.currentPanels = new Map();
exports.DescribePanel = DescribePanel;
//# sourceMappingURL=describeWebview.js.map