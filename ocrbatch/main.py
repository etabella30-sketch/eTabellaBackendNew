# file main.py

import asyncio
import logging
from datetime import datetime
import os

# Import schedulers
from schedulers.batch_scheduler import BatchScheduler
from schedulers.ocr_scheduler import OCRScheduler

def get_date():    
    date = datetime.now()    
    return f"{date.year:04d}-{date.month:02d}-{date.day:02d}"

class CombinedScheduler:
    def __init__(self):
        # Setup logging
        self.lgfile = get_date()
        self.log_dir = f'logs/{self.lgfile}/'
        os.makedirs(self.log_dir, exist_ok=True)
        
        logging.basicConfig(
            filename=f'{self.log_dir}combined_scheduler.log',
            level=logging.INFO,
            format='%(asctime)s [%(levelname)s]: %(message)s'
        )
        
        # Initialize both schedulers
        self.batch_scheduler = BatchScheduler()
        self.ocr_scheduler = OCRScheduler()
        
        logging.info("Combined scheduler initialized")

    async def run_schedulers(self):
        try:
            logging.info("Starting combined schedulers")
            print("Starting combined schedulers...")
            
            # Create tasks for both schedulers
            batch_task = asyncio.create_task(
                self.batch_scheduler.schedule_tasks(),
                name="batch_download_scheduler"
            )
            
            ocr_task = asyncio.create_task(
                self.ocr_scheduler.schedule_tasks(),
                name="ocr_scheduler"
            )
            
            # Wait for both schedulers
            await asyncio.gather(batch_task,ocr_task)
            
        except Exception as e:
            logging.error(f"Error in combined scheduler: {str(e)}", exc_info=True)
            raise

async def main():
    try:
        scheduler = CombinedScheduler()
        await scheduler.run_schedulers()
    except Exception as e:
        logging.critical(f"Critical error in main: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutdown initiated...")
        logging.info("Shutdown initiated via KeyboardInterrupt")
    except Exception as e:
        logging.critical(f"Unhandled exception: {str(e)}", exc_info=True)
        raise