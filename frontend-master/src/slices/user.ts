import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Session } from "../api/entities"
import { performSigninByEmail } from "./auth"

export type UserAccounts = {
    error: string | null
    isLoading: boolean
}

export type UserState = {
    session: Session | null
}

const initialState: UserState = {
    session: null
}

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        loggedOut: (state, action: PayloadAction<string | null>) => {
            if (action.payload && state.session) {
                if (action.payload !== state.session.token) {
                    return
                }
            }

            state.session = null
        }
    },
    extraReducers: (builder) => {
        builder.addCase(performSigninByEmail.pending, (state) => {
            state.session = null
        })

        builder.addCase(performSigninByEmail.fulfilled, (state, action) => {
            state.session = action.payload
        })

        builder.addCase(performSigninByEmail.rejected, (state, action) => {
            state.session = null
        })
    }
})

export const { loggedOut } = userSlice.actions
