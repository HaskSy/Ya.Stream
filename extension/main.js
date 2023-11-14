const chromeLocalStorage = chrome.storage.local

function init() {
    chromeLocalStorage.get(["history"], (history) => {
        if (history === {} || !history['history']) {
            chromeLocalStorage.set({"history": []})
        }
    })
}

init()