function init() {
    const chromeLocalStorage = chrome.storage.local
    
    chromeLocalStorage.get(["history"], (history) => {
        if (history === undefined || !history) {
            chromeLocalStorage.set({"history": []})
        }
    })
}

init()