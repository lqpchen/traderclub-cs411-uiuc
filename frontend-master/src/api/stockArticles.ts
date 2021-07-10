import config from "../config"
import {Paginated, StockArticle} from "./entities";
import {axiosInstance} from "./index";

type ListStockArticlesPayload = {
    token: string,
    stockSymbol?: string,
    page: number,
    pageSize: number,
    search: {
        stockSymbol?: string,
        query: string,
        releaseDate: string,
        provider: string
    }
};

export async function listStockArticles(payload: ListStockArticlesPayload): Promise<Paginated<StockArticle>> {
    const response = await axiosInstance.get(
        config.endpointUrl + "/stocks" + (payload.stockSymbol ? "/" + payload.stockSymbol : "") + "/articles/?page=" + payload.page
        + "&page_size=" + payload.pageSize
            + (payload.search.stockSymbol ? "&search_stock_symbol=" + payload.search.stockSymbol : "")
            + (payload.search.query ? "&search_query=" + payload.search.query : "")
            + (payload.search.releaseDate ? "&search_release_date=" + payload.search.releaseDate : "")
            + (payload.search.provider ? "&search_provider=" + payload.search.provider : ""),
        { headers: { Authorization: `Bearer ${payload.token}` } }
    );

    const page: Paginated<any> = response.data;
    return {
        results: page.results.map((r: any) => Object.assign(r, {release_date: new Date(Date.parse(r.release_date))})),
        total: page.total
    };
}