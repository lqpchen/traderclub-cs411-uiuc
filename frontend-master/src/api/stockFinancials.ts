import config from "../config"
import {Paginated, StockFinancials} from "./entities";
import {axiosInstance} from "./index";

type ListStockFinancialsPayload = {
    token: string,
    stockSymbol: string,
    page: number,
    pageSize: number
};

export async function listStockFinancials(payload: ListStockFinancialsPayload): Promise<Paginated<StockFinancials>> {
    const response = await axiosInstance.get(
        config.endpointUrl + "/stocks/" + payload.stockSymbol + "/financials/?page=" + payload.page
        + "&page_size=" + payload.pageSize,
        { headers: { Authorization: `Bearer ${payload.token}` } }
    );

    return response.data;
}