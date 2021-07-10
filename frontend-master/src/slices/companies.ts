import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { listCompanies } from "../api/companies"
import {Paginated, Stock} from "../api/entities";

export type CompaniesState = {
    fetching: boolean,
    error: string|null,
    paginated: Paginated<Stock>|null
}

const initialState: CompaniesState = {
    fetching: false,
    error: null,
    paginated: null
}

export const performFetchCompaniesList = createAsyncThunk(
    "companies/getlist",
    async (params: {token: string, sortedBy: string|null, sortedByDirection: string|null, page: number, page_size: number}, { rejectWithValue }) => {
        try {
            return await listCompanies(params);
        } catch (e) {
            return rejectWithValue(e.response.data)
        }
    }
)

export const companiesSlice = createSlice({
    name: "companies",
    initialState: initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(performFetchCompaniesList.pending, (state) => {
            state.fetching = true
            state.error = null
        })

        builder.addCase(performFetchCompaniesList.fulfilled, (state, action) => {
            state.fetching = false
            state.error = null
            state.paginated = action.payload;
        })

        builder.addCase(performFetchCompaniesList.rejected, (state, action) => {
            state.fetching = false
            state.error = action.error.message || null;
        })
    }
})

export default companiesSlice.reducer;
