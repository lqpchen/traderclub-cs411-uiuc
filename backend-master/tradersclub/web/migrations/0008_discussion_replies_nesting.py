from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = False

    dependencies = [
        ("web", "0006_discussion_thread_fields")
    ]

    operations = [
        migrations.RunSQL(
            """
                alter table discussion_thread_reply 
                    add  parent_id int,
                    add foreign key (parent_id) references discussion_thread_reply(id) on delete cascade;
            """
        )
    ]