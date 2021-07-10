import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import {StockArticle, Paginated} from "../api/entities";
import {listStockArticles} from "../api/stockArticles";

export type StockArticlesState = {
    fetching: boolean,
    error: string|null,
    paginated: Paginated<StockArticle>|null
}

const initialState: StockArticlesState = {
    fetching: false,
    error: null,
    paginated: null
}

export const performFetchStockArticles = createAsyncThunk(
    "stock-articles/getlist",
    async (params: {
        token: string,
        stockSymbol?: string,
        search: {query: string, releaseDate: string, provider: string, stockSymbol?: string},
        page: number,
        pageSize: number
    }, { rejectWithValue }) => {
        try {
            return await listStockArticles(params);
        } catch (e) {
            return rejectWithValue(e.response.data)
        }
    }
)

export const stockArticlesSlice = createSlice({
    name: "performFetchStockArticles",
    initialState: initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(performFetchStockArticles.pending, (state) => {
            state.fetching = true
            state.error = null
        })

        builder.addCase(performFetchStockArticles.fulfilled, (state, action) => {
            state.fetching = false
            state.error = null
            state.paginated = action.payload;
        })

        builder.addCase(performFetchStockArticles.rejected, (state, action) => {
            state.fetching = false
            state.error = action.error.message || null;
        })
    }
})

export default stockArticlesSlice.reducer;