from django.db import connection, transaction
from django.utils import timezone

from tradersclub.web.daos import Paginated
from tradersclub.web.models import DiscussionThreadReply
from tradersclub.web.requests import UpdateDiscussionThreadReplyRequest


class DiscussionThreadReplyDAO:

    @staticmethod
    def create_reply_vote(reply_id: int, user_id: int, value: bool):
        cursor = connection.cursor()

        date = timezone.now()

        cursor.execute(
            """
                insert into discussion_thread_reply_votes (discussion_thread_reply_id, app_user_id, voted_date, value)
                    values(%s, %s, %s, %s)
                    on conflict (discussion_thread_reply_id, app_user_id) do update 
                        SET value = %s,
                            updated_date = %s
                            
                    ;
            """,
            [reply_id, user_id, date, value, value, date]
        )

    @staticmethod
    def update_reply(id: int, data: UpdateDiscussionThreadReplyRequest):
        cursor = connection.cursor()

        return cursor.execute(
            """
                update discussion_thread_reply 
                set 
                    content = %s,
                    sentiment = %s,
                    position_held = %s
                where id = %s
            """,
            [data.content, data.sentiment, data.position_held, id]
        )

    @staticmethod
    def find_reply_by_id(reply_id: int) -> [DiscussionThreadReply]:
        cursor = connection.cursor()

        cursor.execute(
            """
                SELECT
                    reply.id,
                    author_id,
                    reply.discussion_thread_id,
                    au.full_name as author_name,
                    parent_id,
                    content,
                    created,
                    sentiment,
                    position_held,
                    (
                        WITH RECURSIVE tree AS (
                          SELECT id, ARRAY[]::integer[] AS ancestors
                          FROM discussion_thread_reply WHERE parent_id IS NULL
                        
                          UNION ALL
                        
                          SELECT discussion_thread_reply.id, tree.ancestors || discussion_thread_reply.parent_id
                          FROM discussion_thread_reply, tree
                          WHERE discussion_thread_reply.parent_id = tree.id
                        ) SELECT COUNT(*) FROM tree WHERE reply.id = ANY(tree.ancestors)
                    ) as number_of_replies
                    FROM discussion_thread_reply reply
                    left join app_user au on reply.author_id = au.id
                    WHERE
                        reply.id = %s
                    limit 1
            """,
            [reply_id]
        )

        results = cursor.fetchall()

        record = None
        if len(results) != 0:
            row = results[0]

            record = DiscussionThreadReply()
            record.id = row[0]
            record.author_id = row[1]
            record.discussion_thread_id = row[2]
            record.author_name = row[3]
            record.parent_id = row[4]
            record.content = row[5]
            record.created = row[6]
            record.sentiment = row[7]
            record.position_held = row[8]
            record.number_of_replies = row[9]
            results.append(record)

        return record

    @staticmethod
    def find_replies(thread_id: int, user_id: int, parent: int, page: int, page_size: int) -> [Paginated]:
        cursor = connection.cursor()

        parent_check = "parent_id = '" + str(parent) + "'" if parent is not None else "(true)"

        cursor.execute(
            f"""
                SELECT 
                    reply.id,
                    author_id,
                    reply.discussion_thread_id, 
                    au.full_name as author_name,
                    parent_id, 
                    content,
                    created, 
                    sentiment,
                    position_held,
                    (
                        WITH RECURSIVE tree AS (
                          SELECT id, ARRAY[]::integer[] AS ancestors
                          FROM discussion_thread_reply WHERE parent_id IS NULL
                        
                          UNION ALL
                        
                          SELECT discussion_thread_reply.id, tree.ancestors || discussion_thread_reply.parent_id
                          FROM discussion_thread_reply, tree
                          WHERE discussion_thread_reply.parent_id = tree.id
                        ) SELECT COUNT(*) FROM tree WHERE reply.id = ANY(tree.ancestors)
                    ) as number_of_replies,
                    (
                        SELECT SUM(case when value then 1 else -1 end)
                        from discussion_thread_reply_votes v
                        where v.discussion_thread_reply_id = reply.id
                    ) as rating,
                    (
                        SELECT value
                        from discussion_thread_reply_votes v
                        where v.discussion_thread_reply_id = reply.id and v.app_user_id = %s
                    ) as user_voted,
                    reply.parent_id
                    FROM discussion_thread_reply reply
                    left join app_user au on reply.author_id = au.id
                    WHERE
                        {parent_check} and reply.discussion_thread_id = %s
                    limit %s
                    offset %s
            """,
            [user_id, thread_id, page_size, page * page_size]
        )

        results = []
        for row in cursor.fetchall():
            record = DiscussionThreadReply()
            record.id = row[0]
            record.author_id = row[1]
            record.discussion_thread_id = row[2]
            record.author_name = row[3]
            record.parent_id = row[4]
            record.content = row[5]
            record.created = row[6]
            record.sentiment = row[7]
            record.position_held = row[8]
            record.number_of_replies = row[9]
            record.rating = row[10] if row[10] is not None else 0
            record.user_voted = row[11]
            record.parent_reply_id = row[12]
            results.append(record)

        return Paginated(results, 100)

    @staticmethod
    def create(reply: DiscussionThreadReply):
        cursor = connection.cursor()
        cursor.execute(
            """
                INSERT INTO discussion_thread_reply(parent_id, content, sentiment, position_held, 
                                                    discussion_thread_id, author_id, created) 
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """,
            [reply.parent_id, reply.content, reply.sentiment, reply.position, reply.discussion_thread_id,
             reply.author_id, timezone.now()]
        )

        cursor.execute(
            """
                SELECT currval(pg_get_serial_sequence('discussion_thread_reply','id'));
            """
        )

        return cursor.fetchone()[0]

    @staticmethod
    def get(discussion_thread_id: str) -> [DiscussionThreadReply]:
        cursor = connection.cursor()
        cursor.execute(
            """
                SELECT id, content, discussion_thread_id, author_id, created 
                    FROM discussion_thread_reply 
                    WHERE discussion_thread_id = (%s);
            """,
            [discussion_thread_id]
        )
        results = []
        for row in cursor.fetchall():
            record = DiscussionThreadReply()
            record.id = row[0]
            record.content = row[1]
            record.discussion_thread_id = row[2]
            record.author_id = row[3]
            record.created = row[4]
            results.append(record)
        return results
