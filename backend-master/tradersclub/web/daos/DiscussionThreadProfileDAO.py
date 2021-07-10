from django.db import connection

from tradersclub.web.daos import Paginated
from tradersclub.web.models import DiscussionThreadProfile


class DiscussionThreadProfileDAO:

    @staticmethod
    def find_all(stock_symbol: str = None, page: int = 0, page_size: int = 25) -> [Paginated]:
        cursor = connection.cursor()

        stock_clause = "" if stock_symbol is None else "WHERE s.symbol = '{0}'".format(stock_symbol)

        # Count query
        cursor.execute(
            f"""
                SELECT count(*)
                from discussion_thread
                LEFT JOIN stock s ON s.id = stock_id
                {stock_clause}
            """,
            []
        )

        result = cursor.fetchone()
        total_count = 0
        if len(result) > 0:
            total_count = result[0]

        cursor.execute(
            f"""
                SELECT t.id as thread_id, 
                       t.subject as thread_subject, 
                       t.author_id thread_author_id, 
                       s.id as stock_id,
                       t.created thread_created,
                       dtlr.created last_reply_created,
                       dtlr.id,
                       dtla.full_name last_reply_author_name,
                       dtlr.author_id last_reply_author_id,
                       dts.number_of_posts,
                       thread_author.full_name thread_author_name,
                       s.symbol as stock_symbol
                FROM discussion_thread t 
                LEFT JOIN stock s ON s.id = t.stock_id 
                LEFT JOIN discussion_thread_stats dts ON t.id = dts.discussion_thread_id 
                LEFT JOIN discussion_thread_reply dtlr ON dts.last_reply_id = dtlr.id 
                LEFT JOIN app_user dtla ON dtla.id = dtlr.author_id 
                LEFT JOIN app_user thread_author ON t.author_id = thread_author.id 
                {stock_clause}
                ORDER BY  last_reply_created DESC
                LIMIT %s
                OFFSET %s
            """,
            [page_size, page * page_size]
        )

        results = []
        for row in cursor.fetchall():
            record = DiscussionThreadProfile()
            record.id = row[0]
            record.subject = row[1]
            record.author_id = row[2]
            record.stock_id = row[3]
            record.created = row[4]
            record.last_reply_created = row[5]
            record.last_reply_id = row[6]
            record.last_reply_author_name = row[7]
            record.last_reply_author_id = row[8]
            record.number_of_posts = row[9]
            record.author_name = row[10]
            record.stock_symbol = row[11]
            results.append(record)

        return Paginated(results, total_count)