#!/usr/bin/env python3
"""
Batch Migration Script
Allows migrating multiple cases at once
"""

import json
import time
from datetime import datetime
from elasticsearch_migration_enhanced import ElasticsearchMigration
import logging

# Configure logging for batch operations
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('batch_migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class BatchMigration:
    def __init__(self):
        self.migration = ElasticsearchMigration()
        self.batch_log = 'batch_migration_status.json'
        self.batch_status = self._load_batch_status()
    
    def _load_batch_status(self):
        """Load batch migration status"""
        try:
            with open(self.batch_log, 'r') as f:
                return json.load(f)
        except:
            return {}
    
    def _save_batch_status(self):
        """Save batch migration status"""
        with open(self.batch_log, 'w') as f:
            json.dump(self.batch_status, f, indent=2, default=str)
    
    def migrate_from_file(self, filename: str):
        """Migrate cases listed in a file (one case ID per line)"""
        try:
            with open(filename, 'r') as f:
                case_ids = [line.strip() for line in f if line.strip()]
            
            if not case_ids:
                print("No case IDs found in file.")
                return
            
            batch_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            print(f"\nStarting batch migration: {batch_id}")
            print(f"Total cases to migrate: {len(case_ids)}")
            
            self.batch_status[batch_id] = {
                'start_time': datetime.now().isoformat(),
                'total_cases': len(case_ids),
                'completed': 0,
                'failed': 0,
                'cases': {}
            }
            
            for i, case_id in enumerate(case_ids, 1):
                print(f"\n{'='*60}")
                print(f"Processing case {i}/{len(case_ids)}: {case_id}")
                print(f"{'='*60}")
                
                try:
                    start_time = time.time()
                    self.migration.migrate_case(case_id)
                    elapsed = time.time() - start_time
                    
                    self.batch_status[batch_id]['cases'][case_id] = {
                        'status': 'completed',
                        'duration': elapsed,
                        'timestamp': datetime.now().isoformat()
                    }
                    self.batch_status[batch_id]['completed'] += 1
                    
                except Exception as e:
                    logger.error(f"Failed to migrate case {case_id}: {e}")
                    self.batch_status[batch_id]['cases'][case_id] = {
                        'status': 'failed',
                        'error': str(e),
                        'timestamp': datetime.now().isoformat()
                    }
                    self.batch_status[batch_id]['failed'] += 1
                
                # Save progress after each case
                self._save_batch_status()
                
                # Add a small delay between migrations
                if i < len(case_ids):
                    time.sleep(2)
            
            self.batch_status[batch_id]['end_time'] = datetime.now().isoformat()
            self._save_batch_status()
            
            # Print summary
            print(f"\n{'='*60}")
            print(f"Batch Migration Complete: {batch_id}")
            print(f"{'='*60}")
            print(f"Total cases: {len(case_ids)}")
            print(f"Completed: {self.batch_status[batch_id]['completed']}")
            print(f"Failed: {self.batch_status[batch_id]['failed']}")
            
        except Exception as e:
            logger.error(f"Batch migration failed: {e}")
            print(f"Error: {e}")
    
    def migrate_all_unmigrated(self, limit: int = None):
        """Migrate all unmigrated cases"""
        from migration_utility import MigrationUtility
        
        utility = MigrationUtility()
        
        # Get unmigrated cases
        print("Finding unmigrated cases...")
        
        # This is a simplified version - you might need to adjust based on your needs
        indices = utility.es.indices.get_alias(index="case_documents_*")
        unmigrated_case_ids = []
        
        # Get mapping from database
        query = """
        SELECT DISTINCT s."ZnCaseid" as old_cid, s."nCaseid" as new_cid
        FROM "SectionMaster" s
        WHERE s."ZnCaseid" IS NOT NULL
        """
        
        import psycopg2
        conn = None
        try:
            conn = psycopg2.connect(**utility.pg_config)
            cursor = conn.cursor()
            cursor.execute(query)
            
            for row in cursor.fetchall():
                old_cid, new_cid = row
                old_index = f"case_documents_{old_cid}"
                new_index = f"case_documents_{new_cid}"
                
                # Check if old index exists and new index doesn't
                if (old_index in indices and 
                    new_index not in indices and 
                    new_cid not in self.migration.completed_cases):
                    unmigrated_case_ids.append(new_cid)
                    
                    if limit and len(unmigrated_case_ids) >= limit:
                        break
            
            if not unmigrated_case_ids:
                print("No unmigrated cases found.")
                return
            
            print(f"Found {len(unmigrated_case_ids)} unmigrated cases.")
            if limit:
                print(f"Processing first {limit} cases.")
            
            # Create temporary file with case IDs
            temp_file = f"unmigrated_cases_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            with open(temp_file, 'w') as f:
                for case_id in unmigrated_case_ids:
                    f.write(f"{case_id}\n")
            
            print(f"Case IDs saved to: {temp_file}")
            
            # Start batch migration
            self.migrate_from_file(temp_file)
            
        except Exception as e:
            logger.error(f"Error finding unmigrated cases: {e}")
            print(f"Error: {e}")
        finally:
            if conn:
                conn.close()
    
    def show_batch_history(self):
        """Show history of batch migrations"""
        if not self.batch_status:
            print("No batch migrations found.")
            return
        
        print("\nBatch Migration History:")
        print("="*80)
        
        for batch_id, details in sorted(self.batch_status.items(), reverse=True):
            print(f"\n{batch_id}:")
            print(f"  Start time: {details.get('start_time', 'Unknown')}")
            print(f"  End time: {details.get('end_time', 'In progress')}")
            print(f"  Total cases: {details.get('total_cases', 0)}")
            print(f"  Completed: {details.get('completed', 0)}")
            print(f"  Failed: {details.get('failed', 0)}")
            
            # Show failed cases
            failed_cases = [case_id for case_id, case_details in details.get('cases', {}).items()
                          if case_details.get('status') == 'failed']
            if failed_cases:
                print(f"  Failed cases: {', '.join(failed_cases[:5])}")
                if len(failed_cases) > 5:
                    print(f"                ... and {len(failed_cases) - 5} more")


def main():
    batch = BatchMigration()
    
    while True:
        print("\n" + "="*60)
        print("Batch Migration Tool")
        print("="*60)
        print("1. Migrate cases from file")
        print("2. Migrate all unmigrated cases")
        print("3. Show batch history")
        print("4. Exit")
        print("-"*60)
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == '1':
            filename = input("Enter filename containing case IDs (one per line): ").strip()
            if os.path.exists(filename):
                batch.migrate_from_file(filename)
            else:
                print(f"File not found: {filename}")
        
        elif choice == '2':
            limit_str = input("Enter maximum number of cases to migrate (leave empty for all): ").strip()
            limit = int(limit_str) if limit_str else None
            
            confirm = input(f"Start migrating {'all' if not limit else limit} unmigrated cases? (yes/no): ")
            if confirm.lower() == 'yes':
                batch.migrate_all_unmigrated(limit)
        
        elif choice == '3':
            batch.show_batch_history()
        
        elif choice == '4':
            print("Exiting...")
            break
        
        else:
            print("Invalid choice.")


if __name__ == "__main__":
    import os
    main()
