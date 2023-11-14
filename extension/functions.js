
    const connectBtn = document.getElementById("connectBtnId");

    connectBtn.addEventListener("click",() => {    

        chromeLocalStorage.set({key: "gdhgdshwe"}).then(() => "Setting succesfully")

        chromeLocalStorage.get(['key']).then((historyObj) => {
            history = historyObj['key']
        })

    })