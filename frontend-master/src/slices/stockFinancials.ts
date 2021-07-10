import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import {Paginated, StockFinancials} from "../api/entities";
import {listStockFinancials} from "../api/stockFinancials";

export type StockFinancialsState = {
    fetching: boolean,
    error: string|null,
    paginated: Paginated<StockFinancials>|null
}

const initialState: StockFinancialsState = {
    fetching: false,
    error: null,
    paginated: null
}

export const performFetchStockFinancials = createAsyncThunk(
    "stock-financials/getlist",
    async (params: {
        token: string,
        stockSymbol: string,
        page: number,
        pageSize: number
    }, { rejectWithValue }) => {
        try {
            return await listStockFinancials(params);
        } catch (e) {
            return rejectWithValue(e.response.data)
        }
    }
)

export const stockFinancialsSlice = createSlice({
    name: "performFetchStockFInancials",
    initialState: initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(performFetchStockFinancials.pending, (state) => {
            state.fetching = true
            state.error = null
        })

        builder.addCase(performFetchStockFinancials.fulfilled, (state, action) => {
            state.fetching = false
            state.error = null
            state.paginated = action.payload;
        })

        builder.addCase(performFetchStockFinancials.rejected, (state, action) => {
            state.fetching = false
            state.error = action.error.message || null;
        })
    }
})

export default stockFinancialsSlice.reducer;