import React, {ChangeEvent, useState} from "react";
import {useSelector} from "react-redux";
import {AppState, dispatch} from "../../store";
import {makeStyles} from "@material-ui/core/styles";
import {
    Accordion, AccordionDetails, AccordionSummary,
    Breadcrumbs, Button,
    Divider, Grid,
    Link,
    Paper,
    Table, TableBody, TableCell,
    TableContainer,
    TableHead, TablePagination,
    TableRow, TextField,
    Typography
} from "@material-ui/core";
import {performFetchStockArticles, StockArticlesState} from "../../slices/stockArticles";
import {StockArticle} from "../../api/entities";
import moment from "moment";
import {ExpandMoreRounded} from "@material-ui/icons";
import {useDebouncedEffect, verbaliseSentiment} from "../../utils";

const useStyles = makeStyles((theme) => ({
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular
    },
    paperStyle: {
        width: "100%",
        margin: "1rem auto",
        padding: "1rem"
    },
    breadcrumbs: {
        padding: "15px"
    },
    disclosureGroups: {
        width: "100%"
    },
    wrapperClassName: {
        border: "1px solid #000",
        height: "400px !important"
    },
    spacer20: {
        margin: "20px",
        height: 0
    },
    spacer5: {
        margin: "5px",
        height: 0
    },
    finalSpacer: {
        margin: "20px"
    }
}));

export default function GlobalArticles(): React.ReactElement {
    const classes = useStyles();

    const token = useSelector<AppState, string|undefined>(state => state.user.session?.token);
    if (!token) return <div>Unauthorised</div>;

    const stockArticles = useSelector<AppState, StockArticlesState>(state => state.stockArticles);

    const [pageSize, setPageSize] = useState(25);
    const [page, setPage] = useState(0);
    const [searchPanelExpanded, setSearchPanelExpanded] = useState(true);

    const [providerSearchField, setProviderSearchField] = useState("");
    const [stockSearchField, setStockSearchField] = useState("");
    const [releaseDateSearchField, setReleaseDateSearchField] = useState("");
    const [querySearchField, setQuerySearchField] = useState("");

    useDebouncedEffect(() => {
        if (!token) return;

        dispatch(performFetchStockArticles({
            token,
            page,
            search: {
                stockSymbol: stockSearchField.trim(),
                provider: providerSearchField,
                releaseDate: releaseDateSearchField,
                query: querySearchField
            },
            pageSize
        }))
    }, 1000, [pageSize, stockSearchField, providerSearchField, releaseDateSearchField, querySearchField, page, token]);

    const openArticle = (row: StockArticle) => {
        window.open(row.url, "_blank");
    }

    const onReleaseDateChanged = (e: ChangeEvent<any>) => {
        setReleaseDateSearchField(e.target.value)
    }

    const onQueryChanged = (e: ChangeEvent<any>) => {
        setQuerySearchField(e.target.value);
    }

    const onProviderChanged = (e: ChangeEvent<any>) => {
        setProviderSearchField(e.target.value);
    }

    const onStockChanged = (e: ChangeEvent<any>) => {
        setStockSearchField(e.target.value)
    }

    const onSearchReset = () => {
        setProviderSearchField("");
        setQuerySearchField("");
        setReleaseDateSearchField("");
        setStockSearchField("");
    }

    return <>
        <Paper className={classes.breadcrumbs}>
            <Breadcrumbs aria-label="breadcrumb">
                <Link color="inherit" href="/dashboard/articles">
                    Articles
                </Link>
            </Breadcrumbs>
        </Paper>

        <Divider className={classes.spacer20}/>

        <Accordion expanded={searchPanelExpanded} onChange={() => setSearchPanelExpanded(!searchPanelExpanded)}>
            <AccordionSummary
                expandIcon={<ExpandMoreRounded />}
                aria-controls="search-panel-content"
                id="search-panel-header"
            >
                <Typography className={classes.heading}>Search</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Grid container  direction={"row"} spacing={2}>
                    <Grid item xs={3}>
                        <TextField value={releaseDateSearchField} id="search-release-date" onChange={onReleaseDateChanged} label="Release date" type="date" InputLabelProps={{shrink: true}}/>
                    </Grid>
                    <Grid item xs={1}>
                        <TextField value={stockSearchField} id="search-stock" onChange={onStockChanged} label="Stock" InputLabelProps={{shrink: true}}/>
                    </Grid>
                    <Grid item xs={5}>
                        <TextField value={querySearchField} id="search-query" onChange={onQueryChanged} label="Type your query here..." fullWidth  InputLabelProps={{shrink: true}}/>
                    </Grid>
                    <Grid item xs={3}>
                        <TextField value={providerSearchField} id="search-provider" onChange={onProviderChanged} label="Provider" InputLabelProps={{shrink: true}}/>
                    </Grid>
                    <Grid item xs={12}>
                        <Button onClick={() => onSearchReset()}>Reset</Button>
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>

        <Divider className={classes.spacer20}/>

        <Paper>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Stock</TableCell>
                            <TableCell>Release Date</TableCell>
                            <TableCell>Headline</TableCell>
                            <TableCell>Sentiment</TableCell>
                            <TableCell>Provider</TableCell>
                            <TableCell>&nbsp;</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!stockArticles.paginated && stockArticles.error &&
                            <TableRow>
                                <TableCell colSpan={5}>Unable to fetch stock articles</TableCell>
                            </TableRow>
                        }

                        {!stockArticles.paginated && stockArticles.fetching &&
                            <TableRow>
                                <TableCell colSpan={5}>Loading stock articles</TableCell>
                            </TableRow>
                        }

                        {!stockArticles.fetching && !stockArticles.error && (stockArticles.paginated?.total || 0) === 0 &&
                            <TableRow>
                                <TableCell colSpan={5}>No articles found.</TableCell>
                            </TableRow>
                        }

                        {(stockArticles.paginated?.results || []).map(row =>
                            <>
                                <TableRow>
                                    <TableCell>{row.stock_symbol}</TableCell>
                                    <TableCell>{moment(row.release_date).format("MMM Do YYYY")}</TableCell>
                                    <TableCell>{row.headline}</TableCell>
                                    <TableCell>{verbaliseSentiment(row.sentiment)}</TableCell>
                                    <TableCell>{row.author_name}</TableCell>
                                    <TableCell>
                                        <Button onClick={() => openArticle(row)}>Open</Button>
                                    </TableCell>
                                </TableRow>
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={stockArticles.paginated?.total || 0}
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