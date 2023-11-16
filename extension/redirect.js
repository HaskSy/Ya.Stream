import {State} from "./popup.js";

window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    console.log('it runs')
    console.log(token)
    if (token != null) {
        State.setAuthenticated(token)
    }
}
