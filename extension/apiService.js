import config from './config.json' assert { type: "json" };

const baseApiUrl = config.baseApiUrl;
const authTokenStorage = config.authTokenStorageLocation;

const eventMap = new Map();

const actionsEnum = {
	PLAY: 'play',
	STOP: 'stop',
	NEXT: 'next',
	PREV: 'prev',
	GOTO: 'goto'
}

async function login() {
	chrome.tabs.create({'url': 'https://music.gvsem.com/login.html?redirect=' + chrome.runtime.getURL('popup.html')}, ()=>{})
}

async function startListening(user_id) {
	const url = `${baseApiUrl}/listen/${user_id}`;
	const eventSource = new EventSource(url, {
		headers: {
			'Authorization': "Bearer " + getAutrorizationHeader()
		}
	});

	eventSource.onmessage = (event) => console.log(event.data)
	eventSource.onerror = (error) => console.error(error);
	stopListening(user_id)
	eventMap.set(user_id, eventSource)
	return eventSource;
}

function stopListening(user_id) {
	if (eventMap.has(user_id)) {
		eventSource = eventMap.get(user_id)
		eventSource.removeEventListener('message')
		eventSource.removeEventListener('error')
	}
}

async function stream(action, payload) {
	const url = `${baseApiUrl}/stream`;
	const params = new URLSearchParams({
		event: action,
		payload: JSON.stringify(payload),
	});

	const response = await fetch(`${url}?${params}`, {
		headers: {
			Authorization: "Bearer " + getAutrorizationHeader(),
			"Content-Type": "application/json",
		},
	});
	return response.json();
}

async function getUser(user_id) {
	const url = `${baseApiUrl}/users/${user_id}`;
	const response = await fetch(url, {
		headers: {
			Authorization: "Bearer " + getAutrorizationHeader(),
			"Content-Type": "application/json",
		},
	});
	return response.json();
}

async function getAutrorizationHeader() {
	let result;
	chrome.storage.local.get(authTokenStorage).then((res) => (result = res));
	return result;
}

function storeAuthorizationHeader(token) {
	chrome.storage.local.set({ authTokenStorage: token });
}
