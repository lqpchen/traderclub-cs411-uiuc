from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = False

    dependencies = [
        ("web", "0009_quarter_field_to_the_stock_financials")
    ]

    operations = [
        migrations.RunSQL(
            """
                create table discussion_thread_reply_votes(
                    discussion_thread_reply_id bigint not null,
                    app_user_id bigint not null,
                    voted_date timestamp not null,
                    updated_date timestamp,
                    value boolean not null,
                    foreign key (discussion_thread_reply_id) references discussion_thread_reply(id) on delete cascade,
                    foreign key (app_user_id) references app_user(id) on delete cascade,
                    unique (discussion_thread_reply_id, app_user_id)
                )
            """
        )
    ]