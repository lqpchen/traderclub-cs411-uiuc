import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import {DiscussionThreadReply, Paginated} from "../api/entities";
import {listStockDiscussionThreadReplies} from "../api/discussionThreadReplies";
import {fetchDiscussionThreadReply} from "../api/discussionThreads";

export type StockDiscussionThreadRepliesState = {
    fetching: boolean,
    error: string|null,
    paginated: Paginated<DiscussionThreadReply>|null,
    reply: DiscussionThreadReply|null
}

const initialState: StockDiscussionThreadRepliesState = {
    fetching: false,
    error: null,
    paginated: null,
    reply: null
}

export const performFetchDiscussionThreadReplyDetails = createAsyncThunk(
    "stock-discussion-thread-reply-details/fetch",
    async (params: {token: string, stockSymbol: string, replyId: number}, { rejectWithValue }) => {
        try {
            return await fetchDiscussionThreadReply(params);
        } catch (e) {
            return rejectWithValue(e.response.data)
        }
    }
)

export const performFetchStockDiscussionThreadReplies = createAsyncThunk(
    "stock-discussion-thread-replies/getlist",
    async (params: {token: string, stockSymbol: string, threadId: number, parentId: number|null, page: number, pageSize: number}, { rejectWithValue }) => {
        try {
            return await listStockDiscussionThreadReplies(params);
        } catch (e) {
            return rejectWithValue(e.response.data)
        }
    }
)

export const stockDiscussionThreadRepliesSlice = createSlice({
    name: "stockDiscussionThreadReplies",
    initialState: initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(performFetchStockDiscussionThreadReplies.pending, (state) => {
            state.fetching = true
            state.error = null
        })

        builder.addCase(performFetchStockDiscussionThreadReplies.fulfilled, (state, action) => {
            state.fetching = false
            state.error = null
            state.paginated = action.payload;
        })

        builder.addCase(performFetchStockDiscussionThreadReplies.rejected, (state, action) => {
            state.fetching = false
            state.error = action.error.message || null;
        })

        builder.addCase(performFetchDiscussionThreadReplyDetails.pending, (state) => {
            state.fetching = true
            state.error = null
        })

        builder.addCase(performFetchDiscussionThreadReplyDetails.fulfilled, (state, action) => {
            state.fetching = false
            state.error = null
            state.reply = action.payload;
        })

        builder.addCase(performFetchDiscussionThreadReplyDetails.rejected, (state, action) => {
            state.fetching = false
            state.error = action.error.message || null;
        })
    }
})

export default stockDiscussionThreadRepliesSlice.reducer;