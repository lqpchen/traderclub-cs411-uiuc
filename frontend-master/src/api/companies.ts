import config from "../config"
import {Paginated, Stock, StockSentiment} from "./entities";
import {axiosInstance} from "./index";

type StockSentimentPayload = {
    token: string;
    stock_symbol: string;
};

export type StockSentiments = {result: StockSentiment, symbol: string};

export async function fetchStocksSentiment(payload: StockSentimentPayload): Promise<StockSentiments> {
    const response = await axiosInstance.get(
        config.endpointUrl + "/stocks/" + payload.stock_symbol + "/articles-sentiment/",
        { headers: { Authorization: `Bearer ${payload.token}` } }
    );
    return {result: response.data, symbol: payload.stock_symbol};
}

type ListCompaniesPayload = {
    token: string,
    page: number,
    page_size: number,
    sortedBy: string|null,
    sortedByDirection: string|null
};

export async function listCompanies(payload: ListCompaniesPayload): Promise<Paginated<Stock>> {
    const response = await axiosInstance.get(
    config.endpointUrl + "/stocks/?page=" + payload.page + "&page_size=" + payload.page_size +
        (payload.sortedBy ? "&sort_column=" + payload.sortedBy + "&sort_direction=" + payload.sortedByDirection : ""),
    { headers: { Authorization: `Bearer ${payload.token}` } }
    );
    return response.data;
}
