# Proxy Application Extension Service

## Overview
This sample implements a Proxy application designed to operate with the SAP Edge Gateway Service REST.

The application ingests user defined payloads measurement packets, convert them in the standard SAP IoT JSON format and forward it to the SAP Edge Gateway Service.

With this sample you can also ingest binary data. If the File Transfer Service is configured in SAP IoT, the file will be saved into the configured Object Store.

The service provide the possibility to configure custom HTTP responses and response bodies (payload) both for measurements and file ingestion.

## Product Documentation

Product Documentation for SAP IoT is available as follows:

>[SAP IoT HELP Portal](https://help.sap.com/viewer/p/SAP_IoT)

### Description

The proxy application is an Extension Service running in the background, exposing an HTTP endpoint locally in the edge device.

This application exposes two POST methods, one to ingest _**measures**_ and the other to ingest _**binaryData**_ (as multipartfile).

Some other methods are exposed by the same endpoint to:
* Store file locally instead of SAP IoT
* Show a simple UI to see all the locally stored files, and optionally remove the
* Invoke a cleanup of the locally stored files
* Download a locally stored file


### Deploying this sample

This sample is packaged into the following subprojects:
* [code-customservice](https://github.com/SAP-samples/iot-edge-samples/tree/main/IoT_Edge/customservice/code-customservice): A Java Spring Boot application that is mandatory to package it.

* [docker-customservice](https://github.com/SAP-samples/iot-edge-samples/tree/main/IoT_Edge/customservice/docker-customservice): This contains the docker image source files. You need to put the compiled Java Spring Boot application in this folder to be able to build the image correctly. You need also to push it into a Docker Registry

* [chart-customservice](https://github.com/SAP-samples/iot-edge-samples/tree/main/IoT_Edge/customservice/chart-customservice): The HELM chart that will be built to generate the tgz solution you will use it into the Policy Service.


## Requirements

The following requirements must be satisfied for this sample:
1. [Java JDK](https://www.java.com/en/download/) 1.8 or above
2. [Apache Maven](https://maven.apache.org/download.cgi)
3. [Git](https://git-scm.com/downloads)  command line tool
4. [SAP IoT](https://www.sap.com/products/iot-data-services.html)
5. [HELM](https://helm.sh) Runtime
6. [Docker](https://www.docker.com)
7. Docker registry (or [Docker Hub](https://hub.docker.com) subscription)
8. An HTTP client ([Postman](https://www.postman.com) is used in this sample)
9. An Edge Node with [k3s](https://k3s.io/) runtime installed
10. Edge Gateway Service installed in the Edge Node

##Preliminary Operations

There are some preliminary operations that are undocumented here that the user has to complete to be able to make the base sample up and running:

1. Onboard the Edge Node into the Lyfecycle Management component. The documentation could be found [here](https://help.sap.com/viewer/9d5719aae5aa4d479083253ba79c23f9/SHIP/en-US/0a222b9c99d94f56abdcfe27f5be0afa.html)
2. Onboard the Edge Gateway Service into your configured Edge Node (protocol REST, specify only the mandatory parameters)
3. You have already specified your _Custom Registry_ in the Policy Service as documented in the [Container Repositories section](https://help.sap.com/viewer/247022ddd1744053af376344471c0821/LATEST/en-US/16b6665724604622b96aa8359ab112a5.html)
4. Have access to the [EAC Program](https://help.sap.com/viewer/6207c716025a46ac903072ecd8d71053/LATEST/en-US) to enable File Transfer Service Feature
5. Access and familiarity with SAP IoT Device Connectivity APIs and Thing Modeler

### SAP IoT Device Model and Configuration

The following Device Model needs to be setup on SAP IoT for this sample. You can easily create it with the _Device Connectivity_ tile in the SAP IoT Fiori Launchpad.

1. 	Create the capabilities
- **alternateId:**	10
- **name:**	outlet air pressure
- **properties:**

| Property Name 	| Property Type 	|
|:-------------:	|:-------------:	|
| value 	| float 	|
| valid 	| boolean 	|
---
- **alternateId:**	1
- **name:**	inlet air pressure
- **properties:**

| Property Name 	| Property Type 	|
|:-------------:	|:-------------:	|
| value 	| float 	|
| valid 	| boolean 	|
---


2. 	Create the sensor type
- **sensorType name:**			SAM_ST
- **alternateId:**     	986
- **capabilities:**

| Capability	| Type 	|
|:-------------:	|:-------------:	|
| outlet air pressure 	| measure 	|
| inlet air pressure 	| measure 	|
---

3. Get your _gatewayId_
4. Create a _Device_ into your _gateway_ with:
- **alternateId:** 4745672
- **sensor:** implements _SAM_ST_ sensorType with _alternateId_ and _name_ --> SAMSensor


## Download and Installation

### Download the sample app

    git clone https://github.com/SAP-Samples/iot-edge-samples.git
    cd iot-edge-samples

### Customize the source of the Java sub-project

    cd Iot_Edge/customservice/code-customservice

You can change several parameters in the file

    ./src/main/java/resources/application.properties

But remember that some of them are overriden via HELM chart later and so not currently used (used only in case of fallback), like the SAP IoT tenant configuration.

### Compile and Package the Java application

compile the Java code with Maven, write the command in the root of the code-customservice subproject

    mvn clean install

Verify that the file **custom-http-server-_{SERVICE VERSION}_.jar** is created in the /target folder.

### Build and push the Docker Image

Copy the generated jar file in the Docker Image folder
> ./customservice/docker-customservice

In this sample I'm using docker.io as Registry, some commands could be differently accordingly with the registry configuration.

Login in your docker registry and type the credentials once required.

    docker login docker.io

Build the docker image locally, supposing the version of your image is 1.0.0

    cd Iot_Edge/customservice/docker-customservice
    docker build -t {YOUR DOCKER HUB USERNAME HERE}/customservice:1.0.0 .

Push the image into the registry:

    docker push -a {YOUR DOCKER HUB USERNAME HERE}/customservice

### Customize the HELM chart project and build the tgz solution

Open the file _chart-customservice/customservice/values.yaml_

Change the following values accordingly with your Docker Image:
- image.name
- image.tag

In the same file adjust all the connectivity parameters:

    ingestionUrl: "https://xxxxxx-xxxx-xxxx-xxxxx-xxxxxxxxxxxxx.eu10.cp.iot.sap"
    clientId: "sb-xxxxxxxxx!bxxxxx|iotae_service!b5"
    clientSecret: "xxxxxxxx"
    tokenUri: "https://xxxxxxxxxx.authentication.eu10.hana.ondemand.com/oauth/token"

All these informations could be find inside the SAP IoT Service Keys.

For _ingestionUrl_ sarch for the _"iot-device-connectivity"_ sub-node in your service key and copy the value of the _"rest"_ key, you can also exclude the port; it's used for the File Transfer Service Feature.

_clientId_ and _clientSecret_ are the same values you find into the _"uaa"_ sub-node.

For _tokenUri_, take the _"uaa"_ sub-node and copy the value of _"url"_ and append at the end _/oauth/token_ like in the above sample code

---

Open the file _chart-customservice/customservice/Chart.yaml_

Change the following values accordingly with your Docker Image:
- appVersion

Lint the project and build the solution:

    cd chart-customservice/customservice
    helm lint
    helm package .

Verify that a file **customservice-_{VERSION OF THE PROJECT}_.tgz** has been correctly created

### Deploy the HELM chart

Open the Policy Service and create a new [Extension Service](https://help.sap.com/viewer/247022ddd1744053af376344471c0821/LATEST/en-US/7fffcdd2c9464b7c9e15811dc10e94f3.html). Use as solution descriptor the HELM chart built in [this other section](#customize-the-helm-chart-project-and-build-the-tgz-solution)

For the _Service Bindings_ option select **Edge Gateway Service**.

Now you need to create a [new configuration parameter](https://help.sap.com/viewer/247022ddd1744053af376344471c0821/LATEST/en-US/79849f3791c84415a7ee78ec65600334.html):

>name=port; optional=false; type=String

This parameter is used to communicate with the _Edge Gateway Service_ ingestion pipeline

### Deploy the service

Search your node in the list of nodes and Deploy the created Extension Service into your node.
As deployment parameter specify the used port for the data ingestion. Standard for REST protocol is _8910_

## Test the service

### Ingest measure data

Open your rest client and create a new **POST** call:

* **Endpoint:** {NODE IP OR HOSTNAME}:8999/measures/4745672
* **Headers:** Content-Type: application/json
* **Body:**

```json
{
  "events": [{
    "E": "4745672",
    "T": "1487752992000",
    "V": [{
      "V": "10",
      "I": "1.1"
    }, {
      "V": "0",
      "I": "10.1"
    }]
  }]
}
```

#### Short remark on the parameter contained in the body
The current implementation is mapping the **_E_** parameter into the IoT Device Model **_deviceAlternateId_**, **_T_** is the **_timestamp_**, **_V_** parameter correspond to the **_measures_** field contained in the standard SAP IoT ingestion packets. About the nested values **_V_** is mapped into the property called **_value_** in the device Model, **_I_**, the part before the point is the IoT Device Model **_capabilityAlternateId_**, the second part, after the point is used to populate the second property of the capability created into the Device Model, the one called **_valid_**. If the value is **_1_** will mean **_valid=true_**, otherwise it will be **_false_**.

Please note that this payload will generate two different packet in the standard SAP IoT ingestion pipeline, one for the capability **_inlet air pressure_** and the other for the capability **_outlet air pressure_**

---

Send the request and verify that, even if the standard ingestion is returning as _HTTP RESPONSE_ **202 ACCEPTED** the Extension Service is replying with **200 OK**.

Verify also that the body is not returning the following json object:
```json
[
  {
    "code": 202,
     "sensorAlternateId": "SAMSensor",
     "capabilityAlternateId": "10"
  }
]
```
but the following plain text string instead:

    CN100: OK

### Ingest binary data

Open your rest client and create a new **POST** call:

* **Endpoint:** {NODE IP OR HOSTNAME}:8999/binaryData/4745672
* **Headers:** Content-Type: multipart/form-data or multipart/file. If you are using Postman probably you will use _multipart/form-data_
* **Body:** it contains the file object. If you are using Postman probably you are using a _form-data_ object as body with the following parameter:
    * **Key:** file
    * **Value:** {Browse and attach the file}

The service reply with _HTTP CODE_ **200** and following plain text string:

    CN100: OK

Check the service has uploaded the file into your Object Store passing through the File Transfer Service.

#### Communication details:

The forwarding of the file to our Extension Service is done without any authentication just for demo purpose, because we are simulating an infra-lan networking secured by default (e.g., via firewall).

The communication between the Extension Service and the SAP IoT cloud APIs is done via device certificate, it means the the forwarding of the file to the File Transfert Service is done with security implemented. The Extension Service is automatically invoking all the required APIs to obtain a valid certificate to invoke the cloud APIs.
