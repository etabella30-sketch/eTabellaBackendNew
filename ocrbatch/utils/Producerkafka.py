from confluent_kafka import Producer
import json
from dotenv import load_dotenv
import os

load_dotenv()
KAFKA_HOST = os.getenv("KAFKA_HOST")
# Kafka Producer Configuration
producer_config = {
    'bootstrap.servers':  KAFKA_HOST,  # Replace with your Kafka broker address
}

# Create a Kafka Producer
producer = Producer(producer_config)

def emit_message(topic, key, value):
    """
    Emits a message to the specified Kafka topic.

    :param topic: Kafka topic to which the message is emitted.
    :param key: Message key for partitioning.
    :param value: Message value (dictionary or JSON serializable object).
    """
    try:
        # Serialize the value to JSON
        value_str = json.dumps(value)

        # Produce the message to the Kafka topic
        producer.produce(topic, key=key, value=value_str)
        producer.flush()  # Ensure the message is sent
        print(f"Message sent to topic '{topic}': {value}")
    except Exception as e:
        print(f"Failed to send message to Kafka: {e}")

# Example Usage
if __name__ == "__main__":
    topic_name = 'upload-response'  # Kafka topic name
    message_key = 'job1'           # Partition key
    message_value = {              # Message payload
        'event': 'OCR-JOB',
        'data': {
            'user_id': 'user123',
            'task_id': 'task456',
            'status': 'completed',
            'output': '/path/to/output/file.pdf'
        }
    }

    # Emit the message
    emit_message(topic_name, message_key, message_value)
