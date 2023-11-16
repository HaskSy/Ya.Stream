import {State} from "./index.js";

window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    console.log('redirect worked')
    if (token != null) {
        await State.setAuthenticated(token)
        window.close()
    }
}
