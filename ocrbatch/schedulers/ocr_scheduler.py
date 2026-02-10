# file ocr_scheduler.py

import asyncio
import logging
from datetime import datetime
import os
from services.slot_service import SlotService
from services.redis_connection import get_redis_client
from tasks.ocrTask import process_individual_task

def get_date():    
    date = datetime.now()    
    return f"{date.year:04d}-{date.month:02d}-{date.day:02d}"

class UserLogger:
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.loggers = {}

    def get_logger(self, user_id):
        if user_id not in self.loggers:
            logger = logging.getLogger(f"user_{user_id}")
            logger.setLevel(logging.INFO)
            
            if not logger.handlers:
                log_dir = os.path.join(self.base_dir, str(user_id))
                os.makedirs(log_dir, exist_ok=True)
                
                fh = logging.FileHandler(os.path.join(log_dir, 'ocr.log'))
                fh.setLevel(logging.INFO)
                formatter = logging.Formatter('%(asctime)s [%(levelname)s]: %(message)s')
                fh.setFormatter(formatter)
                logger.addHandler(fh)
            
            self.loggers[user_id] = logger
        
        return self.loggers[user_id]

class OCRScheduler:
    # Configuration
    MAX_CONCURRENT_USERS = 3  # Maximum number of users to process at once
    TASKS_PER_USER = 2       # Maximum number of concurrent tasks per user
    MAX_TASK_SLOTS = 6       # Maximum number of task slots
    MAX_USER_CONCURRENCY = 3 # Maximum number of tasks per user

    def __init__(self):
        self.redis_client = get_redis_client()
        self.active_users = set()
        self.user_semaphore = asyncio.Semaphore(self.MAX_CONCURRENT_USERS)
        self.user_task_semaphores = {}
        
        # Initialize slot service
        self.slot_service = SlotService(self.MAX_TASK_SLOTS, self.MAX_USER_CONCURRENCY)
        
        # Setup logging
        self.lgfile = get_date()
        self.log_dir = f'logs/{self.lgfile}/'
        os.makedirs(self.log_dir, exist_ok=True)
        
        # Setup main logger
        logging.basicConfig(
            filename=f'{self.log_dir}ocr.log',
            level=logging.INFO,
            format='%(asctime)s [%(levelname)s]: %(message)s'
        )
        
        # Initialize user logger
        self.user_logger = UserLogger(self.log_dir)

    async def process_user_tasks(self, user_id):
        """Process tasks for a single user"""
        logger = self.user_logger.get_logger(user_id)
        try:
            async with self.user_semaphore:  # Limit total concurrent users
                logging.info(f"Starting to process tasks for user {user_id}")
                
                # Allocate slots for this user
                allocated, message = self.slot_service.allocate_slots(user_id, self.TASKS_PER_USER)
                if not allocated:
                    print(f'allocated {allocated}')
                    logging.info(f"User {user_id}: {message}")
                    return
                print(f'Task perform',user_id)
                # Create a semaphore for this user if it doesn't exist
                if user_id not in self.user_task_semaphores:
                    self.user_task_semaphores[user_id] = asyncio.Semaphore(self.TASKS_PER_USER)
                
                async def worker():
                    """Continuously pick tasks for this user until empty"""
                    while True:
                        task_id = self.redis_client.lpop(f"ocr:{user_id}")
                        if not task_id:
                            break
                        task_id =  task_id.decode('utf-8') if isinstance(task_id, bytes) else task_id 
                        async with self.user_task_semaphores[user_id]:
                            # Start processing
                            print(f'Task process',user_id)
                            await process_individual_task(user_id, task_id)

                # Start as many workers as allowed
                workers = [asyncio.create_task(worker()) for _ in range(self.TASKS_PER_USER)]
                await asyncio.gather(*workers)

                logging.info(f"All tasks for user {user_id} are processed")
                
                # while True:
                #     # Get up to TASKS_PER_USER tasks
                #     tasks = []
                #     for _ in range(self.TASKS_PER_USER):
                #         task_id = self.redis_client.lpop(f"ocr:{user_id}")
                #         if task_id:
                #             tasks.append(task_id.decode('utf-8'))
                    
                #     if not tasks:
                #         logging.info(f"No more tasks for user {user_id}")
                #         self.active_users.discard(user_id)
                #         break

                #     logging.info(f"Processing tasks for user {user_id}: {tasks}")
                    
                #     # Process tasks with controlled concurrency
                #     async with self.user_task_semaphores[user_id]:
                #         await asyncio.gather(*[
                #             process_individual_task(user_id, task_id)
                #             for task_id in tasks
                #         ])
                    
                #     logging.info(f"Completed batch of tasks for user {user_id}")

        except Exception as e:
            print(f"Error processing tasks for user {user_id}: {e}")
            logging.error(f"Error processing tasks for user {user_id}: {str(e)}", exc_info=True)
        finally:
            # Cleanup
            self.slot_service.release_slots(user_id)
            if user_id in self.active_users:
                self.active_users.discard(user_id)
            if self.redis_client.llen(f"ocr:{user_id}") == 0:
                self.redis_client.lrem("ocr", 0, user_id)
                self.redis_client.delete(f"ocr:{user_id}")

    async def schedule_tasks(self):
        """Main scheduling loop"""
        logging.info("Starting OCR scheduler")
        print("OCR scheduler started dev")

        while True:
            try:
                # Get all users from Redis
                users = self.redis_client.lrange("ocr", 0, -1)
                print(f'users ',users)
                # users = {user.decode('utf-8') for user in users}
                users = {u.decode('utf-8') if isinstance(u, bytes) else u for u in users}
                print(f'users After ',users)
                if not users:
                    await asyncio.sleep(3)
                    continue

                # Start processing for new users if under limit
                tasks = []
                for user_id in users:
                    if (user_id not in self.active_users and 
                        len(self.active_users) < self.MAX_CONCURRENT_USERS and
                        self.redis_client.llen(f"ocr:{user_id}") > 0):
                        print(f'Active user ',user_id)
                        self.active_users.add(user_id)     
                                                       
                        asyncio.create_task(self.process_user_tasks(user_id))
                        # tasks.append(self.process_user_tasks(user_id))

                if tasks:
                    await asyncio.gather(*tasks)
                
                await asyncio.sleep(1)  # Prevent tight loop

            except Exception as e:
                print(f"Error in OCR scheduler: {e}")
                logging.error(f"Error in OCR scheduler: {str(e)}", exc_info=True)
                await asyncio.sleep(5)  # Back off on error

async def main():
    try:
        scheduler = OCRScheduler()
        await scheduler.schedule_tasks()
    except Exception as e:
        logging.critical(f"Critical error in main: {str(e)}", exc_info=True)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutdown initiated...")
        logging.info("Shutdown initiated via KeyboardInterrupt")
    except Exception as e:
        logging.critical(f"Unhandled exception: {str(e)}", exc_info=True)