'use strict'

document.addEventListener('click', e => {
    let action = e.target.id
    if (!e.target.classList.contains('button')) return
    let p = Number(document.getElementById('time').value)
    chrome.runtime.sendMessage({action, payload: p})
})