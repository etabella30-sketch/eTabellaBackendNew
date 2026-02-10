# file ocrTask.py

import asyncio
from services.redis_connection import get_redis_client
from datetime import datetime, timedelta
import logging
import os
import json
from utils.ocr import ocrmy_pdf


MAX_JOBS = 8
job_semaphore = asyncio.Semaphore(MAX_JOBS)

def get_date():    
    # Get the current time with the desired timezone
    date = datetime.now()    
    # Extract date components
    year = date.year
    month = date.month
    day = date.day
    return f"{year:04d}-{month:02d}-{day:02d}"


lgfile = get_date()
redis_client = get_redis_client()




async def process_task(user_id, id, task):
    """Process a single task with retries."""

    async with job_semaphore:

        job_id = MAX_JOBS - job_semaphore._value
        logging.info(f"Processing task {id} for user {user_id} using job {job_id}")

        try:
            print(f"Processing task {task} for user {user_id}")
            logging.info(f"Processing task {task} for user {user_id}")
            nUDid = task.get('nUDid', None)
            await ocrmy_pdf(user_id,task['identifier'], id, task['path'], task['nOcrtype'], job_id,nUDid)

            redis_client.delete(f"ocr:{user_id}:{id}")  # Discard task after completion
            print(f"Finished task {task} for user {user_id}")
            logging.info(f"Finished task {task} for user {user_id}")
            return
        except Exception as e:
            print(f"Failed to process task {task}: {e}")      



async def process_individual_task(user_id, task_id):

    # log_dir = f'logs/{lgfile}/{user_id}/{task_id}/'
    # os.makedirs(log_dir, exist_ok=True)
    # logging.basicConfig(
    #     filename=f'{log_dir}ocr.log',  # Specify the log file name
    #     level=logging.INFO,  # Set log level
    #     format='%(asctime)s [%(levelname)s]: %(message)s'  # Log message format
    # )


    """Simulate processing an individual task."""
    task_key = f"ocr:{user_id}:{task_id}"
    batch_task = redis_client.get(task_key)

    if not batch_task:
        logging.info(f"Task {task_id} for user {user_id} does not exist or is already processed.")
        print(f"Task {task_id} for user {user_id} does not exist or is already processed.")
        return

    try:
        print(f"Processing task {task_id} for user {user_id} with data: {batch_task}")
        logging.info(f"Processing task {task_id} for user {user_id} with data: {batch_task}")
        # Simulate processing time
        await process_task(user_id, task_id, json.loads(batch_task.decode('utf-8')))
        # await asyncio.sleep(1)
        print(f"Task {task_id} for user {user_id} completed.")
        logging.info(f"Task {task_id} for user {user_id} completed.")

        # Cleanup: Remove task from Redis
        redis_client.delete(task_key)
    except Exception as e:
        print(f"Error processing task {task_id} for user {user_id}: {e}")
        logging.info(f"Error processing task {task_id} for user {user_id}: {e}")


