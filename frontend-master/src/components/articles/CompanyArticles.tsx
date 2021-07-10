import React, {ChangeEvent, useState} from "react";
import {RouteComponentProps} from "react-router";
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
import {StockChart} from "../charts/StockChart";

interface MatchParams {
    symbol?: string
}

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

export default function CompanyArticles(props: RouteComponentProps<MatchParams>): React.ReactElement {
    const { params } = props.match

    const classes = useStyles();

    const token = useSelector<AppState, string|undefined>(state => state.user.session?.token);
    if (!token) return <div>Unauthorised</div>;

    const stockArticles = useSelector<AppState, StockArticlesState>(state => state.stockArticles);

    const [pageSize, setPageSize] = useState(25);
    const [page, setPage] = useState(0);
    const [searchPanelExpanded, setSearchPanelExpanded] = useState(true);

    const [providerSearchField, setProviderSearchField] = useState("");
    const [releaseDateSearchField, setReleaseDateSearchField] = useState("");
    const [querySearchField, setQuerySearchField] = useState("");

    useDebouncedEffect(() => {
        if (!token || !params.symbol) return;

        dispatch(performFetchStockArticles({
            stockSymbol: params.symbol,
            token,
            page,
            search: {
                provider: providerSearchField,
                releaseDate: releaseDateSearchField,
                query: querySearchField
            },
            pageSize
        }))
    }, 1000, [pageSize, providerSearchField, releaseDateSearchField, querySearchField, params.symbol, page, token]);

    const openArticle = (row: StockArticle) => {
        window.open(row.url, "_blank");
    }

    const onReleaseDateChanged = (e: ChangeEvent<any>) => {
        console.log("On Release date changed", e);
        setReleaseDateSearchField(e.target.value)
    }

    const onQueryChanged = (e: ChangeEvent<any>) => {
        console.log("On Query changed", e);
        setQuerySearchField(e.target.value);
    }

    const onProviderChanged = (e: ChangeEvent<any>) => {
        console.log("On provider changed", e);
        setProviderSearchField(e.target.value);
    }

    const onSearchReset = () => {
        setProviderSearchField("");
        setQuerySearchField("");
        setReleaseDateSearchField("");
    }

    return <>
        <Paper className={classes.breadcrumbs}>
            <Breadcrumbs aria-label="breadcrumb">
                <Link color="inherit" href={"/dashboard/articles/"}>
                    Articles
                </Link>
                <Typography>
                    <strong>{params.symbol}</strong>
                </Typography>
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
                    <Grid item xs={6}>
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

        {params.symbol &&
            <StockChart
                stock_symbol={params.symbol}
                specs={{
                    totalWidth: window.innerWidth * 0.75,
                    totalHeight: 200,
                    separationRatio: 0.8,
                    mainChartSpecs: {
                        width: window.innerWidth * 0.75,
                        height: 100,
                        margin: { top: 20, right: 80, bottom: 40, left: 80 }
                    },
                    brushSpecs: {
                        brushSize: 130,
                        margin: { top: 20, right: 80, bottom: 40, left: 80 },
                        yAxisNumTicks: 5
                    }}
                }
            />
        }

        <Divider className={classes.spacer20}/>

        <Paper>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
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
                                <TableCell colSpan={4}>Unable to fetch stock articles</TableCell>
                            </TableRow>
                        }

                        {!stockArticles.paginated && stockArticles.fetching &&
                            <TableRow>
                                <TableCell colSpan={5}>Loading stock articles</TableCell>
                            </TableRow>
                        }

                        {!stockArticles.fetching && !stockArticles.error && (stockArticles.paginated?.total || 0) === 0 &&
                            <TableRow>
                                <TableCell colSpan={5}>No articles found for {params.symbol}</TableCell>
                            </TableRow>
                        }

                        {(stockArticles.paginated?.results || []).map(row =>
                            <TableRow key={row.external_id}>
                                <TableCell>{moment(row.release_date).format("MMM Do YYYY")}</TableCell>
                                <TableCell>{row.headline}</TableCell>
                                <TableCell>{verbaliseSentiment(row.sentiment)}</TableCell>
                                <TableCell>{row.author_name}</TableCell>
                                <TableCell>
                                    <Button onClick={() => openArticle(row)}>Open</Button>
                                </TableCell>
                            </TableRow>
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