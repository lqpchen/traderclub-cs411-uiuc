import { hot } from "react-hot-loader/root"
import React from "react"
import { ThemeProvider } from "styled-components"
import NoSsr from "@material-ui/core/NoSsr"
import { createMuiTheme } from "@material-ui/core/styles"
import { Provider } from "react-redux"
import { store, persistor } from "./store"
import {Switch, Route, Redirect, HashRouter} from "react-router-dom"
import PrivateRoute from "./components/PrivateRoute"
import DashboardPage from "./pages/DashboardPage"
import SigninPage from "./pages/SigninPage"
import "fontsource-roboto"
import { PersistGate } from "redux-persist/integration/react"
import AuthGate from "./components/AuthGate"
import SignupPage from "./pages/SignupPage"

const theme = createMuiTheme()

function App() {
    return (
        <NoSsr>
            <ThemeProvider theme={theme}>
                <Provider store={store}>
                    <PersistGate loading={null} persistor={persistor}>
                        <AuthGate>
                            <HashRouter>
                                <Switch>
                                    <PrivateRoute path="/dashboard">
                                        <DashboardPage />
                                    </PrivateRoute>
                                    <Route exact={true} path="/login" render={() => <SigninPage/>} />
                                    <Route exact={true} path="/signup" component={() => <SignupPage/>} />
                                    <Redirect exact={true} from="/" to="/dashboard/companies" />
                                </Switch>
                            </HashRouter>
                        </AuthGate>
                    </PersistGate>
                </Provider>
            </ThemeProvider>
        </NoSsr>
    )
}

export default hot(App)
