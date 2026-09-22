
import psycopg2

# Download the CSV file from HTTP


# Connect to PostgreSQL and load the file
conn = psycopg2.connect("dbname=etabella.tech user=postgres password=postgres")
cursor = conn.cursor()

cursor.copy_expert("COPY pdf_data FROM './assets/hyperlink-files/search_results95106.csv' DELIMITER ',' CSV HEADER;", open('./assets/hyperlink-files/search_results95106.csv'))
conn.commit()
cursor.close()
conn.close()
