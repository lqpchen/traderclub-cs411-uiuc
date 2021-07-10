import config from "../config"
import {DiscussionThreadReply, Paginated, Sentiment} from "./entities";
import {axiosInstance} from "./index";

type ListStockDiscussionThreadRepliesPayload = {
    token: string,
    stockSymbol: string,
    threadId: number,
    parentId: number|null,
    page: number,
    pageSize: number
};

export async function listStockDiscussionThreadReplies(payload: ListStockDiscussionThreadRepliesPayload): Promise<Paginated<DiscussionThreadReply>> {
    const response = await axiosInstance.get(
        config.endpointUrl + "/stocks/" + payload.stockSymbol + "/threads/" + payload.threadId
                    + "/replies/?page=" + payload.page + "&page_size=" + payload.pageSize + (payload.parentId == null ? "" : "&parent=" + payload.parentId),
        { headers: { Authorization: `Bearer ${payload.token}` } }
    );
    return response.data;
}

type EditDiscussionThreadReplyPayload = {
    reply_id: number;
    content: string,
    position: boolean,
    sentiment: Sentiment
}
export function updateDiscussionThreadReply(token: string, stockSymbol: string,
                                          payload: EditDiscussionThreadReplyPayload): Promise<void> {
    return axiosInstance.post(
        config.endpointUrl + "/stocks/" + stockSymbol + "/threads/replies/" + payload.reply_id + "/edit",
        JSON.stringify(payload),
        { headers: { Authorization: `Bearer ${token}` } }
    );
}

type CreateDiscussionThreadReplyPayload = {
    content: string,
    position: boolean,
    parentReplyId: number|null;
    threadId: number;
    sentiment: Sentiment
}
export function createDiscussionThreadReply(token: string, stockSymbol: string,
                                            payload: CreateDiscussionThreadReplyPayload): Promise<void> {
    return axiosInstance.post(
        config.endpointUrl + "/stocks/" + stockSymbol + "/threads/" + payload.threadId + "/replies/create",
        JSON.stringify(payload),
        { headers: { Authorization: `Bearer ${token}` } }
    );
}

type UpvoteReplyPayload = {
    stockSymbol: string, token: string, replyId: number
};
export function upvoteDiscussionThreadReply(payload: UpvoteReplyPayload): Promise<void> {
    return axiosInstance.post(
        config.endpointUrl + "/stocks/" + payload.stockSymbol + "/threads/replies/" + payload.replyId + "/upvote",
        JSON.stringify(payload),
        { headers: { Authorization: `Bearer ${payload.token}` } }
    );
}

type DownvoteReplyPayload = {
    stockSymbol: string, token: string, replyId: number
};
export function downvoteDiscussionThreadReply(payload: DownvoteReplyPayload): Promise<void> {
    return axiosInstance.post(
        config.endpointUrl + "/stocks/" + payload.stockSymbol + "/threads/replies/" + payload.replyId + "/downvote",
        JSON.stringify(payload),
        { headers: { Authorization: `Bearer ${payload.token}` } }
    );
}
