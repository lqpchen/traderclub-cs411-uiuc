from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = False

    dependencies = [
        ("web", "0002_new_stock_fields")
    ]

    operations = [
        migrations.RunSQL(
            """
                alter table quote add column volume float;
                alter table quote add column adjusted_close float;
            """
        )
    ]