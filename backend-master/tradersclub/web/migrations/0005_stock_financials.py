from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = False

    dependencies = [
        ("web", "0004_quote_fields_precision")
    ]

    operations = [
        migrations.RunSQL(
            """
                create table stock_financials(
                    id bigserial not null,
                    start_date timestamp not null,
                    end_date timestamp not null,
                    year int not null,
                    stock_id bigint not null,
                    data jsonb not null,
                    primary key (id),
                    foreign key (stock_id) references stock(id) on delete cascade,
                    unique (stock_id, start_date, end_date)      
                );
                
                create index stock_financials_by_date on stock_financials (stock_id, start_date, end_date);
            """
        )
    ]