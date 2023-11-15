'use strict'

var yandexTabID = []

chrome.runtime.onMessage.addListener((response, sender) => {
    if (response.greeting === 'hello') {
        yandexTabID.push(sender.tab.id)
        console.log('added tab')
        console.log(sender.tab.id)
        console.log('yandexTabID')
        console.log(yandexTabID[0])
    } else if (response.greeting === 'bye') {
        yandexTabID = yandexTabID.filter(item => item !== sender.tab.id)
    } else {
        // play, next, prev
        console.log('payload is')
        console.log(response.payload)
        chrome.tabs.sendMessage(yandexTabID[0], {'action': response.action, 'payload': response.payload})
    }
})