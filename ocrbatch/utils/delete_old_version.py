
import logging
import boto3

import os
from services.pgConnection import execute_query, query_builder
import json  # Import regex module

bucket_name = f"{os.getenv("DO_SPACES_BUCKET_NAME")}"
access_key = f"{os.getenv("DO_SPACES_KEY")}"  # Your access key
secret_key = f"{os.getenv("DO_SPACES_SECRET")}"   # Your secret key
endpoint_url = f"{os.getenv("DO_SPACES_ENDPOINT")}"
s3_client = boto3.client('s3', endpoint_url=endpoint_url)


def remove_old_versions(s3_path: str):
    """Remove all versions of an object except the latest one."""
    try:
        # print(f'Fetching versions : {s3_path}')
        logging.info(f'Fetching versions: {s3_path}')
        if not s3_path:
            logging.error(f'{s3_path} not found for update version')
            return

        versions = get_first_version(s3_path)
        if not versions:
            logging.error(f'{s3_path} version not found')
            return
        lversion = ''
        # Delete all versions except the latest one
        for i, version_id in enumerate(versions):
            # print(f'index {i} version: {lversion}')    
            if i == 0:  # Skip the latest version
                lversion = version_id
            else:
                delete_specific_version(version_id, s3_path)
            
        try:
            logging.info(f'Latest version: {lversion}')
            # print(f'Latest version: {lversion}')
            if lversion:
                return lversion
                # Remove the old versions from the database
                # remove_old_versions_from_db(lversion)
        except Exception as error:
            logging.error(f'Error removing old versions from DB: {str(error)}')
            raise

    except Exception as error:
        print(f'Error removing old versions : {str(error)}')
        logging.error(f'Error removing old versions: {str(error)}')
        raise

def remove_old_versions_from_db(version_id: str) -> None:
    """Remove old versions from the database."""
    try:
        logging.info(f'Removing old versions from DB: {version_id}')
        
        query = query_builder('upload_update_fver', json.dumps({"nBundledetailid": id, "cFVer": version_id,"cLVer":version_id}))
        logging.info(f'Query : {query}')
        result = execute_query(query)
        logging.info('Old versions removed from DB successfully!')
    except Exception as error:
        logging.error(f'Error removing old versions from DB: {str(error)}')
        raise

def delete_specific_version(version_id: str, s3_path: str) -> dict:
    """Delete a specific version of an S3 object."""
    try:
        response = s3_client.delete_object(
            Bucket=bucket_name,
            Key=s3_path,
            VersionId=version_id
        )
        logging.info(f'Version {version_id} deleted successfully!')
        return response
        
    except Exception as error:
        logging.error(f'Error deleting version: {str(error)}')
        raise

def get_first_version(file_key: str):
    """Get all version IDs except the latest one for an S3 object."""
    try:
        logging.info(f'Fetching versions for: {file_key}')
        
        response = s3_client.list_object_versions(
            Bucket=bucket_name,
            Prefix=file_key
        )

        if 'Versions' in response and response['Versions']:
            # Get all versions except the latest one
            versions = [
                version['VersionId'] 
                for version in response['Versions'] 
                # if not version.get('IsLatest')
            ]
            
            logging.info(f'File Version IDs: {versions}')
            return versions
        else:
            logging.info(f'No versions found for file: {file_key}')
            return None

    except Exception as error:
        logging.error(f'Error fetching file versions: {str(error)}')
        return None