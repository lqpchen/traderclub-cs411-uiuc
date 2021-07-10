import config from "../config"
import {axiosInstance} from "./index";

export function signup(email: string, password: string): Promise<void> {
    return axiosInstance.post(config.endpointUrl + "/signup", {
        email,
        password
    })
}
