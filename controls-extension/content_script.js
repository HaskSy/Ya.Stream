'use strict'

chrome.runtime.sendMessage({ greeting: 'hello' })

window.onbeforeunload = () => {
    chrome.runtime.sendMessage({ greeting: 'bye' })
}

chrome.runtime.onMessage.addListener(request => {
    if (request) {
        console.log('action is')
        console.log(request.action)
        let payload = request.payload

        switch (request.action) {
            case 'next':
                next();
                break;
            case 'prev':
                previous();
                break;
            case 'play':
                play();
                break;
            case 'goto':
                goto(payload);
                break;
        }
    }
})

let injectJS = () =>{
    var scriptElem = document.createElement('script');
    scriptElem.src = chrome.runtime.getURL('injected.js'); // aaaa
    scriptElem.onload = () => {
        this.remove();
    }
    (document.head || document.documentElement).appendChild(scriptElem);
}

injectJS();

function next() {
    window.postMessage({action: 'next'}, '*');
}
function previous() {
    window.postMessage({action: 'prev'}, '*');
}

function play() {
    window.postMessage({action: 'play'}, '*');
}

function goto(value) {
    window.postMessage({action: 'goto', payload: value}, '*')
}