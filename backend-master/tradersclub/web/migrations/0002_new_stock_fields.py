from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = False

    dependencies = [
        ("web", "0001_initial")
    ]

    operations = [
        migrations.RunSQL(
            """
                alter table stock add column sec_number integer;
                alter table stock add column cik_number integer;
                alter table stock add column irs_number integer;
            """
        )
    ]