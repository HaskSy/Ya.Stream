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
    } else if (request.greeting === 'turnOnStreaming') {
        isStreaming = true
        return;
    } else if (request.greeting === 'turnOffStreaming') {
        isStreaming = false
        return;
    }
    handlePlayerEvents(request)
})

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    // What is inside request.dataType?
    // Hope I know. See injected.js:sendToServiceWorker
    switch (request.dataType) {
        case 'setCurrentTrack':
            let songName = request.currentTrack.title
            console.log('song name is')
            console.log(songName)
            console.log('song position')
            console.log(request.progress.position)
            // TODO: your code here
            break;
        case 'togglePause':

            break;
    }
})


/**
 * Handles all possible events from player extension (more precise, from content-script.js)
 * @param event event from player to parse
 */
function handlePlayerEvents(event) {
    // play, next, prev, goto
    console.log('payload is')
    console.log(event.payload)
    chrome.tabs.sendMessage(yandexTabID[0], {'action': event.action, 'payload': event.payload})
}