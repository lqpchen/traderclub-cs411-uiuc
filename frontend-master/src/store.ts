import { combineReducers, configureStore, getDefaultMiddleware } from "@reduxjs/toolkit"
import { userSlice } from "./slices/user"
import { authSlice } from "./slices/auth"
import { createBrowserHistory } from "history"
import { persistReducer } from "redux-persist"
import storage from "redux-persist/lib/storage"
import persistStore from "redux-persist/es/persistStore"
import {companiesSlice} from "./slices/companies";
import {favouriteStocksSlice} from "./slices/favouriteStocks";
import {stockDiscussionThreadsSlice} from "./slices/stockDiscussionThreads";
import {stockArticlesSlice} from "./slices/stockArticles";
import {stockDiscussionThreadRepliesSlice} from "./slices/stockDiscussionThread";
import {stockFinancialsSlice} from "./slices/stockFinancials";
import {stockQuotesSlice} from "./slices/stockQuotes";

export const history = createBrowserHistory()

const persistConfig = {
    key: "root",
    storage,
    whitelist: ["user"]
}
const rootReducer = combineReducers({
    user: userSlice.reducer,
    auth: authSlice.reducer,
    stockQuotes: stockQuotesSlice.reducer,
    companies: companiesSlice.reducer,
    stockArticles: stockArticlesSlice.reducer,
    stockDiscussionThreads: stockDiscussionThreadsSlice.reducer,
    stockDiscussionThreadReplies: stockDiscussionThreadRepliesSlice.reducer,
    stockFinancials: stockFinancialsSlice.reducer,
    favouriteStocks: favouriteStocksSlice.reducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export type AppState = ReturnType<typeof rootReducer>

window.process = {
    env: {
        // @ts-ignore
        EXPERIMENTAL_ENABLED: false
    }
}

export const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware({
        serializableCheck: {
            ignoredActions: ["persist/PERSIST"]
        }
    })
})

export const dispatch = store.dispatch
store.subscribe(() => console.log(store.getState()))

export const persistor = persistStore(store)
