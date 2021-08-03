import json
import os.path
import time

# Third-party libraries
import zmq

context = zmq.Context()
socket = context.socket(zmq.REQ)
socket.connect("tcp://localhost:5555")

socket.send(b"hello")

message = socket.recv()
print(message)

while True:
    #  Wait for next request from client
    jsonStr = '{"measures":{"R":255.0, "G":125.0, "B":64}}'
    socket.send(jsonStr.encode('ascii'))
    #  Do some 'work'
    time.sleep(1)
    message = socket.recv()
    print("Received request: %s" % message)