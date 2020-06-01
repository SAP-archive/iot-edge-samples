# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# Copyright (c) 2020 SAP SE or an affiliate company. All rights reserved.
# The sample is not intended for production use.  Provided "as is".
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

'''
This program implements a KNN algorithm to recognize the color of in input sample,
in terms of RGB components. The model is trained within a dataset of red-scale, 
so it able to recognize what colours are red, and provide as output the euclidean distances
of the top 3 nearest neighbors.
'''
import json
import os.path

# Third-party libraries
import sklearn.neighbors
import zmq

# This folder must contain the model data
DATA_DIR = '.'
TRAINING_DATASET_FILENAME = os.path.join(DATA_DIR, 'red-colors.json')

def predict(array_data, labels, knn_classifier):
    '''Predict the color name by its RGB components
    Args:
        array_data (list): a list of 3 integer elements: R, G, B. Each element must be in the 0..255 range.
        labels (list): a list of labels that come from the dataset.
        knn_classifier (object): The classifier used to make the prediction.
    Returns:
        A dictionary with neighbor names as keys and distances from the RGB point to each neighbor as values
    '''
    predicted = knn_classifier.predict(array_data)
    print(predicted)
    distances,indexes = knn_classifier.kneighbors(array_data)
    print(distances)
    print([labels[i] for i in indexes[0]])
    print(indexes)
    data = {}
    data['label'] = predicted[0]
    data['neighbor(1)'] = distances[0][0]
    data['neighbor(2)'] = distances[0][1]
    data['neighbor(3)'] = distances[0][2]
    print(data)
    return data

def zmq_start_server(port):
    '''
    Strart ZMQ messagebus at the specified port (binded to any available ip)
    
    Args:
        port (string): A string with the port used to bind the socket at the server side.
    '''
    context = zmq.Context()
    socket = context.socket(zmq.REP)
    socket.bind("tcp://*:" + port)
    return socket

def main():
    '''
    The entry point of the predictive algorithm
    ''' 
    f = open(TRAINING_DATASET_FILENAME)
    dataset = json.load(f)
    f.close()
    points = [el['data'] for el in dataset]
    labels = [el['label'] for el in dataset]
    knn_classifier = sklearn.neighbors.KNeighborsClassifier(3)
    knn_classifier.fit(points, labels)
    
    # Create the server
    socket = zmq_start_server("5555")
    # Process messages
    while True:
        #  Wait for next request from client
        message = socket.recv()
        print("Received request: %s" % message)
        if(message == b'hello'):
            socket.send(b'hello')
            continue
        
        #  Parse Json
        try:
            objSample = json.loads(message.decode('utf-8'))
            rgbSamples = []
            print(objSample)
            rgbSamples.append([objSample['measures']['R'],objSample['measures']['G'],objSample['measures']['B']])
            #  Do prediction
            prediction = predict(rgbSamples, labels, knn_classifier)
            
            #  Create json
            jsonprediction = json.dumps(prediction)
            print(jsonprediction)
            #  Send reply back to client
            socket.send((jsonprediction.encode('utf-8')))
        except Exception as e:
            print(e)

if __name__ == '__main__':
    # Run the main process
    main()