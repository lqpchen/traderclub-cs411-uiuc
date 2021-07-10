from django.db import connection

from tradersclub.web.models import Company


class CompanyDAO:

    @staticmethod
    def find_by_name(name: str) -> 'Company':
        cursor = connection.cursor()
        cursor.execute(
            """
                SELECT id, name 
                FROM company 
                WHERE name = (%s)
            """,
            [name]
        )
        results = []
        for row in cursor.fetchall():
            record = Company()
            record.id = row[0]
            record.name = row[1]
            results.append(record)

        return None if len(results) == 0 else results[0]

    @staticmethod
    def list():
        cursor = connection.cursor()
        cursor.execute(
            """
                SELECT id, name 
                FROM company
            """,
            []
        )

        results = []
        for row in cursor.fetchall():
            record = Company()
            record.id = row[0]
            record.name = row[1]
            results.append(record)

        return results
