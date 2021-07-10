import React, {useEffect, useState} from "react"
import {
    Button,
    Chip,
    Link,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow, Typography
} from "@material-ui/core";
import SortableColumn, {convertDirectionToString, SortDirection} from "../SortableColumn";
import {useHistory} from "react-router";
import {useSelector} from "react-redux";
import {AppState, dispatch} from "../../store";
import {
    FavouriteStocksState,
    performFetchFavouriteStocks
} from "../../slices/favouriteStocks";
import {COMPANIES_PAGE_SIZE} from "../../api/entities";
import NumberFormat from "react-number-format";
import {createStyles, makeStyles} from "@material-ui/core/styles";

type Props = {

};

const useStyles = makeStyles((theme) =>
    createStyles({
        quotesHighStyle: {
            color: "green",
            fontSize: "11px"
        },
        divider: {
            height: "0px",
            margin: "20px"
        },
        padding20: {
            padding: "20px"
        },
        quotesLowStyle: {
            color: "red",
            fontSize: "11px"
        }
    })
);

export default function Watchlist(props: Props): React.ReactElement {
    const history = useHistory();
    const classes = useStyles();

    const token = useSelector<AppState, string|undefined>((state) => state.user.session?.token);
    const favouriteStocks = useSelector<AppState, FavouriteStocksState>((state) => state.favouriteStocks)
    const [page, setPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(COMPANIES_PAGE_SIZE);

    const [sortedBy, setSortedBy] = useState<string|null>(null)
    const [sortedByDirection, setSortedByDirection] = useState(SortDirection.NONE)

    if (!token) return <div/>;

    const refreshData = (token: string) => {
        if (!token) return;

        const sortedByDirectionStr = convertDirectionToString(sortedByDirection)

        dispatch(performFetchFavouriteStocks({
            token,
            sortedBy,
            sortedByDirection: sortedByDirectionStr,
            page,
            page_size: pageSize
        }));
    };

    useEffect(() => {
        if (!token) return;

        refreshData(token);
    }, [token, page, sortedBy, sortedByDirection, pageSize])

    const onSortDirectionChanged = (column: string, direction: SortDirection) => {
        if (column !== sortedBy) {
            setSortedByDirection(SortDirection.DESC);
        } else {
            setSortedByDirection(direction);
        }

        setSortedBy(column);

    }

    const onOpenArticles = (symbol: string) => {
        history.push(`/dashboard/articles/${symbol}`);
    }

    const onOpenFinancials = (symbol: string) => {
        history.push(`/dashboard/financials/${symbol}`);
    }

    const onOpenDiscussions = (symbol: string) => {
        history.push(`/dashboard/discussions/${symbol}`);
    }

    return <>
        <Paper>
            <Typography variant={"h5"} className={classes.padding20}>Watchlist</Typography>
        </Paper>

        <Paper>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>&nbsp;</TableCell>
                            <TableCell>
                                <SortableColumn
                                    label="Symbol"
                                    direction={sortedBy == "symbol" ? sortedByDirection : SortDirection.NONE}
                                    onDirectionChanged={direction => onSortDirectionChanged("symbol", direction)}
                                />
                            </TableCell>
                            <TableCell>
                                <SortableColumn
                                    label="Name"
                                    direction={sortedBy == "name" ? sortedByDirection : SortDirection.NONE}
                                    onDirectionChanged={direction => onSortDirectionChanged("name", direction)}
                                />
                            </TableCell>
                            <TableCell>&nbsp;</TableCell>
                            <TableCell>
                                <SortableColumn
                                    label="Price"
                                    direction={sortedBy == "price" ? sortedByDirection : SortDirection.NONE}
                                    onDirectionChanged={direction => onSortDirectionChanged("price", direction)}
                                />
                            </TableCell>
                            <TableCell>
                                <SortableColumn
                                    label="Day Move"
                                    direction={sortedBy == "day_move" ? sortedByDirection : SortDirection.NONE}
                                    onDirectionChanged={direction => onSortDirectionChanged("day_move", direction)}
                                />
                            </TableCell>
                            <TableCell>Chart</TableCell>
                            <TableCell>Hi/Lo</TableCell>
                            <TableCell>
                                <SortableColumn
                                    label="Day Volume"
                                    direction={sortedBy == "day_volume" ? sortedByDirection : SortDirection.NONE}
                                    onDirectionChanged={direction => onSortDirectionChanged("day_volume", direction)}
                                />
                            </TableCell>
                            <TableCell>
                                <SortableColumn
                                    label="Market Cap"
                                    direction={sortedBy == "market_cap" ? sortedByDirection : SortDirection.NONE}
                                    onDirectionChanged={direction => onSortDirectionChanged("market_cap", direction)}
                                />
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!favouriteStocks.list.data && favouriteStocks.list.fetching &&
                        <TableRow>
                            <TableCell align={"center"} colSpan={10}>Loading companies list...</TableCell>
                        </TableRow>
                        }

                        {!favouriteStocks.list.data && favouriteStocks.list.error &&
                        <TableRow>
                            <TableCell align={"center"} colSpan={10}>Unable to load companies list</TableCell>
                        </TableRow>
                        }

                        {(favouriteStocks.list.data?.results || []).map(record =>
                            <>
                                <TableRow>
                                    <TableCell>
                                        <Chip size="small" label={record.stock_exchange_name} />
                                    </TableCell>
                                    <TableCell>
                                        <Link style={{cursor: "pointer"}}  color={"primary"} onClick={() => onOpenDiscussions(record.symbol)}>{record.symbol}</Link>
                                    </TableCell>
                                    <TableCell>
                                        <strong>{record.company_name}</strong>
                                    </TableCell>
                                    <TableCell>
                                        <Button size={"small"} onClick={() => onOpenDiscussions(record.symbol)} variant={"outlined"}>Forum</Button>
                                        <Button size={"small"} onClick={() => onOpenFinancials(record.symbol)} variant={"outlined"}>Financials</Button>
                                        <Button size={"small"} onClick={() => onOpenArticles(record.symbol)} variant={"outlined"}>Articles</Button>
                                    </TableCell>
                                    <TableCell>
                                        <NumberFormat value={record.quote_adjusted_close ? record.quote_adjusted_close.toFixed(3) : 0}
                                                      displayType={'text'} thousandSeparator={true} prefix={"$"} />
                                    </TableCell>
                                    <TableCell>{record.quote_day_move.toFixed(2)}%</TableCell>
                                    <TableCell>&nbsp;</TableCell>
                                    <TableCell>
                                        <Table>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell>
                                                        <Typography className={classes.quotesHighStyle}>
                                                            <NumberFormat value={record.quote_high.toFixed(2)}
                                                                          displayType={'text'} thousandSeparator={true} prefix={"$"} />
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>
                                                        <Typography className={classes.quotesLowStyle}>
                                                            <NumberFormat value={record.quote_low.toFixed(2)}
                                                                          displayType={'text'} thousandSeparator={true} prefix={"$"} />
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableCell>
                                    <TableCell>
                                        <NumberFormat value={record.quote_volume} displayType={'text'} thousandSeparator={true} />
                                    </TableCell>
                                    <TableCell>
                                        <NumberFormat value={record.market_cap} displayType={'text'} thousandSeparator={true} prefix={"$"} />
                                    </TableCell>
                                </TableRow>
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[10, 25, 100]}
                component="div"
                count={favouriteStocks.list.data?.total || 0}
                rowsPerPage={pageSize}
                page={page}
                onChangePage={(evt, page) => setPage(page)}
                onChangeRowsPerPage={(evt) => {
                    setPageSize(+evt.target.value);
                    setPage(0);
                }}
            />
        </Paper>
    </>;
}
