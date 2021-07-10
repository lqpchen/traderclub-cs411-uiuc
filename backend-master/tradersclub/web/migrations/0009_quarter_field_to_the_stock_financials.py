from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = False

    dependencies = [
        ("web", "0008_discussion_replies_nesting")
    ]

    operations = [
        migrations.RunSQL(
            """
                alter table stock_financials add  quarter varchar(16);
            """
        )
    ]