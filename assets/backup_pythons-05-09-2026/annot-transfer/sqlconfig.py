import psycopg2
import psycopg2.extras
from file import append_log
# Database connection parameters
# dbname = 'etabella.legal.live'
# user = 'postgres'
# password = 'postgres'
# host = '192.168.1.23'
# port = '5432'
import sys



# DB_HOST=public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com
# DB_PORT=16751
# DB_USERNAME=vultradmin
# DB_PASSWORD=AVNS_VqdeFp4-sE6s4BCPhoU
# DB_DATABASE=etabella.com


# dbname = 'etabella.com'
# user = 'vultradmin'
# password = 'AVNS_VqdeFp4-sE6s4BCPhoU'
# host ='public-vultr-prod-244eaba4-aab7-4423-baec-cee3af09d5b7-vultr-pr.vultrdb.com'
# port = '16751'
dbname = sys.argv[4]  # DB name from arguments
user = sys.argv[5]    # DB user from arguments
password = sys.argv[6]  # DB password from arguments
host = sys.argv[7]    # DB host from arguments
port = sys.argv[8]    # DB port from arguments

conn = psycopg2.connect(dbname=dbname, user=user, password=password, host=host, port=port)
cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

print('\n','sql config called')

def execute_query(funname, params):
    
    try:
       
        # Begin a transaction block
        cur.execute("BEGIN;")
        
        # Call the function
        query = f"SELECT * FROM {funname}(%s::json, 'ref');"
        query2 = f"SELECT * FROM {funname}({params}::json, 'ref'); fetch all in ref;"
        append_log(f"Executing query: {query2}")
        # print(query2)
        cur.execute(query, (params,))
        
        # Fetch the result from the ref cursor
        cur.execute("FETCH ALL IN ref;")
        
        # Fetch and print the results
        result = cur.fetchall()
        
        # Commit the transaction
        cur.execute("COMMIT;")
        #cur.close()
        #conn.close()
        return result
    except Exception as e:
        # Rollback in case of error
        cur.execute("ROLLBACK;")
        #cur.close()
        #conn.close()
        print(f"Error: {e}")
        return []

def execute_single_query(query,data):
   
    try:
        cur.execute(query,data)
        conn.commit()
    except Exception as e:
        print(f"Error executing query: {query} : data {data}")
        print(f"Error: {e}")