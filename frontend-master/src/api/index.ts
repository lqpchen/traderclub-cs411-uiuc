import axios from "axios";
import {store} from "../store";
import {loggedOut} from "../slices/user";

axios.defaults.headers.common['Content-Type'] = 'application/json';

axios.interceptors.response.use(
    function (response) {
        return response
    },
    (error) => {
        if (error.response && 401 === error.response.status) {
            store.dispatch(loggedOut(null))
        }

        return Promise.reject(error)
    }
)

export const axiosInstance = axios.create({
    validateStatus: function (status) {
        return status < 300;
    }
})