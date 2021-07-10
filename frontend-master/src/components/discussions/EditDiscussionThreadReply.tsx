import React, {useEffect, useState} from "react";
import {RouteComponentProps, useHistory} from "react-router";
import { Editor } from "react-draft-wysiwyg";
import {convertFromRaw, convertToRaw, EditorState} from "draft-js";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import {
    Breadcrumbs,
    Button,
    Divider, FormControl, FormControlLabel,
    FormHelperText, Grid, Link,
    makeStyles,
    Paper,
    Typography
} from "@material-ui/core";
import { useFormik } from "formik"
import * as yup from "yup"
import {DiscussionThreadReply, Sentiments} from "../../api/entities";
import {useSelector} from "react-redux";
import {AppState, dispatch} from "../../store";
import {ToggleButton, ToggleButtonGroup} from "@material-ui/lab";
import Alert from "@material-ui/lab/Alert";
import { updateDiscussionThreadReply } from "../../api/discussionThreadReplies";
import {performFetchDiscussionThreadReplyDetails} from "../../slices/stockDiscussionThread";

interface MatchParams {
    symbol: string,
    threadId: string;
    replyId: string;
}

const useStyles = makeStyles({
    paperStyle: {
        width: "100%",
        margin: "1rem auto",
        padding: "1rem"
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
});

export default function NewDiscussionThread(props: RouteComponentProps<MatchParams>): React.ReactElement {
    const classes = useStyles();
    const history = useHistory();
    const params = props.match.params;

    const token = useSelector<AppState, string|undefined>(state => state.user.session?.token);
    if (!token) return <div>Unauthorized</div>;

    const replyDetails = useSelector<AppState, DiscussionThreadReply|null>(state => state.stockDiscussionThreadReplies.reply);

    const replyId = parseInt(params.replyId);
    const threadId = parseInt(params.threadId);

    if (!replyId || !threadId) return <div>Not Found</div>;

    const [editorState, setEditorState] = useState(EditorState.createEmpty())

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSubmitFailed, setIsSubmitFailed] = useState(false);

    const validationSchema = yup.object({
        content: yup.string().required("Content text is required"),
        sentiment: yup.string(),
        position: yup.string(),
    })

    useEffect(() => {
        if (!replyId || !params.symbol || !token) return;

        if (!replyDetails) {
            dispatch(performFetchDiscussionThreadReplyDetails({
                token,
                stockSymbol: params.symbol,
                replyId
            })).then(() =>
                console.log("Reply resolved", replyDetails)
            )
        } else {
            formik.setFieldValue("content", replyDetails?.content);
            formik.setFieldValue("sentiment", replyDetails?.sentiment);
            formik.setFieldValue("position", replyDetails?.position_held ? "held" : "not held");

            setEditorState(EditorState.createWithContent(convertFromRaw(JSON.parse(replyDetails?.content || "{}"))))

            setTimeout(() => {
                formik.setFieldTouched("content")
                formik.setFieldTouched("sentiment")
                formik.setFieldTouched("position")
            }, 100)
        }
    }, [token, replyDetails, params.symbol, replyId, threadId])

    const formik = useFormik({
        initialValues: {
            content: replyDetails?.content || "",
            sentiment: replyDetails?.sentiment || Sentiments.HOLD,
            position: replyDetails?.position_held || "not held"
        },
        validationSchema: validationSchema,
        validateOnMount: false,
        onSubmit: async (values, { setErrors }) => {
            if (!token || !params.symbol || !replyId || !threadId) return;

            setIsProcessing(true)
            setIsSubmitFailed(false)

            const newThreadRequest = {
                reply_id: replyId,
                content: values.content,
                sentiment: values.sentiment,
                position: values.position === "held"
            }

            updateDiscussionThreadReply(token, params.symbol, newThreadRequest)
                .then(() => history.push("/dashboard/discussions/" + params.symbol + "/thread/" + threadId))
                .catch((error) => {
                    console.log("Error", error);
                    setIsSubmitFailed(true)
                })
                .finally(() => setIsProcessing(false))
        }
    });

    const onCancelRequested = () => {
        history.push("/dashboard/discussions/" + params.symbol + "/thread/" + threadId)
    };

    return <div>
        <Paper>
            <Breadcrumbs aria-label="breadcrumb">
                <Link color="inherit" href="/dashboard/discussions">
                    Discussions
                </Link>
                <Typography>
                    <Link href={"/dashboard/discussions/" + params.symbol}>{params.symbol}</Link>
                </Typography>
                <Typography>
                    <Link href={"/dashboard/discussions/" + params.symbol + "/thread/" + threadId}>Thread</Link>
                </Typography>
                <Typography>
                    Edit reply
                </Typography>
            </Breadcrumbs>
        </Paper>

        <Paper elevation={3} className={classes.paperStyle}>
            <form onSubmit={formik.handleSubmit}>
                {isSubmitFailed && (
                    <>
                        <Alert variant="outlined" severity="error">
                            Reply update failed
                        </Alert>
                        <Divider className={classes.spacer20}/>
                    </>
                )}

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
                            Save
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button onClick={onCancelRequested} variant="contained">
                            Cancel
                        </Button>
                    </Grid>
                </Grid>

            </form>
        </Paper>
    </div>
}