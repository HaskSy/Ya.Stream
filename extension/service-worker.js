'use strict'

/** here lies all tabs that are represented as yandex music */
var yandexTabID = []
let isStreaming = false

/**
 * Listener for all incoming events from extension
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('chrome.runtime.listener request')
    console.log(request)
    switch (request.greeting) {
        case 'hello':
            yandexTabID.push(sender.tab.id)
            console.log('added tab')
            console.log(sender.tab.id)
            break;
        case 'bye':
            yandexTabID = yandexTabID.filter(item => item !== sender.tab.id)
            break;
        case 'getID':
            let extensionID = chrome.runtime.id
            sendResponse({id: extensionID})
            break;
        case 'startListen':
            console.log(`listening started for user ${request.username}`)
            State.setIsListening(request.username)
            ListenerService.startListening(request.username)
            break;
        case 'stopListen':
            console.log('listening stopped')
            State.setIsListening(null)
            ListenerService.stopListening()
            break;
        case 'startStream':
            console.log('streaming started')
            State.setIsStreaming(true)
            StreamerService.startStreaming()
            break;
        case 'stopStream':
            State.setIsStreaming(false)
            StreamerService.stopStreaming()
            break;
        default:
            handlePlayerEvents(request)
    }
})


/**
 * Handles all possible events from player extension (more precise, from content-script.js)
 * @param event event from player to parse
 */
function handlePlayerEvents(event) {
    // play, next, prev, goto
    console.log('handlePlayerEvents sends event:')
    console.log(event)
    if (yandexTabID.length === 0){
        console.log('page not found. Do nothing..')
        // TODO: some alert, maybe?

        // console.log('There is no tabs to play music on. Trying to find...')
        // chrome.tabs.query({url:[
        //         "*://*.music.yandex.ru/*",
        //         "*://*.music.yandex.com/*",
        //         "*://*.music.yandex.ua/*",
        //         "*://*.music.yandex.by/*"
        // ]}).then((result) => {
        //     console.log(`found tab with id: ${result[0].id}`)
        //     chrome.tabs.reload(yandexTabID[0]).then(() => {
        //         setTimeout(() => {
        //             console.log(`yandexTabID[0] is ${result[0].id}`)
        //             chrome.tabs.sendMessage(result[0].id, event)
        //         }, 500)
        //     })
        // })
    } else {
        chrome.tabs.sendMessage(yandexTabID[0], event)
    }
}

/**
 * Configuration object properties
 * @typedef {Object} ExtentionConfig
 * @property {string} config.baseApiUrl - API Path
 * @property {string} authTokenStorageLocation - specifies the key of Authorization Basic token in chrome.storage
 */

/** @type {ExtentionConfig} */
let config = {
    "baseApiUrl": "https://music.gvsem.com",
    "authTokenStorageLocation": "authToken"
}

/** Initializing history of last subscribed on users if there is no such */
chrome.storage.local.get(['history']).then((historyObj) => {
    if (historyObj['history'] === undefined) {
        chrome.storage.local.set({history: ["", "", "", "", ""]}).then(() => console.log("Setting succesfully"));
    }
})


class State {
    static setIsStreaming(flag){
        chrome.storage.local.set({isStreaming: flag}).then(() => "Setting succesfully");
    }

    static async getIsStreaming(){
        return (await chrome.storage.local.get(['isStreaming']))['isStreaming'];
    }

    static setIsListening(user){
        chrome.storage.local.set({isListening: user}).then(() => "Setting succesfully");
    }

    static async getIsListening(){
        return (await chrome.storage.local.get(['isListening']))['isListening'];
    }

    static setAuthenticated(token) {
        let obj = {}
        obj[config.authTokenStorageLocation] = token
        chrome.storage.local.set(obj);
    }

    static async getAuthenticated() {
        const result = await chrome.storage.local.get(config.authTokenStorageLocation);
        return result[config.authTokenStorageLocation] || null
    }

    static async isAuthenticated() {
        return (null !== await this.getAuthenticated())
    }

    static setTextFormContent(text_content) {
        chrome.storage.local.set({textContent: text_content}).then(() => "Setting succesfully");
    }

    static async getTextFormContent() {
        return (await chrome.storage.local.get(['textContent']))['textContent'];
    }
}

/** -------------------- api-service.js -------------------- */

/**
 * Uniform object which is getting send to be broadcasted
 * @typedef {Object} ActionEvent
 * @property {keyof ActionTypes} action
 * @property {String} trackId albumID:trackID
 * @property {number} position
 * @property {number} timestamp
 */

/**
 * Enum of actions which can be registered on streamer-side and performed on subscriber-side
 * @readonly
 * @enum {string}
 */
const ActionTypes = {
    PLAY: 'play',
    STOP: 'stop',
    GOTO: 'goto',
    UNKNOWN: 'unknown'
}

/**
 * Establshing SSE connection for future listener setting
 * @param {string} userId
 * @returns {EventSource}
 */
async function createEventSourceListener(userId) {
    const url = `${config.baseApiUrl}/listen/${userId}`;
    const eventSource = new EventSource(url);
    return eventSource;
}

/*
 * Sends event to backend for further broadcasting to subscribers
 * @param {ActionEvent} actionEvent
 */
async function sendStreamerEvent(actionEvent) {
    const url = `${config.baseApiUrl}/stream`;
    const params = new URLSearchParams({
        event: actionEvent.action,
        track_id: actionEvent.trackId,
        position: actionEvent.position
    });

    const authToken = await State.getAuthenticated()
    console.log(authToken)
    try {

        fetch(`${url}?${params}`, {
            headers: {
                Authorization: authToken,
                "Content-Type": "application/json",
            },
        })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401) {
                        State.setAuthenticated(null)
                        // normal_display.style.display = "none"
                        // not_auth_display.style.display = "block"
                        ListenerService.stopListening()
                        StreamerService.stopStreaming()
                        // ui_notifyStopStreaming()
                        // ui_notifyStopListening()
                    } else {
                        throw new Error(`HTTP error while broadcastng event! Status: ${response.status}`);
                    }
                } else {
                    console.log(`ActionEvent (${actionEvent}) sent succesfully. Status Code: ${response.status}`);
                }
            })
            .catch(error => {
                console.error('ActionEvent fetching error:', error);
            });
    } catch (err) {
        console.error("FoundError")
        console.log(err)
    }
}

/** // -------------------- api-service.js -------------------- */


/** -------------------- listener-service.js -------------------- */

/**
 * Service for handling real-time User Event listening using SSE.
 */
class ListenerService {
    /** @type {string} */
    static currentUser = "";
    /** @type {EventSource | undefined} */
    static listenedSource = undefined;

    /**
     * Event handler for when the connection is open.
     * @param {Event} e - Generic open event.
     * @returns {void}
     */
    static #onOpenHandler = (e) => {
        console.log(`The connection with user "${this.currentUser}" has been (re)establised`);
        State.setIsListening(this.currentUser);
        // ui_notifyStartListening(this.currentUser);
    }
    /**
     * Event handler for incoming messages.
     * @param {MessageEvent<ActionEvent>} event - Message event.
     * @returns {void}
     */
    static #onMessageHandler = (event) => {
        const data = JSON.parse(event.data)
        console.log('event')
        console.log(event)
        console.log('data is')
        console.log(data)
        // chrome.runtime.sendMessage({'action': data.event, 'trackID': data.track_id, 'progress': data.position})
        chrome.tabs.sendMessage(yandexTabID[0],{'action': data.event, 'trackID': data.track_id, 'progress': data.position}, )
    }

    /**
     * Event handler for errors.
     * @param {Event} error - Generic error event.
     * @returns {void}
     */
    static #onErrorHandler = (error) => {
        console.log("User not found");
        ListenerService.stopListening();
    };

    static #setListeners() {
        this.listenedSource.addEventListener("open", this.#onOpenHandler)
        this.listenedSource.addEventListener("message", this.#onMessageHandler)
        this.listenedSource.addEventListener("error", this.#onErrorHandler)
    }

    static #unsetListeners() {
        this.listenedSource.removeEventListener("open", this.#onOpenHandler)
        this.listenedSource.removeEventListener("message", this.#onMessageHandler)
        this.listenedSource.removeEventListener("error", this.#onErrorHandler)
    }

    /**
     * Starts listening to real-time events for the specified user.
     * @returns {void}
     */
    static async startListening(userId) {
        StreamerService.stopStreaming()
        this.stopListening();
        this.currentUser = userId
        this.listenedSource = await createEventSourceListener(userId)
        this.#setListeners();
    }

    /**
     * Stop listening to real-time events.
     * @returns {void}
     */
    static stopListening() {
        if (this.listenedSource) {
            this.#unsetListeners();
            this.listenedSource.close();
            delete this.listenedSource;
        }
        State.setIsListening(null)
        // ui_notifyStopListening();
    }
}

/** //-------------------- listener-service.js -------------------- */


/** -------------------- streamer-service.js -------------------- */

class StreamerService {
    static startStreaming() {
        ListenerService.stopListening()
        console.log("startStreaming")
        // ui_notifyStopListening();
        // ui_notifyStartStreaming();
        State.setIsStreaming(true)
    }

    static stopStreaming() {
        console.log("stopStreaming")
        // ui_notifyStopStreaming();
        State.setIsStreaming(false)
    }
}

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    State.getIsStreaming().then((v) => { //aaa
        if (v) {
            // What is inside request.dataType?
            // Hope I know. See injected.js:sendToServiceWorker
            switch (request.dataType) {
                case 'stop':
                case 'play':
                case 'goto':
                    console.log('we are in popup listener, trying to sendStreamerEvent. request is')
                    console.log(request)
                    const regex = new RegExp('[0-9]+','g')
                    let p = request.currentTrack.link
                    let iterator = p.matchAll(regex)
                    let currentAlbumID = iterator.next().value[0]
                    let currentTrackID = iterator.next().value[0]
                    let progress = Math.floor(request.progress.position)
                    sendStreamerEvent({
                        action: request.dataType,
                        position: progress,
                        trackId: `${currentAlbumID}:${currentTrackID}`,
                        timestamp: Date.now()
                    })
                    break;
            }
        }
    })

})

function sendTestData(str) {
    chrome.runtime.sendMessage({'action': 'play', 'trackID': str, 'progress': 0})
}

/** //-------------------- streamer-service.js -------------------- */
