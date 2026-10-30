"""Batched writes for the publish-time Mark transfer (run3.py).

sqlconfig.py is server-local (gitignored), so this helper lives here and borrows
its open connection instead of adding a function the deployed copy lacks.
"""
import psycopg2.extras


def execute_batch_update(statements, page_size=500):
    """Run [(sql_with_VALUES_%s, rows), ...] in ONE transaction via execute_values.

    One commit for the whole publish instead of an UPDATE + COMMIT round trip per
    row. Returns True on success; on any error rolls everything back and returns
    False, so a publish never ends with only some of its Marks transferred.
    """
    import sqlconfig
    conn = sqlconfig.conn
    try:
        with conn.cursor() as cur:
            for query, rows in statements:
                psycopg2.extras.execute_values(cur, query, rows, page_size=page_size)
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error executing batch update: {e}")
        return False
