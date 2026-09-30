import re
from utils.Producerkafka import emit_message
phrases = [
            'Scanning contents',
            'Linearizing',
            'PDF/A conversion',
            'Deflating JPEGs',
            'OCR',
            'Recompressing JPEGs'
        ]

def handle_data(resulttype, data, identifier,id, nMasterid,nUDid, cFilename):
    """
    Handle OCR progress data and emit updates.

    :param resulttype: The current result type.
    :param data: Data string from OCR process.
    :param identifier: Identifier for the task.
    :param nMasterid: Master ID for the task.
    :param cFilename: Name of the file being processed.
    :return: Updated result type.
    """
    try:
        data_string = data.strip()
        # Check if the data string contains any of the defined phrases
        if any(phrase in data_string for phrase in phrases):
            resulttype = next((phrase for phrase in phrases if phrase in data_string), resulttype)

        # Check for progress percentage
        if resulttype and re.search(r"\d+%", data_string):
            text = re.sub(r" {2,}", " ", data_string)  # Replace multiple spaces with a single space
            text = re.sub(r"[---━]+", " ", text)       # Replace special characters with a space

            if resulttype not in text:
                text = f"{resulttype} {text}"

            text = text.split("\r")[0]  # Split by carriage return and take the first part
            split_strings = text.split('\t')
            last_string = split_strings[-1] if split_strings else text
            msgData = {'event': 'OCR-PROGRESS', 'data': {'identifier': identifier,'id':id, 'nMasterid': nMasterid,'nUDid':nUDid, 'message': last_string}}
            # print(f"Data: {msgData}")
            
            emit_message('upload-response', 'key1', msgData)    
            # Emit the OCR progress update                

        return resulttype
    except Exception as error:
        print(f"Error handling data: {error}")
        return resulttype
