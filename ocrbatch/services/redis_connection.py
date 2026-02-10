import redis
from dotenv import load_dotenv
import os

load_dotenv()
# Define the Redis URL
REDIS_URL = os.getenv("REDIS_URL") # "redis://:admin%40123@192.168.1.3:6379"


# Function to get a Redis client
def get_redis_client():
    try:
        client = redis.from_url(REDIS_URL)
        client.ping()  # Test connection
        print("Connected to Redis successfully!")
        return client
    except redis.ConnectionError as e:
        print(f"Failed to connect to Redis: {e}")
        raise
