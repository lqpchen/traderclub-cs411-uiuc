from django.db import connection

from tradersclub.web.daos import Paginated
from tradersclub.web.models import StockProfile


class StockProfileDAO:
    @staticmethod
    def find_all(page: int, page_size: int, sort_column: str, sort_direction: str, user_id: int = None) -> Paginated:
        cursor = connection.cursor()

        favourite_check_clause = f" q.id in (select fs.stock_id from app_user_favourite_stock as fs where fs.app_user_id = {user_id})"

        count_query_body = """
            SELECT 
                count(*)
            from stock q
            left join company c on q.company_id = c.id
            left join stock_exchange se on q.stock_exchange_id = se.id
            where se.id is not null  and se.symbol is not null and length(se.symbol) > 0
        """

        if user_id is not None:
            count_query_body += " AND " + favourite_check_clause

        cursor.execute(count_query_body, [])

        total_records = 0

        results = cursor.fetchall()
        if len(results) > 0:
            total_records = results[0][0]

        order_by_clause = ""
        if sort_column and sort_direction:
            sort_direction_filtered = "ASC" if sort_direction.lower() == "asc" else "DESC"
            if sort_column == "symbol":
                order_by_clause += " ORDER BY q.symbol " + sort_direction_filtered
            elif sort_column == "name":
                order_by_clause += " ORDER BY q.company_name " + sort_direction_filtered
            elif sort_column == "day_move":
                order_by_clause += " ORDER BY q.quote_day_move " + sort_direction_filtered + " nulls last"
            elif sort_column == "day_volume":
                order_by_clause += " ORDER BY q.quote_volume " + sort_direction_filtered + " nulls last"
            elif sort_column == "market_cap":
                order_by_clause += " ORDER BY q.market_cap " + sort_direction_filtered + " nulls last"
            elif sort_column == "price":
                order_by_clause += " ORDER BY q.quote_adjusted_close " + sort_direction_filtered + " nulls last"
        else:
            order_by_clause = " ORDER BY q.market_cap desc nulls last"

        query_body = """
            select q.id,
                   q.symbol,
                   q.stock_exchange_id,
                   q.stock_exchange_name,
                   q.company_id,
                   q.company_name,
                   q.sec_number,
                   q.cik_number,
                   q.irs_number,
                   q.quote_date,
                   q.quote_open,
                   q.quote_high,
                   q.quote_low,
                   q.quote_close,
                   q.quote_adjusted_close,
                   q.quote_volume,
                   q.quote_day_move,
                   q.treasury_stock,
                   q.preferred_stock,
                   q.common_stock,
                   q.market_cap 
             from stock_profiles q
        """

        if user_id is not None:
            query_body += "WHERE " + favourite_check_clause

        query_body += order_by_clause
        query_body += " LIMIT %s OFFSET %s"

        # count query
        cursor.execute(
            query_body,
            [page_size, page * page_size]
        )

        results = []
        for row in cursor.fetchall():
            stock = StockProfile()
            stock.id = row[0]
            stock.symbol = row[1]
            stock.stock_exchange_id = row[2]
            stock.stock_exchange_name = row[3]
            stock.company_id = row[4]
            stock.company_name = row[5]
            stock.sec_number = row[6]
            stock.cik_number = row[7]
            stock.irs_number = row[8]
            stock.quote_date = row[9]
            stock.quote_open = float(row[10])
            stock.quote_high = float(row[11])
            stock.quote_low = float(row[12])
            stock.quote_close = float(row[13])
            stock.quote_adjusted_close = float(row[14]) if row[14] else None
            stock.quote_volume = float(row[15]) if row[15] else None
            stock.quote_day_move = float(row[16]) if row[16] else None
            stock.treasury_stock = float(row[17]) if row[17] else 0
            stock.preferred_stock = float(row[18]) if row[18] else 0
            stock.common_stock = float(row[19]) if row[19] else 0
            stock.market_cap = stock.treasury_stock + stock.preferred_stock + stock.common_stock

            results.append(stock)

        return Paginated(results, total_records)
