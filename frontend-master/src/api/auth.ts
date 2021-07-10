import config from "../config"
import {Session} from "./entities";
import {axiosInstance} from "./index";

type SigninPayload = {email: string, password: string}
export async function signinByEmail(payload: SigninPayload): Promise<Session> {
    const resp = await axiosInstance.post(config.endpointUrl + "/login/", JSON.stringify(payload))
    return JSON.parse(resp.data);
}

type SignupPayload = { email: string, password: string, full_name: string};
export async function signup(payload: SignupPayload): Promise<Session> {
    const resp = await axiosInstance.post(config.endpointUrl + "/signup/", JSON.stringify(payload));
    return JSON.parse(resp.data);
}
