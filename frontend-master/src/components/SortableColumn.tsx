import React from "react";
import {Link} from "@material-ui/core";
import {KeyboardArrowDown, KeyboardArrowUp} from "@material-ui/icons";

export enum SortDirection {
    ASC,
    DESC,
    NONE
}

type Props = {
    onDirectionChanged(direction: SortDirection): void;
    label: string;
    direction: SortDirection;
}

export function convertDirectionToString(direction: SortDirection): string|null {
    switch(direction) {
        case SortDirection.ASC:
            return "asc";
        case SortDirection.DESC:
            return "desc";
        case SortDirection.NONE:
        default:
            return null;
    }
}

export default function SortableColumn(props: Props): React.ReactElement {
    const icon = (() => {
        switch (props.direction) {
            case SortDirection.DESC:
                return <KeyboardArrowDown fontSize={"small"}/>;
            case SortDirection.ASC:
                return <KeyboardArrowUp fontSize={"small"}/>;
            case SortDirection.NONE:
            default:
                return <></>;
        }
    })();

    return <Link onClick={() => {
        const newDirection = (() => {
            switch (props.direction) {
                case SortDirection.ASC:
                    return SortDirection.NONE;
                case SortDirection.DESC:
                    return SortDirection.ASC;
                case SortDirection.NONE:
                default:
                    return SortDirection.DESC;
            }
        })();
        props.onDirectionChanged(newDirection);
    }}>{props.label} {icon}</Link>
}