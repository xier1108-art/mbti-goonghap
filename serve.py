import http.server
import os

os.chdir('/Users/monchy123/Desktop/project/mbti-goonghap')

server = http.server.HTTPServer(('', 3000), http.server.SimpleHTTPRequestHandler)
server.serve_forever()
