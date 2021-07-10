from django.db import connection
from tradersclub.web.models import AppUser


class AppUserDAO():
    @staticmethod
    def create(app_user: AppUser):
        cursor = connection.cursor()

        return cursor.execute(
            """
                INSERT INTO app_user(email, full_name, password) 
                VALUES ((%s), (%s), (%s))
            """,
            [app_user.email, app_user.full_name, app_user.password]
        )

    @staticmethod
    def find_by_email(email: str) -> AppUser:
        cursor = connection.cursor()
        cursor.execute(
            """
                SELECT id, email, full_name, password 
                FROM app_user 
                WHERE email = (%s)
            """,
            [email]
        )

        results = []
        for row in cursor.fetchall():
            record = AppUser()
            record.id = row[0]
            record.email = row[1]
            record.full_name = row[2]
            record.password = row[3]
            results.append(record)

        return None if len(results) == 0 else results[0]