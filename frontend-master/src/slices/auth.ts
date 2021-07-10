import { createAsyncThunk, createSlice, SerializedError } from "@reduxjs/toolkit"
import { signinByEmail } from "../api/auth"

export type AuthState = {
    isLoggedIn: boolean
    isLoggingIn: boolean
    error: SerializedError | null
}

const initialState: AuthState = {
    isLoggedIn: false,
    isLoggingIn: false,
    error: null
}

type LoginPayload = { email: string; password: string }

export const performSigninByEmail = createAsyncThunk(
    "users/signin",
    async (payload: LoginPayload, { rejectWithValue }) => {
        try {
            return await signinByEmail(payload)
        } catch (e) {
            return rejectWithValue(e.response.data)
        }
    }
)

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        authenticated: (state) => {
            state.isLoggedIn = true
        }
    },
    extraReducers: (builder) => {
        builder.addCase(performSigninByEmail.pending, (state) => {
            state.isLoggingIn = true
            state.error = null
        })

        builder.addCase(performSigninByEmail.fulfilled, (state, action) => {
            state.isLoggingIn = false
            state.isLoggedIn = true
            state.error = null
        })

        builder.addCase(performSigninByEmail.rejected, (state, action) => {
            state.isLoggingIn = false
            state.isLoggedIn = false
            state.error = action.error
        })
    }
})

export const { authenticated } = authSlice.actions
