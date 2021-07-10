import * as React from "react"
import { RouteProps, Route, Redirect } from "react-router-dom"
import { useSelector } from "react-redux"
import { AppState } from "../store"
import { UserState } from "../slices/user"

export default function PrivateRoute(props: RouteProps): React.ReactElement {
    const { children, ...rest } = props
    const { session } = useSelector<AppState, UserState>((state) => state.user)

    return (
        <Route
            {...rest}
            render={({ location }) =>
                session ? (
                    children
                ) : (
                    <Redirect
                        to={{
                            pathname: "/login",
                            state: { from: location }
                        }}
                    />
                )
            }
        />
    )
}
