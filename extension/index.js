export {State}

const broadcast = new BroadcastChannel('sw-ui-update');
broadcast.onmessage = (event) => {
	const msg = event.data;

	console
	switch (msg) {
		case ListenEvents.START:
			ui_notifyStartListening()
			break;
		case ListenEvents.STOP:
			ui_notifyStopListening()
			break;
		case StreamEvents.START:
			ui_notifyStartStreaming()
			break;
		case StreamEvents.STOP:
			ui_notifyStopStreaming()
			break;
	}
}
/** -------------------- initializing -------------------- */

/**
 * Enum of actions which can be sent to listen events
 * @readonly
 * @enum {string}
 */
const ListenEvents = {
	START: 'startListen',
	STOP: 'stopListen',
}

/** @type {ExtentionConfig} */
let config = {
	"baseApiUrl": "https://music.gvsem.com",
	"authTokenStorageLocation": "authToken"
}

/**
 * Enum of actions which can be sent to streamer events
 * @readonly
 * @enum {string}
 */
const StreamEvents = {
	START: 'startStream',
	STOP: 'stopStream',
}

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

	static setTextFormContent(text_content) {
		chrome.storage.local.set({textContent: text_content}).then(() => "Setting succesfully");
	}

	static async getTextFormContent() {
		return (await chrome.storage.local.get(['textContent']))['textContent'];
	}
}

async function login() {
	chrome.tabs.create({
		'url': `${config.baseApiUrl}/login.html?redirect=` + encodeURIComponent(chrome.runtime.getURL('popup.html'))
	}, ()=>{})
}

/**
 * @param {ListenEvents} type or stopListen
 * @param {String} username id of user
 */
function sendListenEvent(type, username = "") {
	chrome.runtime.sendMessage({greeting: type, username: username})
}

/**
 * @param {StreamEvents} type startStream or stopStream
 */
function sendStreamerEvent(type) {
	chrome.runtime.sendMessage({greeting: type})
}

document.addEventListener('DOMContentLoaded', async () => {
	if(!(await State.isAuthenticated())) {
		document.getElementById("if_auth").style.display = "none"
	}
	else{
		document.getElementById("if_not_auth").style.display = "none"
	}

	refreshBtns();
	if ((await State.getIsStreaming()) === true){
		ui_notifyStartStreaming();
	}
	else if ((await State.getIsListening()) != null){
		ui_notifyStartListening(await State.getIsListening());
	}
	setListeners();
})

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

const btnArr = ['l1', 'l2', 'l3', 'l4', 'l5']

async function ui_notifyStartListening() {
	const userId = await State.getIsListening()
	if (userId !== null) {
		stream_switcher.checked = false;
		status_description.innerText = "Now listening " + userId;
		rearrangeBtns(userId);
		listen_button.textContent = "Stop listening";
	}
}

function ui_notifyStopListening() {
	status_description.innerHTML = "Listening is stoped";
	listen_button.textContent = "Start listening";
}

function ui_notifyStartStreaming() {
	stream_switcher.checked = true;
	status_description.innerHTML = "Now streaming";
}

function ui_notifyStopStreaming() {
	stream_switcher.checked = false;
	status_description.innerText = "Streaming is stoped";
}


function setListeners() {
	stream_switcher.addEventListener('click', async function() {
		if (this.checked) {
			if (!await State.isAuthenticated()){
				normal_display.style.display = "none"
				not_auth_display.style.display = "block"
			}
			else{
				sendListenEvent(StreamEvents.STOP)
				sendStreamerEvent(StreamEvents.START)
			}
		} else {
			sendStreamerEvent(StreamEvents.STOP)
		}
	});


    listen_button.addEventListener("click",async ()=> {
		if ((await State.getIsListening()) != null){
			sendListenEvent(ListenEvents.STOP)
		}
		else{
			if (!await State.isAuthenticated()){
				normal_display.style.display = "none"
				not_auth_display.style.display = "block"
			}
			else{
				let nextUser = text_form.value;
				if (nextUser !== "") {
					sendListenEvent(ListenEvents.START, nextUser)
				}
			}
		}
    })

    btnArr.forEach(element => {
        let last5btn = document.getElementById(element);
        last5btn.addEventListener("click",async ()=> {
            text_form.value = document.getElementById(element).textContent;
			State.setTextFormContent(text_form.value);
        })
    });

	auth_button.addEventListener("click", async () => {
		login();
		normal_display.style.display = "block"
		not_auth_display.style.display = "none"
    })

	text_form.addEventListener('change', async () => {
		State.setTextFormContent(text_form.value);
    })

	exitButton.addEventListener("click", () => {
		sendListenEvent(ListenEvents.STOP)
		sendStreamerEvent(StreamEvents.STOP)
		State.setAuthenticated(null)
		normal_display.style.display = "none"
		not_auth_display.style.display = "block"
	})
}

async function rearrangeBtns(nextUser) {
    let historyArr = (await chrome.storage.local.get(['history']))['history'];
    let nextUserIndex = historyArr.indexOf(nextUser);
    if (nextUserIndex !== -1){
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
    let historyArr = (await chrome.storage.local.get(['history']))['history']
    for (let index = 0; index <btnArr.length; index++) {
        let lastBtn = document.getElementById(btnArr[index]);
        lastBtn.textContent = historyArr[index];
    }
}

/** //-------------------- functions.js -------------------- */