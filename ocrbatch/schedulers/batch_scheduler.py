import asyncio
import json
import logging
from datetime import datetime
import os
from services.redis_connection import get_redis_client
from services.slot_service import SlotService
from tasks.batchfile import process_batch_task

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
                
                fh = logging.FileHandler(os.path.join(log_dir, 'batch_download.log'))
                fh.setLevel(logging.INFO)
                formatter = logging.Formatter('%(asctime)s [%(levelname)s]: %(message)s')
                fh.setFormatter(formatter)
                logger.addHandler(fh)
            
            self.loggers[user_id] = logger
        return self.loggers[user_id]

class BatchScheduler:
    # Configuration
    MAX_CONCURRENT_MASTERS = 3  # Maximum number of master IDs to process at once
    TASKS_PER_MASTER = 2      # Maximum number of concurrent tasks per master
    MAX_TASK_SLOTS = 6        # Maximum number of task slots
    MAX_MASTER_CONCURRENCY = 3  # Maximum number of tasks per master

    def __init__(self):
        self.redis_client = get_redis_client()
        self.active_masters = set()
        self.master_semaphore = asyncio.Semaphore(self.MAX_CONCURRENT_MASTERS)
        self.master_task_semaphores = {}
        
        # Initialize slot service
        self.slot_service = SlotService(self.MAX_TASK_SLOTS, self.MAX_MASTER_CONCURRENCY)
        
        # Setup logging
        self.lgfile = get_date()
        self.log_dir = f'logs/{self.lgfile}/'
        os.makedirs(self.log_dir, exist_ok=True)
        
        logging.basicConfig(
            filename=f'{self.log_dir}batch_download.log',
            level=logging.INFO,
            format='%(asctime)s [%(levelname)s]: %(message)s'
        )
        
        self.user_logger = UserLogger(self.log_dir)

        
    async def process_case(self, master_id, case_id):
        """Process a single case for a master ID with proper cleanup"""
        logger = self.user_logger.get_logger(master_id)
        task_key = f"batch_download:{master_id}:{case_id}"
        
        try:
            # Get task details from Redis
            task_data = self.redis_client.get(task_key)
            
            if not task_data:
                logger.warning(f"No task data found for {task_key}")
                return
            
            # Parse the JSON data
            task_info = json.loads(task_data.decode('utf-8'))
            
            logger.info(f"Processing case {case_id} for master {master_id}")
            logger.info(f"Task details: Section={task_info['nSectionid']}, "
                    f"Bundles={task_info['cBundleids']}, "
                    f"Filename={task_info['cFilename']}")
            
            # Process the task
            try:
                await process_batch_task(
                    master_id=master_id,
                    case_id=case_id,
                    section_id=task_info['nSectionid'],
                    bundle_ids=task_info['cBundleids'],
                    filename=task_info['cFilename'],
                    column=task_info['column']
                )
                # Remove task from Redis after successful processing
                self.redis_client.delete(task_key)
                logger.info(f"Successfully processed and removed task {case_id} for master {master_id}")
                
            except Exception as task_error:
                logger.error(f"Error processing case {case_id} for master {master_id}: {str(task_error)}")
                # Remove task from Redis after failed processing to prevent continuous retries
                self.redis_client.delete(task_key)
                # Optionally, move to error queue if you want to track failed tasks
                error_key = f"batch_download_errors:{master_id}:{case_id}"
                self.redis_client.setex(
                    error_key,
                    24 * 3600,  # 24 hours expiry
                    json.dumps({
                        "task_info": task_info,
                        "error": str(task_error),
                        "timestamp": datetime.now().isoformat()
                    })
                )
                raise
                
        except Exception as e:
            logger.error(f"Error handling case {case_id} for master {master_id}: {str(e)}")
            # Ensure task is removed even if outer processing fails
            self.redis_client.delete(task_key)
            raise


    async def process_master_tasks(self, master_id):
        """Process all cases for a single master ID"""
        logger = self.user_logger.get_logger(master_id)
        try:
            async with self.master_semaphore:
                logger.info(f"Starting to process tasks for master {master_id}")
                
                # Allocate slots for this master
                allocated, message = self.slot_service.allocate_slots(master_id, self.TASKS_PER_MASTER)
                if not allocated:
                    logger.info(f"Master {master_id}: {message}")
                    return
                
                # Create a semaphore for this master if it doesn't exist
                if master_id not in self.master_task_semaphores:
                    self.master_task_semaphores[master_id] = asyncio.Semaphore(self.TASKS_PER_MASTER)
                
                while True:
                    # Get all cases for this master ID
                    pattern = f"batch_download:{master_id}:*"
                    case_keys = self.redis_client.keys(pattern)
                    
                    if not case_keys:
                        logger.info(f"No more cases for master {master_id}")
                        self.active_masters.discard(master_id)
                        break
                    
                    # Process cases with controlled concurrency
                    tasks = []
                    async with self.master_task_semaphores[master_id]:
                        for key in case_keys[:self.TASKS_PER_MASTER]:
                            case_id = key.decode('utf-8').split(':')[2]
                            tasks.append(self.process_case(master_id, case_id))
                        
                        if tasks:
                            await asyncio.gather(*tasks)
                    
                    logger.info(f"Completed batch of cases for master {master_id}")

        except Exception as e:
            logger.error(f"Error processing master {master_id}: {str(e)}", exc_info=True)
        finally:
            self.slot_service.release_slots(master_id)
            if master_id in self.active_masters:
                self.active_masters.discard(master_id)

    async def schedule_tasks(self):
        """Main scheduling loop"""
        logging.info("Starting batch download scheduler")
        print("Batch download scheduler started")

        while True:
            try:
                # Get all unique master IDs from Redis
                all_keys = self.redis_client.keys("batch_download:*")
                master_ids = set()
                
                for key in all_keys:
                    key_parts = key.decode('utf-8').split(':')
                    if len(key_parts) >= 2:
                        master_ids.add(key_parts[1])
                
                if not master_ids:
                    await asyncio.sleep(3)
                    continue

                # Start processing for new master IDs if under limit
                tasks = []
                for master_id in master_ids:
                    if (master_id not in self.active_masters and 
                        len(self.active_masters) < self.MAX_CONCURRENT_MASTERS):
                        
                        self.active_masters.add(master_id)
                        tasks.append(self.process_master_tasks(master_id))

                if tasks:
                    await asyncio.gather(*tasks)
                
                await asyncio.sleep(1)  # Prevent tight loop

            except Exception as e:
                logging.error(f"Error in batch scheduler: {str(e)}", exc_info=True)
                await asyncio.sleep(5)  # Back off on error

async def main():
    try:
        scheduler = BatchScheduler()
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