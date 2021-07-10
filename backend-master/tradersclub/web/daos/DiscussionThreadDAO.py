from django.db import connection, transaction
from django.utils import timezone

from tradersclub.web.models import DiscussionThread


class DiscussionThreadDAO:

    @staticmethod
    def delete_by_id(thread_id: int):
        cursor = connection.cursor()

        return cursor.execute(
            """
                delete from discussion_thread
                where id = %s
            """,
            [thread_id]
        )

    @staticmethod
    def find_author_id(thread_id: int) -> DiscussionThread:
        cursor = connection.cursor()

        cursor.execute(
            """
                select author_id from discussion_thread
                where id = %s
            """,
            [thread_id]
        )

        result = cursor.fetchone()

        return None if len(result) == 0 else result[0]

    @staticmethod
    def create(thread: DiscussionThread):
        cursor = connection.cursor()

        cursor.execute(
            """
                INSERT INTO discussion_thread(subject, stock_id, author_id, created) 
                    VALUES (%s, %s, %s, %s);
            """,
            [thread.subject, thread.stock_id, thread.author_id, thread.created]
        )

        cursor.execute(
            """
                SELECT currval(pg_get_serial_sequence('discussion_thread','id'));
            """
        )

        return cursor.fetchone()[0];
