"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function onCustomEvent(event, loadedScriptsProvider) {
    if (event.session.type === 'firefox') {
        switch (event.event) {
            case 'threadStarted':
                loadedScriptsProvider.addThread(event.body, event.session.id);
                break;
            case 'threadExited':
                loadedScriptsProvider.removeThread(event.body.id, event.session.id);
                break;
            case 'newSource':
                loadedScriptsProvider.addSource(event.body, event.session.id);
                break;
            case 'removeSources':
                loadedScriptsProvider.removeSources(event.body.threadId, event.session.id);
                break;
        }
    }
}
exports.onCustomEvent = onCustomEvent;
//# sourceMappingURL=customEvents.js.map