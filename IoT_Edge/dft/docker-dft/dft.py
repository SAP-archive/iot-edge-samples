import numpy as np
import scipy.fftpack
import flask
import json

app = flask.Flask(__name__)
app.config["DEBUG"] = True

@app.route('/', methods=['POST'])
def home():
    print("invoked")
    obj = flask.request.json
    # Number of samplepoints
#    N = 600
    N = obj["samples"]
    # sample spacing
#    T = 1.0 / 800.0
    T = 1.0 / obj["spacing"]
    x = np.linspace(0.0, N*T, N)
#    y = np.sin(50.0 * 2.0*np.pi*x) + 0.5*np.sin(80.0 * 2.0*np.pi*x)
    y = obj["data"]
    yf = scipy.fftpack.fft(y)
    xf = np.linspace(0.0, int(1.0/(2.0*T)), int(N/2))
    yfin = 2.0/N * np.abs(yf[:N//2])

    jsonret= {"xf":str(xf.tolist()), "yf": str(yf.tolist()), "y": str(yfin.tolist())}
#    print(xf)
#    print(yf)
    return json.dumps(jsonret)

app.run(host= '0.0.0.0')
