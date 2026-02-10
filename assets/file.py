# from flask import Flask, send_from_directory, request, abort
# from flask_cors import CORS
# import os

# app = Flask(__name__)
# CORS(app)  # Enable CORS

# # BASE_DIR = 'D:/apiportal/etabella-nestjs/assets/'
# BASE_DIR = ''

# @app.route('/doc/<case>/<filename>')
# def serve_file(case, filename):
#     if 'ID' in request.args:
#         id_value = request.args.get('ID')
#         print(f"ID: {id_value}")

#     file_path = os.path.join(BASE_DIR, 'doc', case, filename)
#     print(f"Serving file from path: {file_path}")

#     if not os.path.isfile(file_path):
#         print("File not found:", file_path)
#         abort(404, description="Resource not found")
    
#     return send_from_directory(os.path.dirname(file_path), os.path.basename(file_path))

# @app.route('/screenshot/<case>/<filename>')
# def serve_screenshot(case, filename):
#     if 'ID' in request.args:
#         id_value = request.args.get('ID')
#         print(f"ID: {id_value}")

#     file_path = os.path.join(BASE_DIR, 'screenshot', case, filename)
#     print(f"Serving screenshot from path: {file_path}")

#     if not os.path.isfile(file_path):
#         print("Screenshot not found:", file_path)
#         abort(404, description="Resource not found")
    
#     return send_from_directory(os.path.dirname(file_path), os.path.basename(file_path))

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=80)


from flask import Flask, send_file, request, abort, Response
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS

# BASE_DIR = 'D:/apiportal/etabella-nestjs/assets/'
BASE_DIR = ''

@app.route('/doc/<case>/<filename>')
def serve_file(case, filename):
    if 'ID' in request.args:
        id_value = request.args.get('ID')
        print(f"ID: {id_value}")

    file_path = os.path.join(BASE_DIR, 'doc', case, filename)
    print(f"Serving file from path: {file_path}")

    if not os.path.isfile(file_path):
        print("File not found:", file_path)
        abort(404, description="Resource not found")

    return send_range_file(file_path)

@app.route('/screenshot/<case>/<filename>')
def serve_screenshot(case, filename):
    if 'ID' in request.args:
        id_value = request.args.get('ID')
        print(f"ID: {id_value}")

    file_path = os.path.join(BASE_DIR, 'screenshot', case, filename)
    print(f"Serving screenshot from path: {file_path}")

    if not os.path.isfile(file_path):
        print("Screenshot not found:", file_path)
        abort(404, description="Resource not found")

    return send_range_file(file_path)

def send_range_file(file_path):
    range_header = request.headers.get('Range', None)
    if not range_header:
        return send_file(file_path)

    size = os.path.getsize(file_path)
    byte_range = range_header.split('=')[1]
    byte1, byte2 = 0, None

    if '-' in byte_range:
        byte1, byte2 = byte_range.split('-')
        byte1 = int(byte1)
        if byte2:
            byte2 = int(byte2)

    length = size - byte1
    if byte2 is not None:
        length = byte2 - byte1 + 1

    data = None
    with open(file_path, 'rb') as f:
        f.seek(byte1)
        data = f.read(length)

    response = Response(data, 206, mimetype='application/octet-stream', content_type='application/octet-stream')
    response.headers.add('Content-Range', f'bytes {byte1}-{byte1 + length - 1}/{size}')
    return response

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
