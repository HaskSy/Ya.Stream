/** -------------------- initializing -------------------- */

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
        chrome.storage.local.set({history: ["empty", "empty", "empty", "empty", "empty"]}).then(() => console.log("Setting succesfully"));
    }
})

window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    console.log(token)
    if (token != null) {
        setAuthToken(token)
    }
    refreshBtns()
}

/** // -------------------- initializing -------------------- */


/** -------------------- functions.js -------------------- */
const connectBtn = document.getElementById("connectBtnId");
const btnArr = ['l1', 'l2', 'l3', 'l4', 'l5']
connectBtn.addEventListener("click",async ()=> {
    const nextUser = document.getElementById("textForm").value;
    if (nextUser != ""){
            nextUserIndex = historyArr.indexOf(nextUser);
        if (nextUserIndex != -1){
            historyArr.splice(nextUserIndex, 1);
        }
        else{
            historyArr.pop();
        }
        
        historyArr = [nextUser].concat(historyArr);
        chrome.storage.local.set({history: historyArr}).then(() => "Setting succesfully");  
        refreshBtns()
}
})

async function refreshBtns() {
    const historyArr = (await chrome.storage.local.get(['history']))['history']
    for (let index = 0; index < btnArr.length; index++) {
        const lastBtn = document.getElementById(btnArr[index]);
        lastBtn.textContent = historyArr[index];
    }
}

/** //-------------------- functions.js -------------------- */


/** -------------------- api-service.js -------------------- */

/**
 * Uniform object which is getting send to be broadcasted
 * @typedef {Object} ActionEvent
 * @property {keyof ActionTypes} action
 * @property {number} trackId
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

async function login() {
	chrome.tabs.create({
        'url': `${config.baseApiUrl}/login.html?redirect=` + encodeURIComponent(chrome.runtime.getURL('popup.html'))
    }, ()=>{})
}

/**
 * Establshing SSE connection for future listener setting
 * @param {string} userId 
 * @returns {EventSource}
 */
function createEventSourceListener(userId) {
	const url = `${config.baseApiUrl}/listen/${userId}`;
	const eventSource = new EventSource(url, {
		headers: {
	  		'Authorization': getAuthToken()
		}
	});
	return eventSource;
}

/**
 * Sends event to backend for further broadcasting to subscribers
 * @param {ActionEvent} actionEvent 
 */
function sendStreamerEvent(actionEvent) {
	const url = `${config.baseApiUrl}/stream`;
	const params = new URLSearchParams({
		event: actionEvent.action,
		track_id: actionEvent.trackId,
		position: actionEvent.position
	});

	fetch(`${url}?${params}`, {
		headers: {
			Authorization: getAuthToken(),
			"Content-Type": "application/json",
		},
	})
	.then(response => {
	  	if (!response.ok) {
			throw new Error(`HTTP error while broadcastng event! Status: ${response.status}`);
	  	}
	  	console.log(`ActionEvent (${actionEvent}) sent succesfully. Status Code: ${response.status}`);
	})
	.catch(error => {
	  	console.error('ActionEvent fetching error:', error);
	});
}

/**
 * Tries to obtain Authorization token from chrome.storage,
 * if fails returns undefined
 * @returns {string | undefined}
 */
async function getAuthToken() {
	let result = await chrome.storage.local.get(config.authTokenStorageLocation)
	return result[config.authTokenStorageLocation]
}

/**
 * Stores Authorization token in chrome.storage
 * @param {string} token 
 */
function setAuthToken(token) {
    let obj = {}
    obj[config.authTokenStorageLocation] = token;
	chrome.storage.local.set(obj);
}

/** // -------------------- api-service.js -------------------- */


/** -------------------- listener-service.js -------------------- */

/**
 * Service for handling real-time User Event listening using SSE.
 */
class ListenerService {

	constructor() {
		/** @type {string} */
		this.currentUser = "";
		/** @type {EventSource | undefined} */
	  	this.listenedSource = undefined;
	}

	/**
	 * Event handler for when the connection is open.
	 * @param {Event} e - Generic open event.
	 * @returns {void}
	 */
  	#onOpenHandler = (e) => {
		console.log(`The connection with user "${this.currentUser}" has been (re)establised`);
  	}
	/**
     * Event handler for incoming messages.
     * @param {MessageEvent<ActionEvent>} event - Message event.
     * @returns {void}
     */
  	#onMessageHandler = (event) => console.log(event.data);

	/**
     * Event handler for errors.
     * @param {Event} error - Generic error event.
     * @returns {void}
     */
	#onErrorHandler = (error) => console.error(error);

	#setListeners() {
		this.listenedSource.addEventListener("open", this.#onOpenHandler)
		this.listenedSource.addEventListener("message", this.#onMessageHandler)
		this.listenedSource.addEventListener("error", this.#onErrorHandler)
	}

	#unsetListeners() {
		this.listenedSource.removeEventListener("open", this.#onOpenHandler)
		this.listenedSource.removeEventListener("message", this.#onMessageHandler)
		this.listenedSource.removeEventListener("error", this.#onErrorHandler)
	}

	/**
	 * Starts listening to real-time events for the specified user.
	 * @param {string} userId - Yandex ID of the user to listen to.
	 * @returns {void}
	 */
	async startListening(userId) {
	  	this.stopListening();
		this.listenedSource = createEventSourceListener(userId)
		this.currentUser = userId;
		this.#setListeners();
	}
  
	/**
   	 * Stop listening to real-time events.
   	 * @returns {void}
   	 */
	stopListening() {
	  	if (this.listenedSource) {
			this.#unsetListeners();
			this.listenedSource.close();
			delete this.listenedSource;
			this.currentUser = "";
	  	}
	}
}

/** //-------------------- listener-service.js -------------------- */

/**
 * @param {keyof ActionTypes} type 
 */
function submitMockEvent(type) {
    /** @type {ActionEvent} */
    let mockEvent = {
        action: type,
        position: 0,
        trackId: 0,
        timestamp: 0
    };

    sendStreamerEvent(mockEvent)
}
