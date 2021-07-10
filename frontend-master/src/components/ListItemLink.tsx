import React from "react"
import { ListItem, ListItemProps } from "@material-ui/core"
import { Link } from "react-router-dom"

export type Props = ListItemProps<any, { to: string }>

export default function ListItemLink(props: Props): React.ReactElement {
    const omitProps: Omit<Omit<Props, "button">, "component"> = props
    // @ts-ignore
    return <ListItem button component={Link} {...omitProps} />
}