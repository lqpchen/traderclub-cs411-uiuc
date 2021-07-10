from django.db import connection


class StockDAO:

    @staticmethod
    def find_stock_id_by_symbol(symbol: str) -> int:
        cursor = connection.cursor()
        query = """
            SELECT * 
            FROM stock
            WHERE symbol = %s 
            limit 1
        """
        cursor.execute(query, [symbol])

        symbol_id = None
        result = cursor.fetchone()
        if result is not None:
            symbol_id = result[0]

        return symbol_id
