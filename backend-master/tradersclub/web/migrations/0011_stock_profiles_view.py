from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = False

    dependencies = [
        ("web", "0010_discussion_thread_reply_votes")
    ]

    operations = [
        migrations.RunSQL(
            """
                create materialized view stock_profiles as
                select
                    q.id,
                    q.symbol,
                    q.stock_exchange_id,
                    q.stock_exchange_name,
                    q.company_id,
                    q.company_name,
                    q.sec_number,
                    q.cik_number,
                    q.irs_number,
                    q.quote_date,
                    q.quote_open,
                    q.high as quote_high,
                    q.low as quote_low,
                    q.quote_close,
                    q.adjusted_close as quote_adjusted_close,
                    q.volume as quote_volume,
                    q.day_move as quote_day_move,
                    q.treasury_stock,
                    q.preferred_stock,
                    q.common_stock,
                    (q.common_stock + q.treasury_stock + q.preferred_stock) as market_cap
                from (
                         SELECT s.id,
                                s.symbol,
                                s.stock_exchange_id,
                                se.symbol as stock_exchange_name,
                                s.company_id,
                                c.name as company_name,
                                s.sec_number,
                                s.cik_number,
                                s.irs_number,
                                q.quote_date,
                                q.quote_open,
                                q.high,
                                q.low,
                                q.quote_close,
                                q.adjusted_close,
                                q.volume,
                                (((q.quote_close - q.quote_open) / q.quote_open) * 100) as day_move,
                                (
                                    SELECT case
                                               when b::jsonb ->> 'value' in ('N/A', '') then
                                                   0::bigint
                                               else (b::jsonb ->> 'value')::double precision * q.adjusted_close
                                               end
                                    FROM stock_financials f
                                             CROSS JOIN LATERAL jsonb_array_elements(f.data::jsonb -> 'bs') as b
                                    WHERE b::jsonb @> '{
                                      "concept": "TreasuryStockValue"
                                    }'::jsonb
                                      AND f.stock_id = s.id
                                    ORDER BY f.end_date DESC
                                    limit 1
                                )                                                          treasury_stock,
                                (
                                    SELECT case
                                               when b::jsonb ->> 'value' in ('N/A', '') then
                                                   0::bigint
                                               else (b::jsonb ->> 'value')::double precision * q.adjusted_close
                                               end
                                    FROM stock_financials f
                                             CROSS JOIN LATERAL jsonb_array_elements(f.data::jsonb -> 'bs') as b
                                    WHERE b::jsonb @> '{
                                      "concept": "CommonStockValue"
                                    }'::jsonb
                                      AND f.stock_id = s.id
                                    ORDER BY f.end_date DESC
                                    limit 1
                                )                                                          common_stock,
                                (
                                    SELECT case
                                               when b::jsonb ->> 'value' in ('N/A', '') then
                                                   0::bigint
                                               else (b::jsonb ->> 'value')::double precision * q.adjusted_close
                                               end
                                    FROM stock_financials f
                                             CROSS JOIN LATERAL jsonb_array_elements(f.data::jsonb -> 'bs') as b
                                    WHERE b::jsonb @> '{
                                      "concept": "PreferredStockValue"
                                    }'::jsonb
                                      AND f.stock_id = s.id
                                    ORDER BY f.end_date DESC
                                    limit 1
                                )                                                          preferred_stock
                         FROM stock s
                                  LEFT JOIN company c on s.company_id = c.id
                                  LEFT JOIN stock_exchange se on s.stock_exchange_id = se.id
                                  LEFT JOIN quote q on q.stock_id = s.id
                         WHERE s.id IS NOT NULL
                           AND s.symbol IS NOT NULL
                           AND length(se.symbol) > 0
                           AND s.id = q.stock_id
                           AND q.quote_date = (
                             SELECT quote_date
                             FROM quote qmax
                             WHERE qmax.stock_id = s.id
                             order by quote_date desc
                             limit 1
                         )
                           AND q.id IS NOT NULL
                     ) q
                order by market_cap desc nulls last;
            """
        )
    ]