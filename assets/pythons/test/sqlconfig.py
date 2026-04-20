import psycopg2
import psycopg2.extras
from file import append_log
# Database connection parameters
dbname = 'etabellaV2'
user = 'postgres'
password = 'Et@bell@UAT8146@worK!7868@MIPL@2024'
host = 'localhost'
port = '5432'

def get_connection():
    return psycopg2.connect(dbname=dbname, user=user, password=password, host=host, port=port)

def execute_query(funname, params):
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        # Begin a transaction block
        cur.execute("BEGIN;")
        
        # Call the function
        query = f"SELECT * FROM {funname}(%s::json, 'ref');"
        query2 = f"SELECT * FROM {funname}({params}::json, 'ref'); fetch all in ref;"
        append_log(f"Executing query: {query2}")
        cur.execute(query, (params,))
        
        # Fetch the result from the ref cursor
        cur.execute("FETCH ALL IN ref;")
        
        # Fetch and print the results
        result = cur.fetchall()
        
        # Commit the transaction
        cur.execute("COMMIT;")
        cur.close()
        conn.close()
        return result
    except Exception as e:
        # Rollback in case of error
        cur.execute("ROLLBACK;")
        cur.close()
        conn.close()
        print(f"Error: {e}")
        return []

def execute_static_query():
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        # Execute the static query
        cur.execute("""
            SELECT * FROM et_realtime_get_annotation_by_session('{"nSessionid":55}','a'); 
            FETCH ALL IN "a";
        """)
        
        # Fetch and print the results
        result = cur.fetchall()
        
        cur.close()
        conn.close()
        return result
    except Exception as e:
        cur.close()
        conn.close()
        print(f"Error: {e}")
        return []
