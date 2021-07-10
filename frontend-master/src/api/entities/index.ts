export const COMPANIES_PAGE_SIZE = 10;

export type Session = {
    token: string
    user_id: number,
    created_at: number
    expires_on: number
}

export type User = { email: string, full_name: string };

export type Quote = {
    id: number,
    stock_id: number,
    quote_open: number,
    quote_close: number,
    quote_high: number,
    quote_volume: number,
    quote_low: number,
    quote_date: Date
};

export type StockSentiment = {
    sentiment: number;
};

export type Stock = {
    id: number,
    stock_exchange_name: string,
    company_name: string,
    symbol: string,
    quote_open: number,
    quote_close: number,
    quote_high: number,
    quote_low: number,
    quote_date: number,
    quote_volume: number,
    quote_day_move: number,
    quote_adjusted_close: number,
    market_cap: number
};
export type FavouriteStock = {stock: Stock, since: number};

export type DiscussionThread = {
    id: number,
    subject: string,
    author_id: number,
    author_name: string,
    stock_id: number,
    stock_symbol: string,
    created: number,
    last_reply_created: number|null,
    last_reply_id: number|null,
    last_reply_author_name: string|null,
    last_reply_author_id: number|null,
    number_of_posts: number|null
};

export type DiscussionThreadReply = {
    id: number;
    parent_reply_id: number|null;
    content: string;
    created: string;
    rating: number;
    discussion_thread_id: number;
    author_id: number;
    author_name: string;
    sentiment: Sentiment;
    position_held: boolean;
    number_of_replies: number;
    user_voted: boolean|null;
}

export type Paginated<T> = {
    total: number,
    results: T[]
}

export type Sentiment = "hold" | "buy" | "sell";

export type StockArticle = {
    external_id: number;
    headline: string;
    stock_symbol: string;
    stock_id: string;
    sentiment: number;
    content: string;
    url: string;
    author_name: string;
    release_date: Date;
};

export type StockFinancials = {
    id: number;
    start_date: number;
    end_date: number;
    year: number;
    quarter: string;
    stock_id: number;
    data: any;
}

export type FinancialConcept = {
    label: string,
    concept: number,
    value: number,
    unit: string
}

export type StockFinancialData = {
    bs: FinancialConcept[]
    ic: FinancialConcept[],
    cf: FinancialConcept[]
}

export const Sentiments: {[key: string]: Sentiment} = {
    HOLD: "hold",
    BUY: "buy",
    SELL: "sell"
}