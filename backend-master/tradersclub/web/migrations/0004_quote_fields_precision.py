from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = False

    dependencies = [
        ("web", "0003_new_quote_fields")
    ]

    operations = [
        migrations.RunSQL(
            """
                alter table quote alter column quote_open TYPE float;
                alter table quote alter column quote_close TYPE float;
                alter table quote alter column high TYPE float;
                alter table quote alter column low  TYPE float;
                alter table quote alter column adjusted_close TYPE float;
            """
        )
    ]