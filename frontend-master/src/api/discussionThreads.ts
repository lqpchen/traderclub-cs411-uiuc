import config from "../config"
import {DiscussionThread, DiscussionThreadReply, Paginated, Sentiment} from "./entities";
import {axiosInstance} from "./index";

type ListStockDiscussionThreadsPayload = {
    token: string,
    stockSymbol?: string,
    page: number,
    pageSize: number
};

export async function listStockDiscussionThreads(payload: ListStockDiscussionThreadsPayload): Promise<Paginated<DiscussionThread>> {
    const response = await axiosInstance.get(
        config.endpointUrl + "/stocks" + (payload.stockSymbol ? "/" + payload.stockSymbol : "") + "/threads/?page=" + payload.page + "&page_size=" + payload.pageSize,
        { headers: { Authorization: `Bearer ${payload.token}` } }
    );
    return response.data;
}


type NewThreadrequestPayload = {
    content: string,
    subject: string,
    position: boolean,
    sentiment: Sentiment
}
export function createNewThread(token: string, stockSymbol: string, payload: NewThreadrequestPayload): Promise<void> {
    return axiosInstance.post(
        config.endpointUrl + "/stocks/" + stockSymbol + "/threads/",
        JSON.stringify(payload),
        { headers: { Authorization: `Bearer ${token}` } }
    );
}

type FetchDiscussionThreadReplyPayload = {
    token: string, stockSymbol: string, replyId: number
};

export async function fetchDiscussionThreadReply(payload: FetchDiscussionThreadReplyPayload): Promise<DiscussionThreadReply> {
    const response = await axiosInstance.get(
        config.endpointUrl + "/stocks/" + payload.stockSymbol + "/threads/replies/" + payload.replyId,
        { headers: { Authorization: `Bearer ${payload.token}` } }
    );
    return response.data;
}

type DeleteThreadByIdPayload = {
    token: string;
    stockSymbol: string;
    threadId: number;
}
export function deleteThreadById(payload: DeleteThreadByIdPayload): Promise<void> {
    return axiosInstance.delete(
        config.endpointUrl + "/stocks/" + payload.stockSymbol + "/threads/" + payload.threadId,
        { headers: { Authorization: `Bearer ${payload.token}` } }
    );
}