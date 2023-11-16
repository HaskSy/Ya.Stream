'use strict'

/** These two methods call event listener in service-worker to register new music tab*/
chrome.runtime.sendMessage({ greeting: 'hello' })

window.onbeforeunload = () => {
    chrome.runtime.sendMessage({ greeting: 'bye' })
}

chrome.runtime.onMessage.addListener(request => {
    if (request) {
        let payload = request.payload

        switch (request.action) {
            case 'next':
            case 'prev':
            case 'play':
            case 'pause':
            case 'goto':
                window.postMessage({'action': request.action, 'payload': payload}, '*');
                break;
            default:
                console.log('something strange in content-script in chrome.runtime.onMessage')
                console.log(request.action)
        }
    }
})
/**
 * Because we cannot call objects on the page, we need this injection
 */
let injectJS = (id) =>{
    let scriptElem = document.createElement('script');
    scriptElem.src = chrome.runtime.getURL('injected.js');
    scriptElem.onload = () => {
        window.postMessage({id: id})
        // this.remove();
    }
    (document.head || document.documentElement).appendChild(scriptElem);
    console.log('js injected')
}

chrome.runtime.sendMessage({greeting: 'getID'}, (response) => {
    console.log('response return id')
    console.log(response.id)
    injectJS(response.id);
})