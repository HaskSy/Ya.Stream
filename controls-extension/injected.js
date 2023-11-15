var extensionID = "testID"

window.addEventListener("message", function(event) {
    if (event.source != window) { return; }
    switch (event.data.action) {
        case 'next':
            playNext()
            break;
        case 'prev':
            playPrevious()
            break;
        case 'play':
            playCurrent();
            break;
        case 'goto':
            console.log('payload on the page is')
            console.log(event.data.payload)
            gotoTime(event.data.payload);
            break;
    }
})

function playNext() {
    let p = externalAPI.next();
}

function playPrevious() {
    let p = externalAPI.prev();
}
function playCurrent() {
    let p = externalAPI.togglePause();
}

function gotoTime(time) {
    let res = externalAPI.setPosition(time)
    if (time != res) {
        console.log('somebody must start the track first')
        externalAPI.play().then(()=>{
            externalAPI.setPosition(time);
        })
    }
}