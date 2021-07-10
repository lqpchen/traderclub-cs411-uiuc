import React, { PropsWithChildren, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { AppState } from "../store"
import { isJWTExpired, parseJWTToken } from "../utils"
import { loggedOut } from "../slices/user"

export default function AuthGate(props: PropsWithChildren<any>): React.ReactElement {
    const token = useSelector<AppState, string | undefined>((data) => data.user.session?.token)
    const dispatch = useDispatch()

    useEffect(() => {
        if (!token) return

        const interval = setInterval(() => {
            const jwt = parseJWTToken(token)
            if (!isJWTExpired(jwt)) return
            dispatch(loggedOut(token))
        }, 5 * 1000)

        return () => clearInterval(interval)
    }, [token])

    return <>{props.children}</>
}
