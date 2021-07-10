import {
    Breadcrumbs, Button, Chip,
    createStyles, Divider, Table,
    TableBody, TableCell, TableContainer,
    TableHead,
    TablePagination, TableRow,
    Typography
} from "@material-ui/core";
import {Link, Paper} from "@material-ui/core";
import React, {useEffect, useState} from "react";
import {RouteComponentProps, useHistory} from "react-router";
import {makeStyles, Theme} from "@material-ui/core/styles";
import {AppState, dispatch} from "../../store";
import {useSelector} from "react-redux";
import {performFetchStockDiscussionThreads, StockDiscussionThreadsState} from "../../slices/stockDiscussionThreads";
import moment from "moment";
import {UserState} from "../../slices/user";
import { deleteThreadById } from "../../api/discussionThreads";
import {StockChart} from "../charts/StockChart";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
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


const DISCUSSION_THREADS_PAGE_SIZE = 25;

interface MatchParams {
    symbol?: string
}

export default function StockDiscussions(props: RouteComponentProps<MatchParams>): React.ReactElement {
    const classes = useStyles();
    const { params } = props.match

    const history = useHistory();
    const token = useSelector<AppState, string|undefined>(state => state.user.session?.token);

    const stockDiscussions = useSelector<AppState, StockDiscussionThreadsState>(state => state.stockDiscussionThreads);
    const user = useSelector<AppState, UserState>(state => state.user);

    const [pageSize, setPageSize] = useState(DISCUSSION_THREADS_PAGE_SIZE);
    const [page, setPage] = useState(0);

    if (!token) return <div>Unauthorized</div>;

    const refreshData = () => {
        if (!token) return;

        dispatch(performFetchStockDiscussionThreads({
            stockSymbol: params.symbol,
            page,
            pageSize,
            token
        }))
    };

    useEffect(() => {
        refreshData();
    }, [token, page, pageSize, params.symbol]);

    const onNewThreadRequested = () => {
        history.push(props.location.pathname + "/new");
    }

    const onThreadDeleteRequested = (stockSymbol: string, threadId: number) => {
        if (!token) return;

        if (window.confirm("Are you sure you want to delete this entire thread?")) {
            deleteThreadById({token, stockSymbol: stockSymbol, threadId})
                .then(() =>
                    refreshData()
                );
        }
    }

    return <div>
        <Paper className={classes.breadcrumbs}>
            <Breadcrumbs aria-label="breadcrumb">
                <Link color="inherit" href="#/dashboard/discussions">
                    Discussions
                </Link>
                {params.symbol && <Typography>
                    <strong>{params.symbol}</strong>
                </Typography>}
            </Breadcrumbs>
        </Paper>

        <Divider className={classes.divider}/>

        {params.symbol &&
            <div className={classes.buttonsList}>
                <Button className={classes.newThreadButton} onClick={() => onNewThreadRequested()} color={"primary"} variant={"contained"}>New Thread</Button>
            </div>}

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

        <Paper>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            {!params.symbol && <TableCell>Symbol</TableCell>}
                            <TableCell>Author</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell>Posts</TableCell>
                            <TableCell>Last Reply</TableCell>
                            <TableCell>&nbsp;</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(stockDiscussions.paginated?.total === 0 && stockDiscussions.fetching &&
                            <TableRow>
                                <TableCell colSpan={params.symbol ? 5 : 6}><strong>Loading discussions...</strong></TableCell>
                            </TableRow>
                        )}

                        {(stockDiscussions.paginated?.total === 0 && stockDiscussions.error &&
                            <TableRow>
                                <TableCell colSpan={params.symbol ? 5 : 6}><strong>Unable to load discussions...</strong></TableCell>
                            </TableRow>
                        )}

                        {(stockDiscussions.paginated?.total || 0) == 0 &&
                            <TableRow>
                                <TableCell colSpan={params.symbol ? 5 : 6}><strong>No discussion threads found.</strong></TableCell>
                            </TableRow>
                        }

                        {(stockDiscussions.paginated?.results || []).map(thread =>
                            <TableRow>
                                <TableCell>{moment(thread.created).format("MMM Do YYYY")}</TableCell>
                                {!params.symbol && <TableCell><Chip label={thread.stock_symbol}/></TableCell>}
                                <TableCell>{thread.author_name}</TableCell>
                                <TableCell><Link href={"#/dashboard/discussions/" + thread.stock_symbol + "/thread/" + thread.id}>{thread.subject || "Untitled"} &rsaquo;</Link></TableCell>
                                <TableCell>{thread.number_of_posts}</TableCell>
                                <TableCell>{thread.last_reply_created ?
                                    moment(thread.last_reply_created).fromNow() :
                                    "N/A"
                                } </TableCell>
                                <TableCell>
                                    {(user.session?.user_id && user.session.user_id == thread.author_id) &&
                                        <>
                                            <Button onClick={() => onThreadDeleteRequested(thread.stock_symbol, thread.id)}>Delete</Button>
                                        </>
                                    }
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={stockDiscussions.paginated?.total || 0}
                rowsPerPage={pageSize}
                page={page}
                onChangePage={(evt, page) => setPage(page)}
                onChangeRowsPerPage={(evt) => {
                    setPageSize(+evt.target.value);
                    setPage(0);
                }}
            />
        </Paper>

    </div>
}