import multiprocessing
import os

def download_worker(download_queue, process_queue):
    while True:
        file_info = download_queue.get()
        if file_info is None:
            break
        # Perform download
        download_pdf_to_disk(*file_info)
        # Add to processing queue
        process_queue.put(file_info['local_path'])

def process_worker(process_queue, upload_queue):
    while True:
        file_path = process_queue.get()
        if file_path is None:
            break
        # Perform processing
        insert_footer_parallel(file_path, ...)
        # Add to upload queue
        upload_queue.put(file_path)

def upload_worker(upload_queue):
    while True:
        file_path = upload_queue.get()
        if file_path is None:
            break
        # Perform upload
        upload_pdf_from_disk_to_s3(...)
        # Delete local file
        os.remove(file_path)

if __name__ == '__main__':
    download_queue = multiprocessing.Queue()
    process_queue = multiprocessing.Queue()
    upload_queue = multiprocessing.Queue()

    # Start worker processes
    downloaders = [multiprocessing.Process(target=download_worker, args=(download_queue, process_queue)) for _ in range(num_downloaders)]
    processors = [multiprocessing.Process(target=process_worker, args=(process_queue, upload_queue)) for _ in range(num_processors)]
    uploaders = [multiprocessing.Process(target=upload_worker, args=(upload_queue,)) for _ in range(num_uploaders)]

    for p in downloaders + processors + uploaders:
        p.start()

    # Add download tasks to the download_queue
    for file_info in files_to_download:
        download_queue.put(file_info)

    # Signal workers to exit
    for _ in downloaders:
        download_queue.put(None)
    for _ in processors:
        process_queue.put(None)
    for _ in uploaders:
        upload_queue.put(None)

    # Wait for all workers to finish
    for p in downloaders + processors + uploaders:
        p.join()
