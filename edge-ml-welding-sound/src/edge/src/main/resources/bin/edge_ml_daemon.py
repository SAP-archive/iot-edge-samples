from __future__ import print_function
import tensorflow as tf
import numpy as np
import keras

from keras.preprocessing.image import ImageDataGenerator, array_to_img, img_to_array, load_img
from keras.models import Sequential
from keras.layers import Activation, Dropout, Flatten, Dense, LSTM, Activation, Dense, Dropout, Input, Embedding, TimeDistributed, Conv2D, MaxPooling2D
from keras import backend as K
from keras.preprocessing import image

from keras.models import Sequential
from keras.layers import Dense, Dropout, LSTM
import matplotlib.pyplot as plt

from keras.utils.np_utils import to_categorical # convert to one-hot-encoding
from sklearn.utils import shuffle
from keras import regularizers
from keras.datasets import cifar10
from keras.preprocessing.image import ImageDataGenerator
from keras.models import Sequential
from keras.optimizers import SGD
from keras.callbacks import ModelCheckpoint
from keras.layers.convolutional import Conv2D
from keras.layers.convolutional import MaxPooling2D
from keras.utils import np_utils
from keras.preprocessing.image import ImageDataGenerator
from keras.layers import Dense, Activation, Flatten, Dropout, BatchNormalization
from keras import regularizers
from keras.callbacks import LearningRateScheduler
from keras import backend as K
#import keras
import matplotlib.pyplot as plt
from sklearn.metrics import roc_auc_score

import boto3

import fnmatch, os, os.path, re, time, logging, urllib, json

from pydub import AudioSegment
from pydub.utils import make_chunks

import librosa
import librosa.display

from pydub import AudioSegment
from pydub.utils import make_chunks
import shutil, sys
import os, fnmatch, re
from keras.models import model_from_json

## inception
import grpc
from tensorflow_serving.apis import predict_pb2
from tensorflow_serving.apis import prediction_service_pb2_grpc
from keras.preprocessing import image
from tensorflow.python.keras.applications.inception_v3 import *

model = None
### inception
_use_inception_v3 = False 
retrain = False

bin_dir = os.getcwd() # "../ml_poc/bin/", where the Python script will be running from
home_dir = os.path.dirname(bin_dir) # "../ml_poc/", the home directory 
raw_input_dir = os.path.join(home_dir, 'input') # "../ml_poc/input/"
processed_input_dir = os.path.join(raw_input_dir, 'processed') # "../ml_poc/input/processed"
logging_dir = os.path.join(home_dir, 'logs')
split_dir = os.path.join(home_dir, 'split') # "../ml_poc/split"
image_dir = os.path.join(home_dir, 'image') # "../ml_poc/image"
model_dir_name = os.path.join(home_dir, 'model')
output_dir = os.path.join(home_dir, 'output') # "../ml_poc/output"

# IoT Service Instance: https://23274b22-833f-4c23-abd9-267686b80f75.canary.cp.iot.sap/
device_id = "MLDevice01"
sensor_id = "ML_Test_Sensor"
sensor_type_alternate_id = "67"
capability_alternate_id = "inf01"

LOG_FILENAME = 'edge_ml_daemon.log'
logging.basicConfig(filename=os.path.join(logging_dir, LOG_FILENAME), level=logging.INFO)
logging.getLogger().addHandler(logging.StreamHandler(sys.stdout))
def get_files (d):
    includes = ['*.json', '*.h5', '*.mp3', '*.wav', '*.png'] # for files only
    excludes = ['.DS_Store','/home/ram/doc'] # for dirs and files
    
    # transform glob patterns to regular expressions
    includes = r'|'.join([fnmatch.translate(x) for x in includes])
    excludes = r'|'.join([fnmatch.translate(x) for x in excludes]) or r'$.'

    # Get all files in the specified directories, excluding subdirectories
    files = [f for f in os.listdir(d) if os.path.isfile(os.path.join(d, f))]
    
    files = [f for f in files if not re.match(excludes, f)]
    files = [f for f in files if re.match(includes, f)]
    
    # Join the directory to each file
    files = [os.path.join(d, f) for f in files]
    
    logging.debug('List of valid files for {}: {}'.format(d, str(files)))
    return files


def download_data(s3_client, bucket, obj_name, ouput_dir):
    try:
        s3_client.download_file(bucket, obj_name, ouput_dir+obj_name)
        
    except Exception as e:
        logging.error(str(e) )
        return False
    return True

 
### Tool Audio
def create_data(input_data_dir):
    x = []
    y = []
    

    tmpx = []
    tmpy = []
    logging.debug('Processing class {}'.format (c))

    for file in [f for f in os.listdir(input_data_dir + c) if f!='.DS_Store']:
        f = raw_input_dir  + file
        logging.debug("Processing file {}".format(f))
        try:
            wave,sr = librosa.load(f, mono=True)
            mfcc = librosa.feature.mfcc(y=wave, sr=sr, n_mfcc=20)
            mfcc_pad = np.zeros((20, 44))
            mfcc_pad[:mfcc.shape[0], :mfcc.shape[1]] = mfcc[:20, :44]
        
            if mfcc_pad.shape == (20, 44):
                x.append(mfcc_pad)
                tmpx.append(mfcc_pad)
                y.append(classes.index(c))
                tmpy.append(classes.index(c))
        except Exception as e:
            logging.error("Error processing audio file {}".format(str(e)) )
   
    return np.array(x), np.array(y)


def split_file (sound_file, output_dir):
    splits = 0
    if not os.path.exists(output_dir):
        logging.debug('creating directory {}'.format(output_dir))
        os.makedirs(output_dir)
    
    try:
        if sound_file.endswith('.wav'):  
            myaudio = AudioSegment.from_wav(sound_file)
        else:
            myaudio = AudioSegment.from_mp3(sound_file)
            
        chunks = make_chunks(myaudio, 1000) 
        fname = sound_file.split(os.path.sep)[-1]
        for i, chunk in enumerate(chunks):
            # format of the name: OUTPUT_DIR/FILE_NAMEi.wav
            # call fname.split to remove the file type
            chunk.export( os.path.join(output_dir, fname.split('.')[0] + str(i)) + '.wav' )
        return len(chunks)
    except Exception as e:
        logging.error('Error splitting sound file  {}: {}'.format(sound_file, str(e)))
    return 0

def sound_to_image (sound_file, output_dir):
    splits = 0
    if not os.path.exists(output_dir):
        logging.debug('creating directory {}'.format(output_dir))
        os.makedirs(output_dir)
    
    try:
        fname = sound_file.split('/')[-1]
        y, sr = librosa.load(sound_file)
        S = librosa.feature.melspectrogram(y, sr=sr, n_mels=128)
        log_S = librosa.amplitude_to_db(S)

        spectogram_file = "{}/{}.png".format(output_dir,fname) 
        librosa.display.specshow(log_S, sr=sr, x_axis='time', y_axis='mel')
        #print('Saving spectogram...' + str(sound_file[:sound_file.index('.')] + '.png'))
        plt.savefig(spectogram_file)
        print("saving image to {}".format(spectogram_file))

    except Exception as e:
        logging.error('Error converting sound file to image   {}: {}'.format(sound_file, str(e)))
    return 0


    fname = sound_file.split('/')[-1]
    y, sr = librosa.load(sound_file)
    S = librosa.feature.melspectrogram(y, sr=sr, n_mels=128)
    log_S = librosa.amplitude_to_db(S)

    spectogram_file = "{}{}.png".format(output_dir,fname) 
    librosa.display.specshow(log_S, sr=sr, x_axis='time', y_axis='mel')
    #print('Saving spectogram...' + str(sound_file[:sound_file.index('.')] + '.png'))
    plt.savefig(spectogram_file)





def move_file (f, target_dir):
    try:
        shutil.move(f, os.path.join(target_dir, f.split(os.sep)[-1] ) )

    except Exception as e:
        logging.error('Error moving sound file  {}: {}'.format(f, str(e)))


def split_files(src, dst, move=False):
    print ("Splitting file(s) ..")
    start, splits = time.time(), 0
    processed_dir = os.path.join(src, 'processed')
    if move:
        if not os.path.exists(processed_dir):
            logging.debug('creating directory {}'.format(output_dir))
            os.makedirs(processed_dir)
    files = get_files(src)

    if len(files):
        print ("Splitting file(s) ..")

    for sound_file in files: 
        logging.debug('Splitting dir {}, file {}'.format(dst, sound_file))
        c = split_file(sound_file, dst)
        splits += c
        move_file(sound_file, processed_dir)
    end = time.time()
    duration, count = end - start, len(files)

    if count:
        logging.info("\n\nSplit {} files in {} seconds into {} splits. Latency per split: {}".format(count, duration, splits, duration/splits))



def convert_sound_to_image_files(src, dst, move=False):
    
    start, splits = time.time(), 0
    processed_dir = os.path.join(src, 'processed')
    if move:
        if not os.path.exists(processed_dir):
            logging.debug('creating directory {}'.format(processed_dir))
            os.makedirs(processed_dir)
    files = get_files(src)
    if files:
        print ("Converting sound to image file(s) ..")
    else:
        print("No files to run convert")
    for sound_file in files:
        logging.debug('Converting to image dir {}, file {}'.format(dst, sound_file))
        sound_to_image(sound_file, dst)
  
        move_file(sound_file, processed_dir)
    end = time.time()
    duration, count = end - start, len(files)

    if count:
        logging.info("\n\Converted {} files in {} seconds. Latency per sound file: {}".format(count, duration, duration//count))



def run_inferences(src, dst, move=False, inception=False):
    try:
        output_dir = dst
        processed_dir = os.path.join(src, 'processed')
    
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        if move:
            if not os.path.exists(processed_dir):
                os.makedirs(processed_dir)

        files = get_files(src)
        if not files:
            print("No new files to run inference on")
        for sound_file in files:
            logging.debug('Writing inference dir {}, file {}'.format(dst, sound_file))
            run_inference(sound_file, dst, inception)
            
            if move:
                move_file(sound_file, processed_dir)
    except Exception as e:
        print ( 'Error executing inferencing {}'.format( str(e) ) )


def run_inference(test_sound_file, dst, inception=False):
    start = time.time()
    logging.debug("Running_inference for {}".format( test_sound_file ))

    if not inception:
        classes = ['Normal', 'Defect']
        wave,sr = librosa.load(test_sound_file, mono=True)
        mfcc = librosa.feature.mfcc(y=wave, sr=sr, n_mfcc=20)
        logging.debug('MFCC completed in {} seconds'.format(time.time()-start))
        mfcc_pad = np.zeros((20, 44))
        mfcc_pad[:mfcc.shape[0], :mfcc.shape[1]] = mfcc[:20, :44]
        x_pred = mfcc_pad.reshape(-1, 20, 44, 1)
        result_index = np.argmax(model.predict(x_pred))
    else:
        print ("Running inception model")
        ret = do_inference_inceptionv3(test_sound_file)
        print ("Submitted to inception V3 ")
        #result = classes[result_index]
        #print('Sound is {}, inferred in {} seconds\n'.format(result, end-start )
        return ### temperory, this needs to be refactored
    end = time.time()
    
    result = classes[result_index]
    resultStr = 'Sound is {}, inferred in {} seconds\n'.format(result, end-start )
    print( resultStr )
    logging.info(resultStr)
    print ('--------------------------- .')
    #result = test_sound_file.split(os.path.sep)[-1] + "_out.txt"
    print (output_dir)
    with open( os.path.join(output_dir, test_sound_file.split(os.sep)[-1] + '_out.txt' ), 'a+') as f:
        f.write("{},{}\n".format(time.time(), result))
  
    send_data_to_gateway( result_index, device_id, sensor_id, sensor_type_alternate_id, capability_alternate_id )
    



def send_data_to_gateway(result, deviceId, sensorAlternateId, sensorTypeAlternateId, capabilityAlternateId):
    url = 'http://127.0.0.1:8699/measures/' + deviceId
    
    measures = [[ int(result) ]] # must be formatted as a list of lists
    
    body = {}
    
    body['sensorAlternateId'] = sensorAlternateId
    body['sensorTypeAlternateId'] = sensorTypeAlternateId
    body['capabilityAlternateId'] = capabilityAlternateId
    body['measures'] = measures
    
    jsonbody = json.dumps(body)
    
    request = urllib.request.Request(url, jsonbody.encode('utf-8'), { "Content-Type": "application/json" })
    response = urllib.request.urlopen(request).read().decode()
    print(response)
    


def do_forever():
    global model
    logging.info('Running Edge Machine Learning PoC from {}'.format(home_dir))
    while True:
        model = load_model(model_dir_name)

        split_files(raw_input_dir, split_dir, move=True)
        time.sleep(2)

        if _use_inception_v3:
            convert_sound_to_image_files(split_dir, image_dir, move=True)

        #run_inferences(split_dir, output_dir, move=True, inception=False)
        run_inferences(image_dir, output_dir, move=True, inception=_use_inception_v3)
        #ret = do_inference_inceptionv3('/home/jovyan/work/data/images/Defect_01_11.png', FLAGS.server) 
 
def get_aws_connection():
    boto3.setup_default_session(region_name='eu-central-1')
    s3  = boto3.client(
        's3',
        # Hard coded strings as credentials, not recommended.
        aws_access_key_id='<aws_key>',
        aws_secret_access_key='<aws_secret>',
        region_name = 'eu-central-1'
    )  
    return s3

def download_model(s3_client, bucket, obj_name, ouput_dir):
    try:

        print ("obj name -->" +obj_name)
        print ("output_dir ->" + ouput_dir)
        s3_client.download_file(bucket, obj_name, ouput_dir+os.sep+obj_name.split(os.sep)[-1])
        
    except Exception as e:
        print(str(e))
        return False
    return True

## load model
last_model_download_ts = int(time.time())
def load_model (model_dir_name, model_name = 'audio_detectx', model_expiry_seconds=300):
    global model, last_model_download_ts
    print ( 'Fresh model download will attempted in {} seconds'.format (  last_model_download_ts+model_expiry_seconds - int(time.time()), str(model) ) )    
    if model is None or  (int(time.time()) > last_model_download_ts+model_expiry_seconds):
        ### attempt to download model from S3
        try:
            conn = get_aws_connection()
            print ("Downloading model/{}.json".format(model_name))
            download_model(conn, 'edgepoc', "model/{}.json".format(model_name), model_dir_name)
            print ("Downloading model/{}.h5".format(model_name) )
            download_model(conn, 'edgepoc', "model/{}.h5".format(model_name), model_dir_name)
            print ("Downloading model complete")
            last_model_download_ts = int(time.time())
        except Exception as e:
            print(str(e))

        print ("Loading model {}".format(model_name))
        # Model reconstruction from JSON file
        with open(os.path.join(model_dir_name, "{}.json".format(model_name)), 'r') as f:
            model = model_from_json(f.read())

        # Load weights into the new model
        model.load_weights(os.path.join(model_dir_name, "{}.h5".format(model_name)))
    else:
        print("Using cached model ")
    return model

#### INCEPTION V3 stuff
tf.app.flags.DEFINE_integer('concurrency', 1,
                            'maximum number of concurrent inference requests')

tf.app.flags.DEFINE_string('server', '', 'PredictionService host:port')
FLAGS = tf.app.flags.FLAGS
preds = {0: 'Normal', 1:'Defect'}
GRPC_HOST_PORT = 'localhost:8500'

def _callback(result_future):
    """Callback function.
    Calculates the statistics for the prediction result.
    Args:
      result_future: Result future of the RPC.
    """
    print ("\nInference scores {}".format(result_future.result().outputs['scores']) )
    exception = result_future.exception()
    if exception:
      print(exception)
    else:
      #print("From Callback",result_future.result().outputs['dense_2/Softmax:0'])
      response = np.array(
          result_future.result().outputs['scores'].float_val)
      #print("Probabilties {} Prediction {}".format(str(response), preds[np.argmax(response)] ) )
      print("Prediction {}".format(preds[np.argmax(response)] ) )

request, stub = None, None
def init(hostport):
    global request, stub
    if not request:
        print ("Starting tf client")
        start = time.time()
        channel = grpc.insecure_channel(hostport)
        stub = prediction_service_pb2_grpc.PredictionServiceStub(channel)
        request = predict_pb2.PredictRequest()
        request.model_spec.name = 'Volvo01'
        request.model_spec.signature_name = 'predict_images' #'extract_feature' #'predict_images'
        print ("Initialized client in {} seconds".format(time.time()-start))
    else:
        print ("TF client already started")
    return stub, request 

def preprocess_input(x):
    x /= 255.
    x -= 0.5
    x *= 2.
    return x
    
def do_inference_inceptionv3(file_path, dst=None, hostport=GRPC_HOST_PORT):
    stub, request = init(hostport)

    # For loading images
    image_size = 299
    img = image.load_img(file_path, target_size=( 299, 299), color_mode='rgb')

    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    #print(x.shape)

    request.inputs['images'].CopyFrom(
        tf.contrib.util.make_tensor_proto(x, shape=[1, image_size, image_size, 3]))

    start = time.time()
    result_future = stub.Predict.future(request, 10.25)  # 5 seconds  
    result_future.add_done_callback(_callback)
    end = time.time()
    print("Time to Send is ",time.time() - start)

#### INCEPTION V3 stuff


do_forever()

time.sleep(10)