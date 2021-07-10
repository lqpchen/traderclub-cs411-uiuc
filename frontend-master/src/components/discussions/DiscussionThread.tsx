import {
    Breadcrumbs,
    Button,
    Chip,
    createStyles,
    Divider,
    FormControl,
    FormControlLabel,
    FormHelperText,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography
} from "@material-ui/core";
import {Link, Paper} from "@material-ui/core";
import React, {useEffect, useState} from "react";
import {RouteComponentProps} from "react-router";
import {makeStyles, Theme} from "@material-ui/core/styles";
import {AppState, dispatch} from "../../store";
import {useSelector} from "react-redux";
import moment from "moment";
import {UserState} from "../../slices/user";
import {ToggleButton, ToggleButtonGroup} from "@material-ui/lab";
import { stateToHTML } from "draft-js-export-html";
import {
    performFetchStockDiscussionThreadReplies,
    StockDiscussionThreadRepliesState
} from "../../slices/stockDiscussionThread";
import {convertFromRaw, convertToRaw, EditorState} from "draft-js";
import {DiscussionThreadReply, Sentiments} from "../../api/entities";
import {
    createDiscussionThreadReply,
    downvoteDiscussionThreadReply,
    upvoteDiscussionThreadReply
} from "../../api/discussionThreadReplies";
import * as yup from "yup";
import {useFormik} from "formik";
import Alert from "@material-ui/lab/Alert";
import {Editor} from "react-draft-wysiwyg";
import {StockChart} from "../charts/StockChart";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        child: {
            borderLeft: "1px solid #000"
        },
        breadcrumbs: {
            padding: "15px"
        },
        root: {
            height: 264,
            flexGrow: 1,
            maxWidth: 400,
        },
        paperStyle: {
            width: "100%",
            margin: "1rem auto",
            padding: "1rem"
        },
        divider: {
            margin: "20px",
            height: 0
        },
        padding20: {
            padding: "20px"
        },
        disclosureTable: {
            border: 0,
            width: 500
        },
        loadMoreContainer: {
            marginTop: "30px",
            textAlign: "center"
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
    })
)

const REPLIES_PER_PAGE = 25;

interface MatchParams {
    symbol?: string
    threadId?: string
}

export default function DiscussionThread(props: RouteComponentProps<MatchParams>): React.ReactElement {
    const classes = useStyles();
    const { params } = props.match

    const token = useSelector<AppState, string|undefined>(state => state.user.session?.token);

    const user = useSelector<AppState, UserState>(state => state.user);
    const stockDiscussionThreadReplies = useSelector<AppState, StockDiscussionThreadRepliesState>(state => state.stockDiscussionThreadReplies);

    // @ts-ignore
    const [pageSize, setPageSize] = useState(REPLIES_PER_PAGE);
    // @ts-ignore
    const [page, setPage] = useState(0);

    const [editPostFormContext, setEditPostFormContext] = useState<number|null>(null);

    const [showNewPostForm, setShowNewPostForm] = useState(false);
    const [showEditPostForm, setShowEditPostForm] = useState(false);

    const [showRepliesFor, setShowRepliesFor] = useState<{[key: number]: boolean}>({});

    // @ts-ignore
    const [currentChild, setCurrentChild] = useState(null);
    // @ts-ignore
    const [currentChildPage, setCurrentChildPage] = useState(0);

    if (!params.symbol || !params.threadId) return <div />

    const threadId = parseInt(params.threadId);

    if (!token) return <div>Unauthorized</div>;

    const refreshData = () => {
        if (!token) return;
        if (!params.symbol || !threadId) return;

        if (currentChild) {
            dispatch(performFetchStockDiscussionThreadReplies({
                stockSymbol: params.symbol,
                threadId,
                parentId: currentChild,
                page: currentChildPage,
                pageSize: REPLIES_PER_PAGE,
                token
            }))
        }

        dispatch(performFetchStockDiscussionThreadReplies({
            stockSymbol: params.symbol,
            threadId,
            parentId: null,
            page,
            pageSize,
            token
        }))
    };

    useEffect(() => {
        refreshData();
    }, [token, page, pageSize, threadId, params.symbol]);

    const onUpvoteReply = (record: DiscussionThreadReply) => {
        if (!params.symbol || !token) return;

        upvoteDiscussionThreadReply({token, stockSymbol: params.symbol, replyId: record.id}).then(() =>
            setTimeout(() => refreshData(), 500)
        )
    }

    const onDownvoteReply = (record: DiscussionThreadReply) => {
        if (!params.symbol || !token) return;

        downvoteDiscussionThreadReply({token, stockSymbol: params.symbol, replyId: record.id}).then(() =>
            setTimeout(() => refreshData(), 500)
        )
    }

    const onReplyPosted = () => {
        setShowEditPostForm(false);
        setShowNewPostForm(false);
        refreshData();
    };

    const onShowReplyForm = (record: DiscussionThreadReply) => {
        setEditPostFormContext(record.id);
        setShowNewPostForm(false);
        setShowEditPostForm(true);
    }

    const onHideReplyForm = () => {
        setEditPostFormContext(null);
        setShowNewPostForm(false);
        setShowEditPostForm(false);
    }

    const onShowNewReplyForm = () => {
        setShowEditPostForm(false);
        setShowNewPostForm(true);
    }

    const onShowReplies = (record: DiscussionThreadReply) => {
        setShowRepliesFor(Object.assign({}, showRepliesFor,
            {[record.id]: showRepliesFor.hasOwnProperty(record.id) ? !showRepliesFor[record.id] : true}))
    };

    const editButton = (reply: DiscussionThreadReply) => {
        if (reply.author_id !== user.session?.user_id) return <></>;

        return <><Link href={`#/dashboard/discussions/${params.symbol}/thread/${reply.discussion_thread_id}/reply/${reply.id}/edit`}>Edit</Link> |</>
    }

    const renderReply = (record: DiscussionThreadReply) => {
        const contentState = convertFromRaw(JSON.parse(record.content))
        return <>
            <Paper>
                <TableContainer>
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell width={250}>
                                    <Button
                                        disabled={record.user_voted === false}
                                        variant={"text"}
                                        onClick={() => onDownvoteReply(record)}
                                        size={"small"}
                                    >
                                        <strong>-</strong>
                                    </Button>
                                    <strong>{record.rating} votes</strong>
                                    <Button
                                        disabled={record.user_voted === true}
                                        variant={"text"}
                                        onClick={() => onUpvoteReply(record)}
                                        size={"small"}
                                    >
                                        <strong>+</strong>
                                    </Button>
                                </TableCell>
                                <TableCell align={"left"}>
                                    {moment(record.created).format("MMM Do YYYY")} <span> | </span>
                                    <strong>{record.author_name}</strong> said:
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2}>
                                    <div dangerouslySetInnerHTML={{
                                        __html: stateToHTML(contentState)
                                    }}/>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2}>
                                    <Grid container direction="row">
                                        <Grid xs={2} item><Chip label={params.symbol}/> </Grid>
                                        <Grid xs={2} item>Sentiment: {record.sentiment.toUpperCase()}</Grid>
                                        <Grid xs={2} item>Disclosure: {record.position_held ? "Held" : "Not held"}</Grid>
                                    </Grid>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2}>
                                    <Button onClick={() => onShowReplies(record)}>{record.number_of_replies} replies</Button> | {editButton(record)} <Button onClick={() => onShowReplyForm(record)}>Reply</Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            {showRepliesFor[record.id] &&
                <div style={{padding: 20}}>
                    {stockDiscussionThreadReplies.paginated?.results.filter(v => v.parent_reply_id === record.id).map(renderReply)}
                </div>
            }
            <Divider className={classes.spacer5}/>
            {showEditPostForm && editPostFormContext === record.id && params.symbol &&
            <NewDiscussionThreadReply token={token}
                                      parentReplyId={record.id}
                                      onReplyCancelled={() => onHideReplyForm()}
                                      threadId={threadId}
                                      symbol={params.symbol}
                                      onReplyPosted={onReplyPosted}
            />
            }
        </>
    }

    const root_elements = stockDiscussionThreadReplies.paginated?.results.filter(v => !v.parent_reply_id);

    return <div>
        <Paper className={classes.breadcrumbs}>
            <Breadcrumbs aria-label="breadcrumb">
                <Link color="inherit" href="#/dashboard/discussions">
                    Discussions
                </Link>
                <Typography>
                    <Link href={"#/dashboard/discussions/" + params.symbol}>{params.symbol}</Link>
                </Typography>
                <Typography>
                    <strong>{params.threadId}</strong>
                </Typography>
            </Breadcrumbs>
        </Paper>

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

        <Divider className={classes.divider}/>

            {stockDiscussionThreadReplies.error && !stockDiscussionThreadReplies.paginated &&
                <Typography className={classes.padding20}>Unable to load thread replies...</Typography>
            }

            {stockDiscussionThreadReplies.fetching && !stockDiscussionThreadReplies.paginated &&
                <Typography className={classes.padding20}>Loading thread replies...</Typography>
            }

            {(root_elements || []).map(record => {
                return renderReply(record)
            })}

        {!stockDiscussionThreadReplies.error && !stockDiscussionThreadReplies.fetching && (stockDiscussionThreadReplies.paginated?.total || 0) === 0 &&
            <Typography className={classes.padding20}>No replies found</Typography>
        }

        {/*<Paper className={classes.loadMoreContainer}>*/}
        {/*    {!stockDiscussionThreadReplies.error && !stockDiscussionThreadReplies.fetching && (stockDiscussionThreadReplies.paginated?.total || 0) > 0 &&*/}
        {/*        <Button onClick={() => setPageSize(pageSize + pageSize)}>Load more</Button>*/}
        {/*    }*/}
        {/*</Paper>*/}

        <Button variant="outlined" color="primary" onClick={() => onShowNewReplyForm()}>New Reply</Button>

        <Divider/>

        {showNewPostForm &&
            <NewDiscussionThreadReply
                token={token}
                threadId={threadId}
                symbol={params.symbol}
                onReplyPosted={onReplyPosted}
            />
        }
    </div>
}

type NewReplyProps = {
    threadId: number;
    symbol: string;
    parentReplyId?: number|null;
    onReplyCancelled?: () => void;
    token: string;
    onReplyPosted(): void;
}

function NewDiscussionThreadReply(props: NewReplyProps) {
    if (!props.threadId) return <div>Not Found</div>;

    const classes = useStyles();

    const [editorState, setEditorState] = useState(EditorState.createEmpty())

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSubmitFailed, setIsSubmitFailed] = useState(false);

    const validationSchema = yup.object({
        content: yup.string().required("Content text is required"),
        sentiment: yup.string(),
        position: yup.string(),
    });

    const formik = useFormik({
        initialValues: {
            content: "",
            sentiment: Sentiments.HOLD,
            position: "not held"
        },
        validationSchema: validationSchema,
        validateOnMount: false,
        onSubmit: async (values, { setErrors }) => {
            if (!props.token || !props.symbol || !props.threadId) return;

            setIsProcessing(true)
            setIsSubmitFailed(false)

            const newThreadReplyRequest = {
                threadId: props.threadId,
                parentReplyId: props.parentReplyId||null,
                content: values.content,
                sentiment: values.sentiment,
                position: values.position === "held"
            }

            createDiscussionThreadReply(props.token, props.symbol, newThreadReplyRequest)
                .then(() => {
                    formik.resetForm();
                    props.onReplyPosted();
                })
                .catch((error) => {
                    console.log("Error", error);
                    setIsSubmitFailed(true)
                })
                .finally(() => setIsProcessing(false))
        }
    });

    return <div>
        <Paper elevation={3} className={classes.paperStyle}>
            <form onSubmit={formik.handleSubmit}>
                {isSubmitFailed && (
                    <>
                        <Alert variant="outlined" severity="error">
                            Reply posting failed
                        </Alert>
                        <Divider className={classes.spacer20}/>
                    </>
                )}

                <Typography variant={"h5"}>Post reply</Typography>
                <Divider className={classes.spacer20}/>

                <strong>Write your post here</strong>

                <Divider className={classes.spacer5}/>

                <FormControl error={!!formik.errors.content}>
                    <Editor
                        editorState={editorState}
                        onFocus={() => formik.setFieldTouched("content", true, true)}
                        wrapperClassName={classes.wrapperClassName}
                        onEditorStateChange={(state: EditorState) => {
                            setEditorState(state);
                            formik.setFieldValue("content", JSON.stringify(convertToRaw(state.getCurrentContent())), true);
                        }}
                    />

                    {formik.touched.content && <FormHelperText>{formik.errors.content}</FormHelperText>}
                </FormControl>

                <Divider className={classes.spacer5}/>

                <Grid container className={classes.disclosureGroups} direction="row" spacing={3} justify="space-between">
                    <Grid item xs={5}>
                        <FormControlLabel
                            labelPlacement="top"
                            control={
                                <ToggleButtonGroup
                                    value={formik.values.position}
                                    exclusive
                                    onChange={(evt, value: string|null) => formik.setFieldValue("position", value, true)}
                                >
                                    <ToggleButton value="held" aria-label="left aligned">
                                        Held
                                    </ToggleButton>
                                    <ToggleButton value="not held" aria-label="centered">
                                        Not Held
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            }
                            label="Position disclosure"
                        />
                    </Grid>

                    <Grid item xs={5}>
                        <FormControlLabel
                            labelPlacement="top"
                            control={
                                <ToggleButtonGroup
                                    aria-label="label"
                                    aria-labelledby="id"
                                    value={formik.values.sentiment}
                                    exclusive
                                    onChange={(evt, value: string|null) =>
                                        formik.setFieldValue("sentiment", value, true)
                                    }
                                >
                                    <ToggleButton value="sell" aria-label="left aligned">
                                        Sell
                                    </ToggleButton>
                                    <ToggleButton value="hold" aria-label="centered">
                                        Hold
                                    </ToggleButton>
                                    <ToggleButton color={"primary"} value="buy" aria-label="centered">
                                        Buy
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            }
                            label="Stock sentiment"
                        />
                    </Grid>
                </Grid>

                <Divider className={classes.finalSpacer}/>

                <Grid container direction="row" justify="flex-end">
                    <Grid item>
                        <Button disabled={isProcessing || !formik.isValid} type="submit" variant="contained" color={"primary"}>
                            Post
                        </Button>
                        {props.parentReplyId &&
                            <Button disabled={isProcessing || !formik.isValid}
                                    onClick={() => props.onReplyCancelled && props.onReplyCancelled()} variant="contained"
                                    color={"secondary"}>
                                Cancel
                            </Button>
                        }
                    </Grid>
                </Grid>

            </form>
        </Paper>
    </div>
}