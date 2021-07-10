import React, {useEffect, useState} from "react";
import {makeStyles, Theme} from "@material-ui/core/styles";
import {
    Accordion, AccordionDetails,
    AccordionSummary,
    Breadcrumbs,
    createStyles,
    Divider,
    Link,
    Paper, Tab, Table, TableBody, TableCell, TablePagination, TableRow, Tabs,
    Typography
} from "@material-ui/core";
import {RouteComponentProps} from "react-router";
import {useSelector} from "react-redux";
import {AppState, dispatch} from "../../store";
import {performFetchStockFinancials, StockFinancialsState} from "../../slices/stockFinancials";
import {ExpandMoreRounded} from "@material-ui/icons";
import moment from "moment";
import { StockFinancialData } from "../../api/entities";
import NumberFormat from "react-number-format";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        financialsTable: {
            width: "95%",
            margin: "0 auto"
        },
        breadcrumbs: {
            padding: "15px"
        },
        divider: {
            margin: "20px",
            height: 0
        },
        buttonsList: {
            width: "100%",
            textAlign: "right"
        },
        newThreadButton: {
            margin: 5
        }
    })
)


const FINANCIALS_PAGE_SIZE = 10;

interface MatchParams {
    symbol?: string
}

export default function StockDiscussions(props: RouteComponentProps<MatchParams>): React.ReactElement {
    const classes = useStyles();
    const { params } = props.match

    const token = useSelector<AppState, string|undefined>(state => state.user.session?.token);

    const stockFinancials = useSelector<AppState, StockFinancialsState>(state => state.stockFinancials);

    const [pageSize, setPageSize] = useState(FINANCIALS_PAGE_SIZE);
    const [page, setPage] = useState(0);

    if (!params.symbol) return <div />

    if (!token) return <div>Unauthorized</div>;

    const refreshData = () => {
        if (!token) return;
        if (!params.symbol) return;

        dispatch(performFetchStockFinancials({
            stockSymbol: params.symbol,
            page,
            pageSize,
            token
        }))
    };

    const expandedStateDefault: {[key: number]: boolean} = {};
    (stockFinancials.paginated?.results || []).forEach((record) => {
        expandedStateDefault[record.id] = false;
    });
    const [expanded, setExpanded] = useState(expandedStateDefault);

    const tabsStateDefault: {[key: number]: number} = {};
    (stockFinancials.paginated?.results || []).forEach((record) => {
        tabsStateDefault[record.id] = 0;
    });

    const [tabsState, setTabsState] = useState(tabsStateDefault);

    console.log("Tabs state", tabsState);

    useEffect(() => {
        refreshData();
    }, [token, page, pageSize, params.symbol]);

    console.log("Stock financials", stockFinancials);

    return <div>
        <Paper className={classes.breadcrumbs}>
            <Breadcrumbs aria-label="breadcrumb">
                <Link color="inherit" href="/dashboard/companies">
                    Financials
                </Link>
                <Typography>
                    <strong>{params.symbol}</strong>
                </Typography>
            </Breadcrumbs>
        </Paper>

        <Divider className={classes.divider}/>

        {(stockFinancials.paginated?.results || []).map((record) => {
            const start_date = moment(record.start_date);
            const end_date = moment(record.end_date);

            const financials: StockFinancialData = JSON.parse(record.data);

            return <Accordion
                key={record.id.toString()}
                expanded={expanded[record.id]}
                onChange={() =>
                    setExpanded(Object.assign({}, expanded, {[record.id]: false}))
                }
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreRounded />}
                    aria-controls="search-panel-content"
                    id="search-panel-header"
                >
                    <Typography>{record.quarter}: {start_date.format("MM/YYYY")} - {end_date.format("MM/YYYY")}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Paper className={classes.financialsTable}>
                        <Tabs
                            value={tabsState[record.id] || 0}
                            onChange={(e, idx) => {
                                setTabsState(Object.assign({}, tabsState, {[record.id]: idx}))
                            }}
                            indicatorColor="primary"
                            textColor="primary"
                            centered
                        >
                            <Tab value={0} label="Balance Sheet"/>
                            <Tab value={1} label="Income Statement" />
                            <Tab value={2} label="Cash Flow Statement." />
                        </Tabs>

                        <Table>
                            <TableBody>
                                {((() => {
                                    if (tabsState[record.id] === 1) return financials.ic;
                                    else if (tabsState[record.id] === 2) return financials.cf;
                                    else return financials.bs;
                                })()).map((concept, k) =>
                                    <TableRow key={concept.label}>
                                        <TableCell>
                                            {concept.label} (<i>{concept.concept}</i>)
                                        </TableCell>
                                        <TableCell>
                                            <NumberFormat value={concept.value} displayType={'text'} thousandSeparator={true} />
                                        </TableCell>
                                        <TableCell>
                                            {concept.unit}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Paper>
                </AccordionDetails>
            </Accordion>
        })}

        <TablePagination
            rowsPerPageOptions={[10, 25, 100]}
            component="div"
            count={stockFinancials.paginated?.total || 0}
            rowsPerPage={pageSize}
            page={page}
            onChangePage={(evt, page) => setPage(page)}
            onChangeRowsPerPage={(evt) => {
                setPageSize(+evt.target.value);
                setPage(0);
            }}
        />
    </div>
}