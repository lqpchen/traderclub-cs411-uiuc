# README

# ER Diagram

Link: https://app.diagrams.net/#G1iyzdVJWt-cwirLRt44D8CQ61YYlwkTfM

## Logging into the project VM:
1.Make sure you've installed the VPN and are on it: https://answers.uillinois.edu/98773
2. From your terminal, ssh <netid>@sp21-cs411-22.cs.illinois.edu
3. You should see your home directory set up.

```
ssh rohitm5@sp21-cs411-22.cs.illinois.edu   

rohitm5@sp21-cs411-22.cs.illinois.edu's password: 
Last login: Sat Mar  6 04:21:25 2021 from vpnpool-10-251-17-125.near.illinois.edu
-bash: warning: setlocale: LC_CTYPE: cannot change locale (UTF-8): No such file or directory
[rohitm5@sp21-cs411-22 ~]$ pwd
/home/rohitm5
```
## Setting up the project:

### Setting up Django

1. Run `python3 -m pip --version` to find out your pip version and make sure it's up to date.
2. Inside the project directory, run `pip3 install -r requirements.txt
3. Install the Python/PostgreSQL driver using: `pip3 install psycopg2`
4. Run the server using `python3 manage.py runserver`
5. You will get a warning about schema migrations not having been applied, this is OK to start with. I haven't applied these yet as we haven't finalised our schema yet.
6. You should see be able to look at a test api root on http://localhost:8000

### Setting up PostgreSQL

1. `brew install postgresql`
2. Type `psql`
3. Create the database: ```CRAETE DATABASE tradersclub;```
4. Create the user for the DB: ```CREATE USER tradersclub_user WITH password 'eelawooZ9e'```
5. Make the app user a super user: ```ALTER ROLE tradersclub_user CREATEROLE Superuser;```

Our database on the VM has the same credentials.

### Useful PostgreSQL Commands:
You can use the following commands in the psql prompt.

| Command  | Use |
| ------------- | ------------- |
| `\du+`  | List all users and their privileges  |
| `\dt+`  | See all tables  |

### Advanced Features
| Command  | Use |
| ------------- | ------------- |
| Prepared Statements  | Can't do this in Django: https://www.reddit.com/r/django/comments/ffhr15/does_django_use_prepared_statements_to_execute/  |
| Constraints  | Foreign Key, Unique constraints defined in DDL.sql  |
| Indexing  | Indexes defined in DDL.sql  |
| Partitioning/Sharding  | Not implemented yet|
| Parallel Query Execution  | Not implemented yet|
| Views  | Not implemented yet|
| Stored Procedures  | Not implemented yet|
| Triggers  | Not implemented yet|
| Transactions  | Not implemented yet|
| Compound Statements  | Not implemented yet|

### References:
1. JWT Best Practices: https://hasura.io/blog/best-practices-of-using-jwt-with-graphql/#logout_token_invalidation