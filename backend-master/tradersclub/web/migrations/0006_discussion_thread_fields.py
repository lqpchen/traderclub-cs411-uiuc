from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = False

    dependencies = [
        ("web", "0005_stock_financials")
    ]

    operations = [
        migrations.RunSQL(
            """
                alter table discussion_thread
                    drop content,
                    add subject varchar(1024),
                    add stock_id bigint not null,
                    add foreign key (stock_id) REFERENCES stock(id);
                    
                create type stock_sentiment_t as enum('buy', 'sell', 'hold');
                    
                alter table discussion_thread_reply
                    add sentiment stock_sentiment_t not null default 'hold',
                    add position_held bool default false;
                    
                create table discussion_thread_stats(
                    discussion_thread_id bigint,
                    number_of_posts bigint,
                    last_reply_date timestamp,
                    last_reply_id bigint,
                    foreign key (discussion_thread_id) references discussion_thread(id) on delete cascade,
                    unique (discussion_thread_id)
                );
                
                CREATE OR REPLACE FUNCTION update_discussion_thread_stats_record() RETURNS TRIGGER AS $stats_update$
                    declare 
                        current_stats discussion_thread_stats%rowtype;
                    BEGIN
                        IF (TG_OP = 'DELETE') THEN
                            DELETE FROM discussion_thread_stats 
                                where discussion_thread_id = OLD.id;
                            RETURN OLD;
                        ELSIF (TG_OP = 'UPDATE') THEN
                            select * into current_stats
                            from discussion_thread_stats
                            where discussion_thread_id = OLD.id;

                            if not FOUND then                        
                                INSERT INTO discussion_thread_stats (discussion_thread_id, number_of_posts, last_reply_date, last_reply_id)
                                    values(NEW.id, 0, NULL, NULL);
                            end if;
                            
                            RETURN NEW;
                        ELSIF (TG_OP = 'INSERT') THEN
                            INSERT INTO discussion_thread_stats (discussion_thread_id, number_of_posts, last_reply_date, last_reply_id)
                                values(NEW.id, 0, NULL, NULL);  
                            RETURN NEW;
                        END IF;
                        RETURN NULL; -- result is ignored since this is an AFTER trigger
                    END;
                    $stats_update$ LANGUAGE plpgsql;
                
                CREATE OR REPLACE FUNCTION update_discussion_thread_stats_reply() RETURNS TRIGGER AS $stats_reply_update$
                    declare 
                        current_stats discussion_thread_stats%rowtype;
                        current_number_of_posts bigint;
                        current_last_reply_date  timestamp;
                        current_last_reply_id  bigint;
                        latest_reply discussion_thread_stats%rowtype;
                        new_last_reply_id int;
                        new_last_reply_date timestamp;
                        current_discussion_thread_id bigint;
                    BEGIN              
                        current_discussion_thread_id := COALESCE(NEW.discussion_thread_id, OLD.discussion_thread_id);
                    
                        perform 1
                            from discussion_thread
                            where id = current_discussion_thread_id;
                            
                        if found then
                            SELECT * from discussion_thread_stats INTO current_stats 
                                WHERE discussion_thread_id = current_discussion_thread_id;
                                
                            if found then
                                current_number_of_posts := COALESCE(current_stats.number_of_posts, 0);
                                current_last_reply_date := current_stats.last_reply_date;
                                current_last_reply_id := current_stats.last_reply_id;
                            else
                                current_last_reply_date = NULL;
                                current_last_reply_id = NULL;
                                current_number_of_posts = 0;
                                
                                insert into discussion_thread_stats (discussion_thread_id, number_of_posts, last_reply_date, last_reply_id) 
                                    VALUES(current_discussion_thread_id, current_number_of_posts, current_last_reply_date, current_last_reply_id);
                            end if;                        
                             
                            IF (TG_OP = 'DELETE') THEN
                                if current_last_reply_id <> OLD.id then
                                    UPDATE discussion_thread_stats SET
                                        number_of_posts = current_stats.number_of_posts - 1
                                    WHERE discussion_thread_id = current_discussion_thread_id;
                                else
                                    new_last_reply_date := NULL;
                                    new_last_reply_id := NULL;
                            
                                    select id, created
                                    into latest_reply 
                                    from discussion_thread_reply as latest_reply
                                    where discussion_thread_id = current_discussion_thread_id
                                    order by created desc 
                                    limit 1;
                                    
                                    if found then
                                        new_last_reply_date := latest_reply.created;
                                        new_last_reply_id := latest_reply.id;
                                    end if;
                                        
                                    update discussion_thread_stats 
                                        set number_of_posts = number_of_posts - 1,
                                            last_reply_date = new_last_reply_date,
                                            last_reply_id = new_last_reply_id
                                    WHERE discussion_thread_id = current_discussion_thread_id;
                                end if;
                                RETURN OLD;
                            ELSIF (TG_OP = 'INSERT') THEN
                                UPDATE discussion_thread_stats 
                                    set number_of_posts = current_number_of_posts + 1,
                                        last_reply_date = NEW.created,
                                        last_reply_id = NEW.id
                                    where discussion_thread_id = current_discussion_thread_id;   
                                RETURN NEW;
                            END IF;
                        end if;
                        RETURN NULL; -- result is ignored since this is an AFTER trigger
                    END;
                    $stats_reply_update$ LANGUAGE plpgsql;
                
                create trigger discussion_thread_on_insert_update_stats after insert or update or delete 
                    on discussion_thread
                    for each row
                    execute procedure update_discussion_thread_stats_record();
                    
                create trigger discussion_thread_reply_on_insert_update_stats after insert or update or delete 
                    on discussion_thread_reply
                    for each row
                    execute procedure update_discussion_thread_stats_reply();
            """
        )
    ]