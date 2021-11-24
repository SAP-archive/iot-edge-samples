import numpy as np
import scipy.fftpack
import flask
import json
import paho.mqtt.client as mqtt
import time
import os
import collections

JTW_TOKEN = "/var/run/secrets/kubernetes.io/serviceaccount/token"

SERVICE_BINDINGS = os.getenv('SERVICE_BINDINGS', False)
NAMESPACE = "/var/run/secrets/kubernetes.io/serviceaccount/namespace"
CLIENT_ID = ""
#SERVICE_BINDINGS: {'bindings': [{'type': 'MQTT', 'id': '7ebc05fb-48d0-47c1-8496-b38059deca9e', 'api': 'MQTT API URL',
#'url': 'ssl://edge-gateway-service.7ebc05fb-48d0-47c1-8496-b38059deca9e:61658'}, {'type': 'REST', 'id': '7ebc05fb-48d0-47c1-8496-b38059deca9e',
#'api': 'REST API URL', 'url': 'https://edge-gateway-service.7ebc05fb-48d0-47c1-8496-b38059deca9e:8904'}]}
MQTT_BROKER_HOST = "edge-gateway-service.sap-iot-gateway"
MQTT_BROKER_PORT = os.getenv('MQTT_BROKER_PORT', 61658)
BUS_TOPIC_OUT="iot/edge/v1/sap-iot-gateway/measures/out"
BUS_TOPIC_IN="iot/edge/v1/sap-iot-gateway/measures/in"
SAMPLES = int(os.getenv('SAMPLES', 24))
PROPERTY = os.getenv('PROPERTY', "value")
PROPERTY_OUT = os.getenv('PROPERTY_OUT', "value_out")
SPACING = int(os.getenv('SPACING', 200))
DATA = {}


def on_disconnect(client, userdata, rc):
    if rc != 0:
        print("Unexpected disconnection.")

# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
    if rc==0:
        client.connected_flag=True #set flag
        print("connected OK")
    else:
        print("Bad connection Returned code=",rc)
        client.bad_connection_flag=True
# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    global DATA
    global SAMPLES
    global SPACING
    global PROPERTY
    global PROPERTY_OUT
    #[{'gatewayId': '823457838', 'gatewayAlternateId': 'node4', 'deviceId': 'fba9c098-1f9e-44ab-aede-e4f389790255', 'deviceAlternateId': '4745676',
    #'sensorId': '5eba12e4-586c-404e-ab42-bddd0847815b', 'sensorAlternateId': 'SAMSensor', 'sensorTypeAlternateId': '986', 'capabilityId':
    #'782d94cc-4956-4461-9cac-f04a81880d56', 'capabilityAlternateId': '10', 'gatewayTimestamp': 1631116193644, 'measures': [{'valid': True, 'value': 1.0}]}]
    print('>', msg.topic, msg.payload)
    message = json.loads(msg.payload)
    mx = message[0]
    device = mx["deviceAlternateId"]
    measures = mx["measures"]
    for meas in measures:
        if PROPERTY in meas:
            if not device in DATA:
                DATA[device] = collections.deque(maxlen=SAMPLES)
            DATA[device].append(meas[PROPERTY])
            ret = ""
            if len(DATA[device]) == SAMPLES:
                obj = {"samples":SAMPLES, "spacing": SPACING, "data": []}
                for v in DATA[device]:
                    obj["data"].append(float(v))
                ret = dft(obj)
            message[0]["measures"][0][PROPERTY_OUT] = ret
            post_measures(json.dumps(message))


    print(message)
    if 'command' in message:
        value = message['command']['Value']
        try:
            value = float(value)
            START_VALUE = value
        except Exception as e:
             print(e)
def on_log(client, userdata, level, buf):
    #print(client)
    #print(userdata)
    #print(level)
    #print(buf)
    pass
#Data ingestion part
def on_subscribe(client, userdata, mid, granted_qos):
    print("subscribed with QoS", granted_qos)

def post_measures(message):
    client.publish(BUS_TOPIC_IN, message)

def import_security(message):
    global CLIENT_ID
    global JTW
    with open(NAMESPACE, 'r') as file:
        CLIENT_ID = file.read().rstrip()

    with open(JTW_TOKEN, 'r') as file:
        JTW = file.read().rstrip()

#issue connection only if we have SERVICE_BINDINGS
if SERVICE_BINDINGS!=False:

    import_security()
    mqtt.Client.connected_flag=False#create flag in class
    mqtt.Client.bad_connection_flag=False
    client = mqtt.Client(client_id=CLIENT_ID, clean_session=True, transport="tcp")
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    client.on_log = on_log
    client.on_subscribe = on_subscribe
    client.loop_start()

    while not client.connected_flag and not client.bad_connection_flag:
        #wait in loop
        print("Waiting for an EDGE Platfom connection")
        try:
            client.connect(MQTT_BROKER_HOST, int(MQTT_BROKER_PORT), 60)
            #connect to broker
        except Exception as e:
            print("EDGE Platfom connection not available: ", e)

        time.sleep(10)

    print("Connected to ", MQTT_BROKER_HOST)
    client.subscribe(BUS_TOPIC_OUT)
def dft(obj):
    # Number of samplepoints
    N = obj["samples"]
    # sample spacing
    T = 1.0 / obj["spacing"]
    x = np.linspace(0.0, N*T, N)
#   y = np.sin(50.0 * 2.0*np.pi*x) + 0.5*np.sin(80.0 * 2.0*np.pi*x)
    y = obj["data"]
    yf = scipy.fftpack.fft(y)
    xf = np.linspace(0.0, int(1.0/(2.0*T)), int(N/2))
    yfin = 2.0/N * np.abs(yf[:N//2])

    jsonret= {"xf":str(xf.tolist()), "yf": str(yf.tolist()), "y": str(yfin.tolist())}
    return json.dumps(jsonret)

app = flask.Flask(__name__)
#disable context reload flags
app.debug = False
app.use_reloader=False
@app.route('/', methods=['POST'])
def home():
    obj = flask.request.json
    return dft(obj)

app.run(host= '0.0.0.0')
