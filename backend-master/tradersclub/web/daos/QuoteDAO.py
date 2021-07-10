from typing import Optional

from django.db import connection

from tradersclub.web.models import Quote


class QuoteDAO:
    @staticmethod
    def find_for_period(stock_symbol, from_date: Optional[str] = None,
                        to_date: Optional[str] = None):  # add support for period ranges
        cursor = connection.cursor()

        sql = f"""
            SELECT 
                q.id, 
                q.quote_open, 
                q.quote_close, 
                q.quote_date, 
                q.high, 
                q.low, 
                q.volume, 
                q.stock_id
             FROM quote q
             LEFT JOIN stock s ON q.stock_id = s.id
        """

        if from_date is not None and to_date is not None:
            sql += " WHERE s.symbol = '{}' and q.quote_date between '{}' and '{}' " \
                .format(stock_symbol, from_date, to_date)
        else:
            sql += " WHERE s.symbol = '{}' ".format(stock_symbol)

        sql += " order by q.quote_date"

        cursor.execute(sql, [])

        results = []
        for row in cursor.fetchall():
            quote = Quote()
            quote.id = row[0]
            quote.quote_open = row[1]
            quote.quote_close = row[2]
            quote.quote_date = row[3]
            quote.quote_high = row[4]
            quote.quote_low = row[5]
            quote.quote_volume = row[6]
            quote.stock_id = row[7]

            results.append(quote)
        return results
