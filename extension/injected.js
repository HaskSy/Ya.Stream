let extensionID = ""
let port
let lastTrackTime = 0

window.addEventListener("message", function(event) {
    if (event.source !== window) { return; }
    switch (event.data.action) {
        case 'next':
            console.log('going to next track')
            playNext()
            break;
        case 'prev':
            console.log('going to previous track')
            playPrevious()
            break;
        case 'play':
            console.log('playing track:')
            console.log(event.data.trackID)
            playTrack(event.data.trackID, event.data.progress);
            break;
        case 'stop':
            console.log('track stopped')
            playTrack(event.data.trackID, event.data.progress);
            stopCurrent(event.data.trackID, event.data.progress);
            break;
        case 'goto':
            console.log('going to the time')
            console.log(event.data.progress)
            playTrack(event.data.trackID, event.data.progress);
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
externalAPI.on(externalAPI.EVENT_TRACK, () => {
    console.log('sending \'play\' event')
    sendToServiceWorker('play')
})

externalAPI.on(externalAPI.EVENT_PROGRESS, () => {
    let currentTrackTime = externalAPI.getProgress().position;
    if (Math.abs(currentTrackTime - lastTrackTime) > 1) {
       sendToServiceWorker('goto')
    }
    lastTrackTime = currentTrackTime
})

externalAPI.on(externalAPI.EVENT_STATE, () => {
    let event = externalAPI.isPlaying() ? 'play' : 'stop'
    sendToServiceWorker(event)
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

function navigateTo(trackID, progress){
    // link looks like '/album/12345/track/54321'
    const regex = new RegExp('[0-9]+','g')
    let p = externalAPI.getCurrentTrack().link
    let iterator = p.matchAll(regex)
    let currentAlbumID = iterator.next().value[0]
    let currentTrackID = iterator.next().value[0]

    let playlistAndTrackID = trackID.split(':')
    if (currentAlbumID === playlistAndTrackID[0] && currentTrackID === playlistAndTrackID[1]){
        let p = externalAPI.togglePause(false);
        gotoTime(progress);
        return Promise.resolve()
    } else {
        externalAPI.navigate(`/album/${playlistAndTrackID[0]}/track/${playlistAndTrackID[1]}`)
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                document
                    .getElementsByClassName('d-track_selected')
                    [0].getElementsByClassName('button-play')
                    [0].click()
                setTimeout(() => {
                    gotoTime(progress)
                },200)
            }, 1000)
            resolve()
        })
    }
}
function playTrack(trackID, progress) {
    console.log('setting current progress to')
    console.log(progress)
    navigateTo(trackID, progress)
}

function stopCurrent(trackID, progress) {
    navigateTo(trackID, progress).then(() => {
        let p = externalAPI.togglePause(true);
        sendToServiceWorker('pause')
    })
}

function gotoTime(time) {
    let res = externalAPI.setPosition(time)
    //TODO: website won't work normally if you did not clicked at something on the page
    // How we can bypass it?
    if (time !== res) {
        console.log('somebody must start the track first')
        // document.getElementsByClassName('player-controls__btn_play')[0].click()
        let previousValue = externalAPI.isPlaying()
        externalAPI.play().then(()=> {
            externalAPI.setPosition(time)
        })
        externalAPI.togglePause(!previousValue)
    }
}