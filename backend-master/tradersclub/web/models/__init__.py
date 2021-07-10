

class AppUser():
    def __init__(self):
        self.id = None
        self.email = None
        self.full_name = None
        self.password = None


class Company():
    def __init__(self):
        self.id = None
        self.name = None


class AppUserFavouriteStock():
    def __init__(self):
        self.app_user_id = None
        self.stock_id = None
        self.added_on = None


class StockProfile:
    def __init__(self):
        self.symbol = None
        self.company_id = None
        self.company_name = None
        self.stock_exchange_symbol = None
        self.stock_exchange_id = None
        self.sec_number = None
        self.cik_number = None
        self.irs_number = None
        self.quote_high = None
        self.quote_low = None
        self.quote_open = None
        self.quote_date = None
        self.quote_close = None
        self.day_move = None
        self.market_cap = None


class StockExchange:

    def __init__(self):
        self.id = None
        self.symbol = None
        self.country_code = None
        self.opening_time = None
        self.closing_time = None
        self.timezone_offset = None


class Quote:
    def __init__(self):
        self.id = None
        self.quote_open = None
        self.quote_close = None
        self.quote_date = None
        self.quote_high = None
        self.quote_low = None
        self.stock_id = None
        self.volume = None


class DiscussionThread:
    def __init__(self):
        self.id = None
        self.stock_id = None
        self.author_id = None
        self.created = None
        self.subject = None


class StockArticle:
    def __init__(self):
        self.id = None
        self.sentiment = None
        self.headline = None
        self.url = None
        self.author_name = None
        self.stock_id = None


class DiscussionThreadProfile:
    def __init__(self):
        self.id = None
        self.subject = None
        self.author_id = None
        self.author_name = None
        self.stock_id = None
        self.stock_symbol = None
        self.created = None
        self.last_reply_created = None
        self.last_reply_id = None
        self.last_reply_author_name = None
        self.last_reply_author_id = None
        self.number_of_posts = None


class DiscussionThreadReplyVote:
    def __init__(self):
        self.app_user_id = None
        self.discussion_thread_reply_id = None
        self.value = None
        self.voted_date = None


class DiscussionThreadReply:
    def __init__(self):
        self.id = None
        self.content = None
        self.parent_id = None
        self.discussion_thread_id = None
        self.author_id = None
        self.sentiment = None
        self.position = None
        self.created = None
        self.has_voted = None
        self.user_voted = None


class StockFinancials:
    def __init__(self):
        self.id = None
        self.start_date = None
        self.end_date = None
        self.year = None
        self.stock_id = None
        self.data = None
