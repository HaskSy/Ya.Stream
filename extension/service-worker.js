'use strict'
// import {State} from "./popup.js";
// importScripts('./popup.js');

/** here lies all tabs that are represented as yandex music */
var yandexTabID = []
let isStreaming = false

/**
 * Listener for all incoming events from extension
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.greeting === 'hello') {
        yandexTabID.push(sender.tab.id)
        console.log('added tab')
        console.log(sender.tab.id)
        console.log('yandexTabID')
        console.log(yandexTabID[0])
        return;
    } else if (request.greeting === 'bye') {
        yandexTabID = yandexTabID.filter(item => item !== sender.tab.id)
        return;
    } else if (request.greeting === 'getID') {
        let extensionID = chrome.runtime.id
        sendResponse({id: extensionID})
        return;
    }
    handlePlayerEvents(request)
})


/**
 * Handles all possible events from player extension (more precise, from content-script.js)
 * @param event event from player to parse
 */
function handlePlayerEvents(event) {
    // play, next, prev, goto
    console.log('payload is')
    console.log(event)
    chrome.tabs.sendMessage(yandexTabID[0], event)
}