from django.db import connection

from tradersclub.web.daos import Paginated
from tradersclub.web.models import StockFinancials


class StockFinancialsDAO():

    @staticmethod
    def find_by_stock_symbol(stock_symbol: str, page: int, page_size: int) -> Paginated:
        cursor = connection.cursor()

        cursor.execute(
            """
                select count(*)
                from stock_financials
                left join stock s on s.id = stock_financials.stock_id
                where s.symbol = %s
            """,
            [stock_symbol]
        )

        total_count = 0
        result = cursor.fetchall()
        if len(result) > 0:
            total_count = result[0][0]

        cursor.execute(
            """
                select stock_financials.id, start_date, end_date, year, stock_id, data, quarter
                from stock_financials
                left join stock s on s.id = stock_financials.stock_id
                where s.symbol = %s
                order by stock_financials.end_date desc
                offset %s
                limit %s
            """,
            [stock_symbol, page * page_size, page_size]
        )

        results = []
        for row in cursor.fetchall():
            record = StockFinancials()
            record.id = row[0]
            record.start_date = row[1]
            record.end_date = row[2]
            record.year = row[3]
            record.stock_id = row[4]
            record.data = row[5]
            record.quarter = row[6]
            results.append(record)

        return Paginated(results, total_count)