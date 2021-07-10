

from django.db import connection
from django.utils import timezone

from tradersclub.web.daos import Paginated
from tradersclub.web.models import AppUserFavouriteStock


class AppUserFavouriteStockDAO:

    def __init__(self):
        self.app_user_id = None
        self.stock_id = None
        self.added_on = None

    @staticmethod
    def create(app_user_favourite_stock: 'AppUserFavouriteStock'):
        cursor = connection.cursor()
        return cursor.execute(
            """
                INSERT INTO app_user_favourite_stock(app_user_id, stock_id, added_on) 
                VALUES (%s, %s, %s);
            """,
            [app_user_favourite_stock.app_user_id, app_user_favourite_stock.stock_id, timezone.now()]
        )

    @staticmethod
    def find_by_user(app_user_id: str, page: int, page_size: int) -> Paginated:
        cursor = connection.cursor()

        cursor.execute(
            """
                SELECT count(*) 
                FROM app_user_favourite_stock 
                WHERE app_user_id = (%s);
            """,
            [app_user_id]
        )

        total_records = cursor.fetchall()[0][0]

        cursor.execute(
            """
                SELECT stock_id, added_on 
                FROM app_user_favourite_stock 
                WHERE app_user_id = (%s)
                LIMIT %d
                OFFSET %d
            """,
            [app_user_id, page_size, page * page_size]
        )

        records = []
        for row in cursor.fetchall():
            record = AppUserFavouriteStock()
            record.app_user_id = app_user_id
            record.stock_id = row.get[0]
            record.added_on = row.get[1]
            records.append(record)

        return Paginated(results = records, total = total_records)

    @staticmethod
    def find_ids_by_user(app_user_id: int) -> [int]:
        cursor = connection.cursor()
        cursor.execute(
            """
                SELECT stock_id
                FROM 
                    app_user_favourite_stock 
                WHERE app_user_id = (%s);
            """,
            [app_user_id]
        )

        results = []
        for row in cursor.fetchall():
            results.append(row[0])

        return results

    @staticmethod
    def delete(app_user_id: int, stock_id: int):
        cursor = connection.cursor()
        return cursor.execute(
            """
                DELETE FROM app_user_favourite_stock 
                WHERE 
                    app_user_id = (%s) AND stock_id = (%s);
            """,
            [app_user_id, stock_id]
        )
