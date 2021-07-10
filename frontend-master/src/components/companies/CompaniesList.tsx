import React, {useEffect, useState} from "react"

import {CompaniesState, performFetchCompaniesList} from "../../slices/companies"
import {AppState, dispatch} from "../../store"
import NumberFormat from "react-number-format";

import {useSelector} from "react-redux";
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
    TableRow,
    Typography
} from "@material-ui/core";
import {COMPANIES_PAGE_SIZE, Stock} from "../../api/entities";
import {FavouriteStocksState, performFetchFavouriteStockIds} from "../../slices/favouriteStocks";
import {addToWatchlist, deleteFromWatchlist} from "../../api/favouriteStocks";
import {useHistory} from "react-router";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import SortableColumn, {convertDirectionToString, SortDirection} from "../SortableColumn";
import {ChartWidget} from "../charts/ChartWidget";
import PricePredictionDialog from "../dialogs/PricePredictionDialog";
import {fetchStocksSentiment, StockSentiments} from "../../api/companies";
import {verbaliseSentiment} from "../../utils";

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

export default function CompaniesList(): React.ReactElement {
    const history = useHistory();
    const classes = useStyles();

    const token = useSelector<AppState, string|undefined>((state) => state.user.session?.token);
    const companiesInfo = useSelector<AppState, CompaniesState>((state) => state.companies)
    const favouriteStocks = useSelector<AppState, FavouriteStocksState>((state) => state.favouriteStocks)

    const [stocksSentiment, setStocksSentiment] = useState<StockSentiments[]>([]);

    const [showPricePredictionDialog, setShowPricePredictionDialog] = useState(false);
    const [pricePredictionContext, setPricePredictionContext] = useState<Stock|null>(null);

    const [page, setPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(COMPANIES_PAGE_SIZE);

    const [sortedBy, setSortedBy] = useState<string|null>(null)
    const [sortedByDirection, setSortedByDirection] = useState(SortDirection.NONE)

    const refreshData = (token: string) => {
        const sortedByDirectionStr = convertDirectionToString(sortedByDirection)

        dispatch(performFetchCompaniesList({
            token, page, page_size: pageSize, sortedBy, sortedByDirection: sortedByDirectionStr
        }));

        dispatch(performFetchFavouriteStockIds({
            token, idsOnly: true
        }));
    };

    useEffect(() => {
        if (!token) return;

        refreshData(token);
    }, [token, page, sortedBy, sortedByDirection, pageSize])

    useEffect(() => {
        if (!token) return;
        if (companiesInfo.paginated?.results.length === 0) return;
        if (companiesInfo.error || companiesInfo.fetching) return;

        Promise.all(
            (companiesInfo.paginated?.results || []).map(item =>
                fetchStocksSentiment({
                    token,
                    stock_symbol: item.symbol
                })
            )
        ).then(results => {
            console.log("Sentiment data fetched", results);
            setStocksSentiment(results);
        })
    }, [token, page, sortedBy, sortedByDirection, pageSize, companiesInfo])

    const onAddToWatchlist = (stockId: number) => {
        if (!token) return;

        addToWatchlist({token, stockId}).then(() => {
            refreshData(token);
        })
    };

    const onRemoveFromWatchlist = (stockId: number) => {
        if (!token) return;

        deleteFromWatchlist({token, stockId}).then(() => {
            refreshData(token);
        })
    };

    const onOpenFinancials = (symbol: string) => {
        history.push(`/dashboard/financials/${symbol}`);
    }

    const onOpenArticles = (symbol: string) => {
        history.push(`/dashboard/articles/${symbol}`);
    }

    const onOpenDiscussions = (symbol: string) => {
        history.push(`/dashboard/discussions/${symbol}`);
    }

    const onSortDirectionChanged = (column: string, direction: SortDirection) => {
        if (column !== sortedBy) {
            setSortedByDirection(SortDirection.DESC);
        } else {
            setSortedByDirection(direction);
        }

        setSortedBy(column);
    }

    const onPricePredictionRequested = (record: Stock) => {
        setShowPricePredictionDialog(true);
        setPricePredictionContext(record);
    };

    return <>
        <Paper>
            <Typography variant={"h5"} className={classes.padding20}>Companies</Typography>
        </Paper>

        <PricePredictionDialog
            token={token}
            stock={pricePredictionContext}
            onClosed={() => setShowPricePredictionDialog(false)}
            open={showPricePredictionDialog}
        />

        <Paper>
            <TableContainer>
                <Table stickyHeader>
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
                            <TableCell>&nbsp;</TableCell>
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
                            <TableCell>Media Sentiment</TableCell>
                            <TableCell>Chart</TableCell>
                            <TableCell>Price Prediction</TableCell>
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
                        {!companiesInfo.paginated && companiesInfo.fetching &&
                            <TableRow>
                                <TableCell align={"center"} colSpan={13}>Loading companies list...</TableCell>
                            </TableRow>
                        }

                        {!companiesInfo.paginated && companiesInfo.error &&
                            <TableRow>
                                <TableCell align={"center"} colSpan={13}>Unable to load companies list</TableCell>
                            </TableRow>
                        }

                        {(companiesInfo.paginated?.results || []).map(record =>
                            <>
                                <TableRow>
                                    <TableCell>
                                        <Chip size="small" label={record.stock_exchange_name} />
                                    </TableCell>
                                    <TableCell>
                                        <Link style={{cursor: "pointer"}}  color={"primary"} onClick={() => onOpenDiscussions(record.symbol)}>{record.symbol}</Link>
                                    </TableCell>
                                    <TableCell>
                                        {(favouriteStocks.ids.data || []).indexOf(record.id) < 0 ?
                                            <Button onClick={() => onAddToWatchlist(record.id)} color={"primary"} variant={"outlined"}>Watchlist</Button> :
                                            <Button onClick={() => onRemoveFromWatchlist(record.id)} color={"secondary"} variant={"outlined"}>Watchlist</Button>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <strong>{record.company_name}</strong>
                                    </TableCell>
                                    <TableCell>
                                        <Button size={"small"} onClick={() => onOpenDiscussions(record.symbol)} variant={"outlined"}>Forum</Button>
                                        <Button size={"small"} onClick={() => onOpenArticles(record.symbol)} variant={"outlined"}>Articles</Button>
                                        <Button size={"small"} onClick={() => onOpenFinancials(record.symbol)} variant={"outlined"}>Financials</Button>
                                    </TableCell>
                                    <TableCell>
                                        <NumberFormat value={(record.quote_adjusted_close || 0).toFixed(3)}
                                                      displayType={'text'} thousandSeparator={true} prefix={"$"} />
                                    </TableCell>
                                    <TableCell>{(record.quote_day_move || 0).toFixed(2)}%</TableCell>
                                    <TableCell>{
                                        stocksSentiment.filter(v => v.symbol == record.symbol)
                                            .map(sentiment =>
                                                <Typography>{verbaliseSentiment(sentiment.result.sentiment)}</Typography>
                                            ).pop() || <Typography>Loading...</Typography>
                                    }</TableCell>
                                    <TableCell>
                                        <ChartWidget
                                            stock_symbol={record.symbol}
                                            specs={{
                                                width: 50,
                                                height: 50
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Table>
                                            <TableBody>
                                                <Button onClick={() => onPricePredictionRequested(record)} color="primary" variant={"contained"}>Returns Predictions</Button>
                                            </TableBody>
                                        </Table>
                                    </TableCell>
                                    <TableCell>
                                        <Table>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell>
                                                        <Typography className={classes.quotesHighStyle}>
                                                            <NumberFormat value={(record.quote_high || 0).toFixed(2)}
                                                                          displayType={'text'} thousandSeparator={true} prefix={"$"} />
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>
                                                        <Typography className={classes.quotesLowStyle}>
                                                            <NumberFormat value={(record.quote_low || 0).toFixed(2)}
                                                                          displayType={'text'} thousandSeparator={true} prefix={"$"} />
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableCell>
                                    <TableCell>
                                        <NumberFormat value={(record.quote_volume || 0)} displayType={'text'} thousandSeparator={true} />
                                    </TableCell>
                                    <TableCell>
                                        <NumberFormat value={(record.market_cap || 0).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={"$"} />
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
                count={companiesInfo.paginated?.total || 0}
                rowsPerPage={pageSize}
                page={page}
                onChangePage={(evt, page) => setPage(page)}
                onChangeRowsPerPage={(evt) => {
                    setPageSize(+evt.target.value);
                    setPage(0);
                }}
            />
        </Paper>
    </>
}
