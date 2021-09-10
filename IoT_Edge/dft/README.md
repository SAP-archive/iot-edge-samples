# DFT Algorithm Extension Service

## Overview

This sample contains a simple implementation of Discrete Fourier Transform algorithm. it takes as input an even number of measurements and transform this signal in the frequency domain.

## Product Documentation

Product Documentation for SAP IoT is available as follows:

>[SAP IoT HELP Portal](https://help.sap.com/viewer/p/SAP_IoT)

### Description

The DFT algorithm is an Extension Service running in the background, exposing an HTTP endpoint locally in the edge device.

The endpoint exposes a POST methods, which is expecting to receive as body a JSON object containing the data and some details to configure correctly the algorithm.

The service is replying with an array of complex numbers representing the transformation of the data in the frequency domain.

### Deploying this sample

This sample is packaged into the following subprojects:

* [docker-dft](https://github.com/SAP-samples/iot-edge-samples/tree/main/IoT_Edger/dft/docker-dft): This contains the docker image source files. You need to push it into a Docker Registry

* [chart-dft](https://github.com/SAP-samples/iot-edge-samples/tree/main/IoT_Edge/dft/chart-dft): The HELM chart that will be built to generate the tgz solution you will use it into the Policy Service.


## Requirements

The following requirements must be satisfied for this sample:
1. [Git](https://git-scm.com/downloads)  command line tool
2. [SAP IoT](https://www.sap.com/products/iot-data-services.html)
3. [HELM](https://helm.sh) Runtime
4. [Docker](https://www.docker.com)
5. Docker registry (or [Docker Hub](https://hub.docker.com) subscription)
6. An HTTP client ([Postman](https://www.postman.com) is used in this sample)
7. An Edge Node with [k3s](https://k3s.io/) runtime installed
8. Optional: SAP Edge Gateway Service installed

##Preliminary Operations

There are some preliminary operations that are undocumented here that the user has to complete to be able to make the base sample up and running:

1. Onboard the Edge Node into the Lyfecycle Management component. The documentation could be found [here](hhttps://help.sap.com/viewer/9d5719aae5aa4d479083253ba79c23f9/SHIP/en-US/0a222b9c99d94f56abdcfe27f5be0afa.html)
2. Onboard the Edge Gateway Service into your configured Edge Node (protocol REST, specify only the mandatory parameters)
3. You have already specified your _Custom Registry_ in the Policy Service as documented in the [Container Repositories section](https://help.sap.com/viewer/247022ddd1744053af376344471c0821/LATEST/en-US/16b6665724604622b96aa8359ab112a5.html)
4. Have access to the [EAC Program](https://help.sap.com/viewer/6207c716025a46ac903072ecd8d71053/LATEST/en-US)
5. Access and familiarity with SAP IoT Device Connectivity APIs and Thing Modeler

### SAP IoT Device Model and Configuration

If you have installed the SAP Edge Gateway Service and you would like to compute the DFT over the data streamed through the Edge Message Broker a consistent Device Model needs to be setup on SAP IoT for this sample. You can easily create it with the _Device Connectivity_ tile in the SAP IoT Fiori Launchpad.

To be able to see the data in the SAP IoT time series storage, you need to model a _Thing_ with the _Thing Modeler_ application.

Above a working sample for the Device Model:

1. 	Create the capability
- **alternateId:**	10
- **name:**	C10
- **properties:**

| Property Name 	| Property Type 	|
|:-------------:	|:-------------:	|
| value 	| float 	|
| value_out 	| string 	|
---


2. 	Create the sensor type
- **sensorType name:**			C10_ST
- **alternateId:**     	987
- **capabilities:**

| Capability	| Type 	|
|:-------------:	|:-------------:	|
| C10 	| measure 	|
---

3. Get your _gatewayId_
4. Create a _Device_ into your _gateway_ with:
- **alternateId:** 4745676
- **sensor:** implements _C10_ST_ sensorType with _alternateId_ and _name_ --> SAMSensor

## Download and Installation

### Download the sample app

    git clone https://github.com/SAP-Samples/iot-edge-samples.git
    cd iot-edge-samples

### Build and push the Docker Image

In this sample I'm using docker.io as Registry, some commands could be differently accordingly with the registry configuration.

Login in your docker registry and type the credentials once required.

    docker login docker.io

Build the docker image locally, supposing the version of your image is 1.0.0

    cd Iot_Edge/dft/docker-dft
    docker build -t {YOUR DOCKER HUB USERNAME HERE}/dft:1.0.0 .

Push the image into the registry:

    docker push -a {YOUR DOCKER HUB USERNAME HERE}/dft

### Customize the HELM chart project and build the tgz solution

Open the file _chart-dft/dft/values.yaml_

Change the following values accordingly with your Docker Image:
- image.name
- image.tag

You might also be interested to modify the value of the parameter  _service.externalPort_ which is the port where the dft endpoint is published externally.

If your deployment will be binded to the SAP Edge Gateway Service you must put _bindServices.enabled_ to **true** . In this case you might also be interested to tune the other parameters:
- _property_: specify the input Capability Property name for the DFT algorithm (data type must be numeric, float compatible)
- _propertyOut_: specify the output Capability Property name for the DFT algorithm result (it must be a string), it must be inside the same Capability
- _samples_: the number of samples used for the DFT algorithm
- _spacing_: the spacial spacing for the DFT algorithm

---

Open the file _chart-dft/dft/Chart.yaml_

Change the following values accordingly with your Docker Image:
- appVersion

Lint the project and build the solution:

    cd chart-dft/dft
    helm lint
    helm package .

Verify that a file **dft-_{VERSION OF THE PROJECT}_.tgz** has been correctly created

### Deploy the HELM chart

Open the Policy Service and create a new [Extension Service](https://help.sap.com/viewer/247022ddd1744053af376344471c0821/LATEST/en-US/7fffcdd2c9464b7c9e15811dc10e94f3.html). Use as solution descriptor the HELM chart built in [this other section](#customize-the-helm-chart-project-and-build-the-tgz-solution)

If you have installed the SAP Edge Gateway Service and you would like to compute the DFT over the data streamed through the Edge Message Broker, for the _Service Bindings_ option select **Edge Gateway Service**.
In this case probably you also would like to create a [new configuration parameter](https://help.sap.com/viewer/247022ddd1744053af376344471c0821/LATEST/en-US/79849f3791c84415a7ee78ec65600334.html):
- _property_: this is the input Capability Property name for the DFT algorithm (data type string)
- _propertyOut_: this is the output Capability Property name for the DFT algorithm result (data type string)
- _samples_: the number of samples used for the DFT algorithm (data type integer)
- _spacing_: the spacial spacing for the DFT algorithm (data type integer)


### Deploy the service

Search your node in the list of nodes and Deploy the created Extension Service into your node. If you are binding it to the SAP Edge Gateway Service, specify a value for _property_, _propertyOut_, _samples_, _spacing_ in case you have created the _configuration parameters_.

## Test the service

### Ingest measure data

Open your rest client and create a new **POST** call:

* **Endpoint:** {NODE IP OR HOSTNAME}:50111
* **Headers:** Content-Type: application/json
* **Body:**

```json
{
  "samples": 24,
  "spacing": 200,
  "data": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
}
```

Send the request and verify that, even if the standard ingestion is returning as _HTTP RESPONSE_ **200 ACCEPTED** the Extension Service is replying with **200 OK**.

Verify also that the body is not returning the following json like object:
```
{"xf": "[0.0, 9.090909090909092, 18.181818181818183, 27.272727272727273, 36.36363636363637, 45.45454545454546,
  54.54545454545455, 63.63636363636364, 72.72727272727273, 81.81818181818183, 90.90909090909092, 100.0]", "yf":
  "[(276-0j), (-12.000000000000004+91.14904935270181j), (-12.000000000000002+44.78460969082653j),
  (-12.000000000000002+28.970562748477143j), (-11.999999999999998+20.784609690826528j),
  (-11.999999999999998+15.638704474094466j), (-12+12j), (-11.999999999999998+9.207923855747522j),
  (-11.999999999999998+6.928203230275509j), (-11.999999999999998+4.970562748477143j),
  (-12.000000000000002+3.215390309173472j), (-12+1.5798299710487527j), (-12-0j), (-12-1.5798299710487527j),
  (-12.000000000000002-3.215390309173472j), (-11.999999999999998-4.970562748477143j),
  (-11.999999999999998-6.928203230275509j), (-11.999999999999998-9.207923855747522j), (-12-12j),
  (-11.999999999999998-15.638704474094466j), (-11.999999999999998-20.784609690826528j),
  (-12.000000000000002-28.970562748477143j), (-12.000000000000002-44.78460969082653j),
  (-12.000000000000004-91.14904935270181j)]", "y": "[23.0, 7.661297575540389, 3.8637033051562732, 2.613125929752753, 2.0,
  1.6426796317045813, 1.414213562373095, 1.260472414010264, 1.1547005383792512, 1.0823922002923938, 1.035276180410083,
  1.0086289605801526]"}
```

If you have it binded to the SAP Edge Gateway Service, send several samples (you need at least the same number of samples specified with the _samples_ parameter inside the HELM chart or via Deployment parameter if you have specified it differently during the installation of the service).

The following sample works with the sample Device Model specified above:

```JSON
{"capabilityAlternateId": "10", "sensorTypeAlternateId": 987, "sensorAlternateId": "C1Sensor", "measures": [{"value": 1, "value_out": ""}]}
```

After you have sent a number of messages at least equals to _samples_, the _value_out_ will be visible in the SAP IoT Thing Modeler and SAP IoT Storage.

```
{"xf": "[0.0, 9.090909090909092, 18.181818181818183, 27.272727272727273, 36.36363636363637, 45.45454545454546,
  54.54545454545455, 63.63636363636364, 72.72727272727273, 81.81818181818183, 90.90909090909092, 100.0]", "yf":
  "[(276-0j), (-12.000000000000004+91.14904935270181j), (-12.000000000000002+44.78460969082653j),
  (-12.000000000000002+28.970562748477143j), (-11.999999999999998+20.784609690826528j),
  (-11.999999999999998+15.638704474094466j), (-12+12j), (-11.999999999999998+9.207923855747522j),
  (-11.999999999999998+6.928203230275509j), (-11.999999999999998+4.970562748477143j),
  (-12.000000000000002+3.215390309173472j), (-12+1.5798299710487527j), (-12-0j), (-12-1.5798299710487527j),
  (-12.000000000000002-3.215390309173472j), (-11.999999999999998-4.970562748477143j),
  (-11.999999999999998-6.928203230275509j), (-11.999999999999998-9.207923855747522j), (-12-12j),
  (-11.999999999999998-15.638704474094466j), (-11.999999999999998-20.784609690826528j),
  (-12.000000000000002-28.970562748477143j), (-12.000000000000002-44.78460969082653j),
  (-12.000000000000004-91.14904935270181j)]", "y": "[23.0, 7.661297575540389, 3.8637033051562732, 2.613125929752753, 2.0,
  1.6426796317045813, 1.414213562373095, 1.260472414010264, 1.1547005383792512, 1.0823922002923938, 1.035276180410083,
  1.0086289605801526]"}
```
