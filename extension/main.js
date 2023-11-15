const chromeLocalStorage = chrome.storage.local

function init() {
    const chromeLocalStorage = chrome.storage.local
    //chromeLocalStorage.set({history: ["empty", "empty", "empty", "empty", "empty"]}).then(() => "Setting succesfully");
    chromeLocalStorage.get(['history']).then((historyObj) => {
         if (historyObj['history'] === undefined) {
                chromeLocalStorage.set({history: ["empty", "empty", "empty", "empty", "empty"]}).then(() => "Setting succesfully");
            }
        }
    )
}

init()

const urlParams = new URLSearchParams(window.location.search);
const token = console.log(urlParams.get('token'));

if (token != null) {
    chromeLocalStorage.set({"yastream token": token})
}