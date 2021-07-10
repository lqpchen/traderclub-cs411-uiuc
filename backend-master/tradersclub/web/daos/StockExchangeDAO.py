from django.db import connection

from tradersclub.web.models import StockExchange


class StockExchangeDAO:

    @staticmethod
    def find_all():
        cursor = connection.cursor()
        cursor.execute(
            """
                SELECT 
                    id,
                    symbol,
                    opening_time,
                    closing_time,
                    country_code,
                    timezone_offset 
                FROM stock_exchange
            """,
            []
        )

        results = []
        for row in cursor.fetchall():
            exchange = StockExchange()
            exchange.id = row[0]
            exchange.symbol = row[1]
            exchange.opening_time = row[2]
            exchange.closing_time = row[3]
            exchange.country_code = row[4]
            exchange.timezone_offset = row[5]

            results.append(exchange)

        return results
