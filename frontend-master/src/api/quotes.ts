import config from "../config"
import {Quote} from "./entities";
import {axiosInstance} from "./index";
import moment from "moment";

export type PredictedReturns = {
    short_ratio: number;
    long_ratio: number;
    ratio: number;
    predicted_return: number;
}

type FetchPredictedReturnsPayload = {
    token: string;
    stock_symbol: string;
    start_date: Date;
    prediction_date: Date;
}

export async function fetchPredictedReturns(payload: FetchPredictedReturnsPayload): Promise<PredictedReturns> {
    console.log("Fetch predicted data", payload);
    const response = await axiosInstance.get(
        config.endpointUrl + "/stocks/" + payload.stock_symbol + "/predicted-returns/?" +
            "start_date=" + moment(payload.start_date).format("YYYY-MM-DD") +
            "&prediction_date=" + moment(payload.prediction_date).format("YYYY-MM-DD"),
        { headers: { Authorization: `Bearer ${payload.token}` } }
    );

    return response.data;
}

type ListQuotesPayload = {
    token: string,
    stock_symbol: string,
    date_from?: number,
    date_to?: number
};

export async function fetchQuotes(payload: ListQuotesPayload): Promise<{results: Quote[], symbol: string}> {
    const response = await axiosInstance.get(
        config.endpointUrl + "/stocks/" + payload.stock_symbol + "/quotes/" + (payload.date_from ?  payload.date_from + "/" + payload.date_to : ""),
        { headers: { Authorization: `Bearer ${payload.token}` } }
    );
    const results = (response.data as any[]).map(v =>
        Object.assign({}, v, {quote_date: new Date(Date.parse(v.quote_date))})
    );

    return {results, symbol: payload.stock_symbol};
}
