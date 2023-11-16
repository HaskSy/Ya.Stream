let extensionID = ""
let port

window.addEventListener("message", function(event) {
    if (event.source !== window) { return; }
    switch (event.data.action) {
        case 'next':
            playNext()
            break;
        case 'prev':
            playPrevious()
            break;
        case 'play':
        case 'stop':
            playCurrent(event.data.action === 'stop');
            break;
        case 'goto':
            console.log('payload on the page is')
            console.log(event.data.payload)
            gotoTime(event.data.payload);
            break;
    }
    // dirty-dirty hack. See content-script.js:injectJS
    if (event.data.id) {
        extensionID = event.data.id
        port = chrome.runtime.connect(extensionID)
    }
})

/**
 * Subscribe on song change.
 * This will send data right into popup.js
 */
externalAPI.on(externalAPI.EVENT_TRACK, (event) => {
    console.log('sending setCurrentTrack event')
    sendToServiceWorker('setCurrentTrack')
})

/**
 * @param {String} sendDataType
 */
function sendToServiceWorker(sendDataType) {
    chrome.runtime.sendMessage(extensionID, {
        dataType: sendDataType,
        currentTrack: externalAPI.getCurrentTrack(),
        isPlaying: externalAPI.isPlaying(),
        progress: externalAPI.getProgress(),
        // maybe some info about playlist, track index in playlist? (I don't think that it's essential)
    }, );
}

function playNext() {
    // externalAPI event will call itself.
    // Do not send event from here about changed track
    let p = externalAPI.next();
}

function playPrevious() {
    // externalAPI event will call itself.
    // Do not send event from here about changed track
    let p = externalAPI.prev();
}
function playCurrent(state) {
    let p = externalAPI.togglePause(state);
    sendToServiceWorker('togglePause')
}

function gotoTime(time) {
    let res = externalAPI.setPosition(time)
    if (time !== res) {
        console.log('somebody must start the track first')
        externalAPI.play().then(()=>{
            externalAPI.setPosition(time);
        })
    }
}