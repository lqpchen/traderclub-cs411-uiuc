import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { fetchQuotes } from "../api/quotes"
import {Quote} from "../api/entities";

export type StockQuotesState = {
    fetching: boolean,
    error: string|null,
    quotes: {[key: string]: Quote[]}
}

const initialState: StockQuotesState = {
    fetching: false,
    error: null,
    quotes: {}
}

export const performFetchStockQuotes = createAsyncThunk(
    "quotes/fetchHistory",
    async (params: {token: string, stock_symbol: string, date_from?: number, date_to?: number}, { rejectWithValue }) => {
        try {
            return await fetchQuotes(params);
        } catch (e) {
            return rejectWithValue(e.response.data)
        }
    }
)

export const stockQuotesSlice = createSlice({
    name: "stockQuotes",
    initialState: initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(performFetchStockQuotes.pending, (state) => {
            state.fetching = true
            state.error = null
        })

        builder.addCase(performFetchStockQuotes.fulfilled, (state, action) => {
            state.fetching = false
            state.error = null
            state.quotes[action.payload.symbol] = action.payload.results;
        })

        builder.addCase(performFetchStockQuotes.rejected, (state, action) => {
            state.fetching = false
            state.error = action.error.message || null;
        })
    }
})

export default stockQuotesSlice.reducer;