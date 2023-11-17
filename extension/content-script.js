'use strict'
function main() {
    /** This method call event listener in service-worker to register new music tab*/
    chrome.runtime.sendMessage({ greeting: 'hello' })
    chrome.runtime.onMessage.addListener(handleEvent)

    chrome.runtime.sendMessage({greeting: 'getID'}, (response) => {
        injectJS(response.id);
    })

    window.onbeforeunload = () => {
        if (chrome.runtime?.id) {
            chrome.runtime.sendMessage({ greeting: 'bye' })
        }
    }
}

function handleEvent(request) {
    if (request) {
        let payload = request.payload

        switch (request.action) {
            case 'next':
            case 'prev':
            case 'play':
            case 'stop':
            case 'goto':
                window.postMessage(request, '*');
                break;
            default:
                console.log('something strange in content-script in content-script.onMessage')
                console.log(request.action)
        }
    }
}

/**
 * Because we cannot call objects on the page, we need this injection
 */
let injectJS = (id) => {
    let scriptURL = chrome.runtime.getURL('injected.js');
    let docs = document.getElementsByTagName('script')
    for (const doc of docs) {
        if (doc.src === scriptURL){
            doc.remove()
            console.log(`Node with script deleted, but content-script is already running in this tab. There will be many events for this one`)
        }
    }

    let scriptElem = document.createElement('script');
    scriptElem.src = scriptURL;
    scriptElem.onload = () => {
        window.postMessage({id: id})
        // this.remove();
    }
    (document.head || document.documentElement).appendChild(scriptElem);
    console.log('js injected')
}

main()
