from psycopg2 import pool, OperationalError, InterfaceError
from dotenv import load_dotenv
import os
import uuid
import asyncio
from psycopg2.extras import RealDictCursor

load_dotenv()

# Initialize the connection pool
connection_pool = None

def init_connection_pool():
    """
    Initialize the connection pool.
    """
    try:
        global connection_pool
        connection_pool = pool.SimpleConnectionPool(
            1, int(os.getenv("DB_MAX", 10)),  # Min and max connections
            dbname=os.getenv("DB_DATABASE"),
            user=os.getenv("DB_USERNAME"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )
        print("Connection pool created successfully.")
    except Exception as e:
        print(f"Error initializing connection pool: {e}")
        raise

def get_connection():
    """
    Get a connection from the pool.
    """
    try:
        return connection_pool.getconn()
    except Exception as e:
        print(f"Error getting connection from pool: {e}")
        return None

def return_connection(conn):
    """
    Return the connection to the pool.
    """
    if conn:
        connection_pool.putconn(conn)

async def execute_query(query):
    """
    Execute a query and return results.
    """
    conn = None
    try:
        conn = get_connection()
        if not conn:
            raise Exception("Failed to get connection from pool.")
        
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # print(query)
            cursor.execute(query)       
            # Get the number of affected rows
            # affected_rows = cursor.rowcount 

         # Get the column names
            columns = [desc[0] for desc in cursor.description]
            
            # Fetch all results
            results = cursor.fetchall()
            
            # Create a list to store formatted results
            formatted_results = []
            
            # Process each row
            for row in results:
                row_data = {}
                for column in columns:
                    # Handle None values
                    row_data[column] = row[column] if row[column] is not None else ''
                formatted_results.append(row_data)
            
            conn.commit()
            return formatted_results
        # return cursor.fetchall()
    except (OperationalError, InterfaceError) as e:
        print(f"Connection error: {e}")
        return None
    except Exception as e:
        print(f"Error executing query: {e}")
        return None
    finally:
        if conn:
            return_connection(conn)

def query_builder(fun, params):
    """
    Build a query with a unique cursor name.
    """
    cursor_name = f"cursor_{uuid.uuid4().hex[:8]}"  # Generate a unique cursor name
    if params:
        return f"SELECT * FROM et_{fun}('{params}', '{cursor_name}'); FETCH ALL IN \"{cursor_name}\";"
    else:
        return f"SELECT * FROM et_{fun}('', '{cursor_name}'); FETCH ALL IN \"{cursor_name}\";"

# Initialize the connection pool
try:
    init_connection_pool()

    # Run a sample query
    async def main():
        query = "SELECT NOW();"
        result = await execute_query(query)
        print(f"Current Time: {result}")

    asyncio.run(main())
finally:
    # Close the connection pool
    # if connection_pool:
    #     connection_pool.closeall()
    print("Connection pool.")
