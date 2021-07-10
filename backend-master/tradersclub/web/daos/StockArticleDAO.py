from typing import List

from django.db import connection

from tradersclub.web.daos import Paginated
from tradersclub.web.models import StockArticle


class StockArticleDAO:

    @staticmethod
    def find_articles(stock_id: int = None, target_ids_range: [int] = [], page: int = 0, page_size: int = 25) -> List[StockArticle]:
        cursor = connection.cursor()

        target_ids_range_str = str(target_ids_range).strip("[]")

        criteria = []
        criteria.append("true" if (
                    target_ids_range is None or target_ids_range == []) else f" stock_article.id in ({target_ids_range_str})")
        criteria.append("true" if stock_id is None else f" stock_id = {stock_id}")

        criteria_str = "where " + (" AND ".join(criteria))


        full_select_sql = f"""
            select stock_article.id, external_id, headline, url, author_name, stock_id, release_date, s.symbol, content
            from stock_article
            left join stock s on s.id = stock_article.stock_id
            {criteria_str}
            OFFSET %s
            LIMIT %s
        """

        cursor.execute(full_select_sql, [page * page_size, page_size])

        rows = cursor.fetchall()

        results = []
        for row in rows:
            record = StockArticle()
            record.id = row[0]
            record.external_id = row[1]
            record.headline = row[2]
            record.url = row[3]
            record.author_name = row[4]
            record.stock_id = row[5]
            record.release_date = row[6]
            record.stock_symbol = row[7]
            record.content = row[8]
            results.append(record)

        return results