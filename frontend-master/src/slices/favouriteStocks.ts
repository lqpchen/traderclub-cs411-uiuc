import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import {fetchFavouriteStockIds, fetchFavouriteStocks} from "../api/favouriteStocks"
import {Paginated, Stock} from "../api/entities";

export type FavouriteStocksState = {
    list: {
        fetching: boolean,
        error: string | null,
        data: Paginated<Stock> | null
    },
    ids: {
        fetching: boolean,
        error: string | null,
        data: number[]
    }
}

const initialState: FavouriteStocksState = {
    list: {
        fetching: false,
        error: null,
        data: null
    },
    ids: {
        fetching: false,
        error: null,
        data: []
    }
};

type IdsOnlyRequest = {token: string, idsOnly: true}
export const performFetchFavouriteStockIds = createAsyncThunk(
    "favourites/getidslist",
    async (params: IdsOnlyRequest, { rejectWithValue }) => {
        try {
            return await fetchFavouriteStockIds(params);
        } catch (e) {
            return rejectWithValue(e.response.data)
        }
    }
)

type FullRequest = {token: string, sortedBy: string|null, sortedByDirection: string|null, page: number, page_size: number}
export const performFetchFavouriteStocks = createAsyncThunk(
    "favourites/getlist",
    async (params: FullRequest, { rejectWithValue }) => {
        try {
            return await fetchFavouriteStocks(params);
        } catch (e) {
            return rejectWithValue(e.response.data)
        }
    }
)


export const favouriteStocksSlice = createSlice({
    name: "favourites",
    initialState: initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(performFetchFavouriteStocks.pending, (state) => {
            state.list.fetching = true
            state.list.error = null;
        })

        builder.addCase(performFetchFavouriteStocks.fulfilled, (state, action) => {
            state.list.fetching = false
            state.list.error = null
            state.list.data = action.payload;
        })

        builder.addCase(performFetchFavouriteStocks.rejected, (state, action) => {
            state.list.fetching = false
            state.list.error = action.error.message || null;
        })

        builder.addCase(performFetchFavouriteStockIds.pending, (state) => {
            state.ids.fetching = true
            state.ids.error = null
        })

        builder.addCase(performFetchFavouriteStockIds.fulfilled, (state, action) => {
            state.ids.fetching = false
            state.ids.error = null
            state.ids.data = action.payload;
        })

        builder.addCase(performFetchFavouriteStockIds.rejected, (state, action) => {
            state.ids.fetching = false
            state.ids.error = action.error.message || null;
        })
    }
})

export default favouriteStocksSlice.reducer;