import config from "../config"
import {Paginated, Stock} from "./entities";
import {axiosInstance} from "./index";

type ListFavouriteStocksIdsPayload = {
    token: string
};

export async function fetchFavouriteStockIds(payload: ListFavouriteStocksIdsPayload): Promise<number[]> {
    const response = await axiosInstance.get(
        config.endpointUrl + "/stocks/favourite-ids/",
    { headers: { Authorization: `Bearer ${payload.token}` } }
    );
    return response.data;
}

type WatchlistActionPayload = {
    stockId: number;
    token: string;
}

export async function addToWatchlist(payload: WatchlistActionPayload): Promise<void> {
    const response = await axiosInstance.post(
        config.endpointUrl + "/stocks/favourite/" + payload.stockId,
        {},
        { headers: { Authorization: `Bearer ${payload.token}` } }
    );
    return response.data;
}

export async function deleteFromWatchlist(payload: WatchlistActionPayload): Promise<void> {
    const response = await axiosInstance.delete(
        config.endpointUrl + "/stocks/favourite/" + payload.stockId,
        { headers: { Authorization: `Bearer ${payload.token}` } }
    );
    return response.data;
}

type ListFavouriteStocksPayload = {
    token: string,
    page: number,
    page_size: number,
    sortedBy: string|null,
    sortedByDirection: string|null
};

export async function fetchFavouriteStocks(payload: ListFavouriteStocksPayload): Promise<Paginated<Stock>> {
    const response = await axiosInstance.get(config.endpointUrl + "/stocks/favourite/?page=" + payload.page + "&page_size=" + payload.page_size,
        { headers: { Authorization: `Bearer ${payload.token}` } }
    );
    return response.data;
}