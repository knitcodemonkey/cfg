"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function triggerKeyEvent(key, ele) {
    let keyboardEvent = document.createEvent('KeyboardEvent');
    let initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? 'initKeyboardEvent' : 'initKeyEvent';
    keyboardEvent[initMethod]('keydown', // event type : keydown, keyup, keypress
    true, // bubbles
    true, // cancelable
    window, // viewArg: should be window
    false, // ctrlKeyArg
    false, // altKeyArg
    false, // shiftKeyArg
    false, // metaKeyArg
    key, // keyCodeArg : unsigned long the virtual key code, else 0
    0 // charCodeArgs : unsigned long the Unicode character associated with the depressed key, else 0
    );
    ele.dispatchEvent(keyboardEvent);
}
exports.triggerKeyEvent = triggerKeyEvent;

//# sourceMappingURL=testUtils.js.map
