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

window.onload = async () => {
	const urlParams = new URLSearchParams(window.location.search);
	const token = urlParams.get('token');
	if (token != null) {
		State.setAuthenticated(token)
	}
	document.getElementById("if_not_auth").style.display = "none"
	refreshBtns();
    if ((await State.getIsStreaming()) == true){
		ui_notifyStartStreaming();
	}
	else if ((await State.getIsListening()) != null){
		ui_notifyStartListening(await State.getIsListening());
	}
}

/** // -------------------- initializing -------------------- */


/** -------------------- functions.js -------------------- */
const exitButton = document.getElementById("exitButton");
const stream_switcher = document.getElementById("switcher");
const status_description = document.getElementById("status");
const text_form = document.getElementById("textForm");
const listen_button = document.getElementById("connectBtnId");
const auth_button = document.getElementById("authBtn");
const normal_display = document.getElementById("if_auth");
const not_auth_display = document.getElementById("if_not_auth");

// TODO DELETE
const btn_test_play = document.getElementById("test_play")
const btn_test_stop = document.getElementById("test_stop")
const btn_test_goto_35s = document.getElementById("test_goto_35")
const btn_test_goto_0s = document.getElementById("test_goto_0")
// END DELETE

const btnArr = ['l1', 'l2', 'l3', 'l4', 'l5']

class State {
	static setIsStreaming(flag){
		chrome.storage.local.set({isStreaming: flag}).then(() => "Setting succesfully");
	}

	static async getIsStreaming(){
		return (await chrome.storage.local.get(['isStreaming']))['isStreaming'];
	}
	
	static setIsListening(flag){
		chrome.storage.local.set({isListening: flag}).then(() => "Setting succesfully");
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
}

function ui_notifyStartListening(user_id)
{
	switcher.checked = false;
	status_description.innerText = "Now listening " + user_id;
	rearrangeBtns(user_id);
	listen_button.textContent = "Stop listening";
	listen_button.style.background = "linear-gradient(#e10101, #e10101)";
}

function ui_notifyStopListening()
{
	status_description.innerHTML = "Listening is stoped";
	listen_button.textContent = "Start listening";
	listen_button.style.background = "linear-gradient(#01a9e1, #5bc4bc)";
}

function ui_notifyStartStreaming()
{
	switcher.checked = true;
	status_description.innerHTML = "Now streaming";
}

function ui_notifyStopStreaming()
{
	switcher.checked = false;
	status_description.innerText = "Streaming is stoped";
}

setListeners();

function setListeners() {
	switcher = document.getElementById("switcher");
	switcher.addEventListener('click', async function() {
		if (this.checked) {
			if (!await State.isAuthenticated()){
				normal_display.style.display = "none"
				not_auth_display.style.display = "block"
			}
			else{
				StreamerService.startStreaming();
			}
		} else {
			StreamerService.stopStreaming();
		}
	});
	
    
    listen_button.addEventListener("click",async ()=> {
		if ((await State.getIsListening()) != null){
			ListenerService.stopListening();
		}
		else{
			if (!await State.isAuthenticated()){
				normal_display.style.display = "none"
				not_auth_display.style.display = "block"
			}
			else{
				nextUser = text_form.value;
				if (nextUser != ""){
					ListenerService.startListening(nextUser);
				}
			}
		}
    })

    btnArr.forEach(element => {
        last5btn = document.getElementById(element);
        last5btn.addEventListener("click",async ()=> {
            text_form.value = document.getElementById(element).textContent;
        })
    });

	auth_button.addEventListener("click", async () => {
		login();
		normal_display.style.display = "block"
		not_auth_display.style.display = "none"
    })

	exitButton.addEventListener("click", () => {
		ListenerService.stopListening();
		StreamerService.stopStreaming();
		State.setAuthenticated(null)
		normal_display.style.display = "none"
		not_auth_display.style.display = "block"
	})

	// TODO DELETE
	btn_test_play.addEventListener("click", () => {
		submitMockEvent(ActionTypes.PLAY)
	})

	btn_test_stop.addEventListener("click", () => {
		submitMockEvent(ActionTypes.STOP)
	})

	btn_test_goto_0s.addEventListener("click", () => {
		submitMockEvent(ActionTypes.GOTO)
	})

	btn_test_goto_35s.addEventListener("click", () => {
		submitMockEvent(ActionTypes.GOTO, 35)
	})
	// END DELETE
}

async function rearrangeBtns(nextUser) {
    historyArr = (await chrome.storage.local.get(['history']))['history'];
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

async function refreshBtns() {
    historyArr = (await chrome.storage.local.get(['history']))['history']
    for (let index = 0; index < btnArr.length; index++) {
        lastBtn = document.getElementById(btnArr[index]);
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
	const eventSource = new EventSource(url);
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
			Authorization: State.getAuthenticated(),
			"Content-Type": "application/json",
		},
	})
	.then(response => {
	  	if (!response.ok) {
			if (response.status === 401) {
				State.setAuthenticated(null)
			} else {
				throw new Error(`HTTP error while broadcastng event! Status: ${response.status}`);
			}
	  	}
	  	console.log(`ActionEvent (${actionEvent}) sent succesfully. Status Code: ${response.status}`);
	})
	.catch(error => {
	  	console.error('ActionEvent fetching error:', error);
	});
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
  	}
	/**
     * Event handler for incoming messages.
     * @param {MessageEvent<ActionEvent>} event - Message event.
     * @returns {void}
     */
  	static #onMessageHandler = (event) => console.log(event.data);

	/**
     * Event handler for errors.
     * @param {Event} error - Generic error event.
     * @returns {void}
     */
	static #onErrorHandler = (error) => console.error(error);

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
		this.listenedSource = createEventSourceListener(userId)
		this.#setListeners();
		State.setIsListening(userId)
		ui_notifyStartListening(user_id);
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
		ui_notifyStopListening();
	}
}

/** //-------------------- listener-service.js -------------------- */


/** -------------------- streamer-service.js -------------------- */

class StreamerService {

	static startStreaming() {
		ListenerService.stopListening()
		console.log("startStreaming")
		ui_notifyStopListening();
		ui_notifyStartStreaming();
		State.setIsStreaming(true)
	}
	
	static stopStreaming() {
		console.log("stopStreaming")
		ui_notifyStopStreaming();
		State.setIsStreaming(false)
	}
}

/** //-------------------- streamer-service.js -------------------- */

/**
 * @param {keyof ActionTypes} type 
 */
function submitMockEvent(type, position = 0) {
	const tracks = ["3934863:6348327", "2858790:65011", "305664:2836676", "305664:2836676", "24520975:110401140"]
    /** @type {ActionEvent} */
    let mockEvent = {
        action: type,
        position: position,
        trackId: tracks[Math.floor(Math.random() * tracks.length)],
        timestamp: Date.now()
    };

    sendStreamerEvent(mockEvent)
}
