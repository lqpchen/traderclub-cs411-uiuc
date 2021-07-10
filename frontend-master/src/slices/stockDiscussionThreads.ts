import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import {DiscussionThread, Paginated} from "../api/entities";
import {listStockDiscussionThreads} from "../api/discussionThreads";

export type StockDiscussionThreadsState = {
    fetching: boolean,
    error: string|null,
    paginated: Paginated<DiscussionThread>|null
}

const initialState: StockDiscussionThreadsState = {
    fetching: false,
    error: null,
    paginated: null
}

export const performFetchStockDiscussionThreads = createAsyncThunk(
    "stock-discussion-threads/getlist",
    async (params: {token: string, stockSymbol?: string, page: number, pageSize: number}, { rejectWithValue }) => {
        try {
            return await listStockDiscussionThreads(params);
        } catch (e) {
            return rejectWithValue(e.response.data)
        }
    }
)

export const stockDiscussionThreadsSlice = createSlice({
    name: "stockDiscussionThreads",
    initialState: initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(performFetchStockDiscussionThreads.pending, (state) => {
            state.fetching = true
            state.error = null
        })

        builder.addCase(performFetchStockDiscussionThreads.fulfilled, (state, action) => {
            state.fetching = false
            state.error = null
            state.paginated = action.payload;
        })

        builder.addCase(performFetchStockDiscussionThreads.rejected, (state, action) => {
            state.fetching = false
            state.error = action.error.message || null;
        })
    }
})

export default stockDiscussionThreadsSlice.reducer;