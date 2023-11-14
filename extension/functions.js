const connectBtn = document.getElementById("connectBtnId");
btnArr = ['l1', 'l2', 'l3', 'l4', 'l5']
connectBtn.addEventListener("click",async ()=> {
    const nextUser = document.getElementById("textForm").value;
    if (nextUser != ""){
            nextUserIndex = historyArr.indexOf(nextUser);
        if (nextUserIndex != -1){
            historyArr.splice(nextUserIndex, 1);
        }
        else{
            historyArr.pop();
        }
        
        historyArr = [nextUser].concat(historyArr);
        chromeLocalStorage.set({history: historyArr}).then(() => "Setting succesfully");  
        refreshBtns()
}
})

window.onload = async () => {
    refreshBtns()
}

async function refreshBtns() {
    historyArr = (await chromeLocalStorage.get(['history']))['history']
    btnArr = ['l1', 'l2', 'l3', 'l4', 'l5']
    for (let index = 0; index < btnArr.length; index++) {
        lastBtn = document.getElementById(btnArr[index]);
        lastBtn.textContent = historyArr[index];
    }
}
