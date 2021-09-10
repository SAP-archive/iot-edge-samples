import numpy as np
import scipy.fftpack
import flask
import json
import paho.mqtt.client as mqtt
import time
import ssl
import os
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from OpenSSL import crypto
import collections

SERVICE_BINDINGS = os.getenv('SERVICE_BINDINGS', False)
CLIENT_ID = os.getenv('IOT_SERVICE_INSTANCE_ID', "1234")
TRUSTSTORE_P12 = "/etc/secrets/custom-certs/clientTrustStore"
KEYSTORE_P12 = "/etc/secrets/custom-certs/clientKeyStore"
TRUSTSTORE_P12_PW = "/etc/secrets/custom-certs/clientTrustStorePassword"
KEYSTORE_P12_PW = "/etc/secrets/custom-certs/clientKeyStorePassword"
KEY_FILE = "./keystore.pem"
CERT_FILE = "./cert.pem"
CA_FILE = "./truststore.pem"
#SERVICE_BINDINGS: {'bindings': [{'type': 'MQTT', 'id': '7ebc05fb-48d0-47c1-8496-b38059deca9e', 'api': 'MQTT API URL',
#'url': 'ssl://edge-gateway-service.7ebc05fb-48d0-47c1-8496-b38059deca9e:61658'}, {'type': 'REST', 'id': '7ebc05fb-48d0-47c1-8496-b38059deca9e',
#'api': 'REST API URL', 'url': 'https://edge-gateway-service.7ebc05fb-48d0-47c1-8496-b38059deca9e:8904'}]}
MQTT_BROKER_HOST = ""
MQTT_BROKER_PORT = ""
BUS_TOPIC_IN = ""
BUS_TOPIC_OUT = ""
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

def import_certs_pem():
    global TRUSTSTORE_P12
    global TRUSTSTORE_P12_PW
    global KEYSTORE_P12
    global KEYSTORE_P12_PW
    global KEY_FILE
    global CERT_FILE
    global CA_FILE

    with open(KEYSTORE_P12_PW, "r") as pw_k:
        password_ks = pw_k.read()

    with open(TRUSTSTORE_P12_PW, "r") as pw_t:
        password_ts = pw_t.read()

    with open(KEYSTORE_P12, "rb") as file:
        private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(file.read(), str.encode(password_ks))

    with open(TRUSTSTORE_P12, "rb") as file:
        private_key_t, certificate_t, additional_certificates_t = pkcs12.load_key_and_certificates(file.read(), str.encode(password_ts))

    # PEM formatted private key
    with open(KEY_FILE, "wb") as key_f:
        key_f.write(private_key.private_bytes(encoding=serialization.Encoding.PEM, format=serialization.PrivateFormat.PKCS8, encryption_algorithm=serialization.NoEncryption()))

    # PEM formatted certificate
    with open(CERT_FILE, "wb") as cert_f:
        cert_f.write(certificate.public_bytes(serialization.Encoding.PEM))

    # PEM formatted certificates
    with open(CA_FILE, 'wb') as ca_f:
        for cert in additional_certificates_t:
            ca_f.write(cert.public_bytes(serialization.Encoding.PEM))

def import_endpoint():
    global SERVICE_BINDINGS
    global MQTT_BROKER_HOST
    global MQTT_BROKER_PORT
    global BUS_TOPIC_OUT
    global BUS_TOPIC_IN

    bind_json = json.loads(SERVICE_BINDINGS)
    bindings = bind_json["bindings"]
    for f in bindings:
        if ("type" in f) and (f["type"]=="MQTT"):
            url = f["url"]
            #ssl://edge-gateway.namespace.svc.cluster.local:50100"
            #drop protocol
            pos = url.find('//')
            url = url[pos+2:]
            pos = url.find(':')
            MQTT_BROKER_HOST = url[:pos-len(url)]
            MQTT_BROKER_PORT = url[pos+1:]
            gwid=f["id"]
            BUS_TOPIC_OUT="iot/edge/v1/" + gwid + "/measures/out"
            BUS_TOPIC_IN="iot/edge/v1/" + gwid + "/measures/in"


#issue connection only if we have SERVICE_BINDINGS
if SERVICE_BINDINGS!=False:

    mqtt.Client.connected_flag=False#create flag in class
    mqtt.Client.bad_connection_flag=False
    import_certs_pem()
    import_endpoint()
    client = mqtt.Client(client_id=CLIENT_ID, clean_session=True, transport="tcp")
    client.tls_set(ca_certs=CA_FILE, certfile=CERT_FILE, keyfile=KEY_FILE, cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2)
    client.tls_insecure_set(True)
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
