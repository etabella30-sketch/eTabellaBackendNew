import asyncio
import logging
import os
import json
from datetime import datetime
from services.pgConnection import execute_query, query_builder
from utils.generateBatchfile  import create_excel_file,generate_data
from utils.Producerkafka import emit_message

async def process_batch_task(master_id, case_id, section_id, bundle_ids, filename, column):
    """
    Process batch task to generate Excel file with specific formatting.
    """
    logger = logging.getLogger(f"user_{master_id}")
    
    try:
        # Create output directory
        output_dir = f"doc/case{case_id}"
        os.makedirs(output_dir, exist_ok=True)
        output_path = f"{output_dir}/{filename}"

        logger.info(f"Starting batch task - Master: {master_id}, Case: {case_id}")

        # Get data from database

        # this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', master_id: body.master_id, type: 'Q', message: 'Added in queue. Please wait...' } });
        msgData = {'event': 'BATCH-PROGRESS', 'data': {'identifier': '', 'nMasterid': master_id, 'type': 'Q', 'message': 'Fatching data. Please wait...'}}
        emit_message('batchfile-response', 'key1', msgData)
        query = query_builder('batchfile_getdata', json.dumps({"nMasterid": master_id,"nCaseid":case_id,"nSectionid": section_id, "cBundleids": bundle_ids,"column":column,"cFilename":filename}))
        logging.info(f'Query : {query}')
        print(f'Query : {query}')
        result = await execute_query(query)        
        data = result

        # Generate Excel data
        msgData = {'event': 'BATCH-PROGRESS', 'data': {'identifier': '', 'nMasterid': master_id, 'type': 'A', 'message': 'Analysing data. Please wait...'}}
        emit_message('batchfile-response', 'key1', msgData)
        bundle_data = await generate_data(data, column)
        # Create Excel file
        msgData = {'event': 'BATCH-PROGRESS', 'data': {'identifier': '', 'nMasterid': master_id, 'type': 'A', 'message': 'Creating batch file. Please wait...'}}
        emit_message('batchfile-response', 'key1', msgData)
        await create_excel_file(bundle_data[0], output_path, bundle_data[1])
        # this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', master_id: job.data.master_id, data: { path: path, name: job.data.filename }, type: 'C', message: 'Batch file created. Prepare for download' } });
        
        msgData = {'event': 'BATCH-PROGRESS', 'data': {'identifier': '', 'nMasterid': master_id,'data': { 'path': output_path, 'name': filename }, 'type': 'C', 'message': 'Batch file created. Prepare for download'}}
        emit_message('batchfile-response', 'key1', msgData)
        logger.info(f"Successfully generated Excel file: {output_path}")
        return output_path

    except Exception as e:        
        msgData = {'event': 'BATCH-PROGRESS', 'data': {'identifier': '', 'nMasterid': master_id, 'type': 'F', 'message': 'Failed to fatch data. Please try again.'}}
        logger.error(f"Error in batch task - Master: {master_id}, Case: {case_id}: {str(e)}", 
                    exc_info=True)
        raise


# Example usage:
"""
await process_batch_task(
    master_id="12345",
    case_id="67890",
    section_id="1",
    bundle_ids=["bundle1", "bundle2"],
    filename="report.xlsx",
    column='["Header1", "col1"], ["Header2", "col2"]'
)
"""