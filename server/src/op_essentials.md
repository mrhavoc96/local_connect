command for backing-up/dump postgres db: 
1. pg_dump -U postgres -d your_db_name -F p -f localmart_dump.sql          // Full dump schema + data + functions 
2. pg_dump -U postgres -d your_db_name -F p --schema-only -f localmart_dump.sql  //schema + functions (no data)
3. pg_dump -U postgres -d your_db_name -F p --data-only -f localmart_dump.sql  //data only

command for restoring the postgres db back-up/dump:
1. psql -U postgres -d their_db_name -f path\to\local_connect.sql    //always create a new db before restoring