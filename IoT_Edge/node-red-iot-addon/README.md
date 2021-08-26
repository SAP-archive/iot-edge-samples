# Node Red IoT Addon

## Overview
This sample starts [Node Red](https://nodered.org) as Extension Service.

In addition to the original standard Node Red product it provides several auto-configurable flows and operators to provide to the end user the capability to integrate with the SAP Edge Services with zero code development.

Custom sub-flows are provided to integrate with Persistence Service, Edge Gateway Service (including data ingestion pipeline via Edge Broker), and Extension Services

All the provided flows are UI ready, it means that you can easily build your own Edge (disconnected) dashboard with zero or low code programming.

## Product Documentation

Product Documentation for SAP IoT is available as follows:

>[SAP IoT HELP Portal](https://help.sap.com/viewer/p/SAP_IoT)

### Description

This service is configuring a stable distro of Node Red with custom user data to provide integration with the SAP components.

All the provided flows are automatically configured with the bindings provided to the Extension Service via Policy Service, to be automatically adapted with your node and your deployment without any manual configuration.

A sample dashboard is also deployed, created with the Node Red UI standard components and levereging the provided flows.

The existing flows provide:
* Simple and configurable Edge Dashboard
* Access to Persistence measurements with the APIs, implemented with security enabled
* Access read/write from the Edge Message Broker, to consume existing measurements and produce new measurements
* Simplified interface with other Extension Services running at the Edge (e.g. [dft](https://github.com/SAP-Samples/iot-edge-samples/tree/main/IoT_Edge/dft/))
* CSV data ingestion simulator
* Custom UI components


### Deploying this sample

This sample is packaged into the following subprojects:


* [docker-customservice](https://github.com/SAP-samples/iot-edge-samples/tree/main/IoT_Edge/node-red-iot-addon/docker-node-red-iot-addon): This contains the docker image source files. You need to put the compiled Java Spring Boot application in this folder to be able to build the image correctly. You need also to push it into a Docker Registry

* [chart-customservice](https://github.com/SAP-samples/iot-edge-samples/tree/main/IoT_Edge/customservice/chart-customservice): The HELM chart that will be built to generate the tgz solution you will use it into the Policy Service.


## Requirements

The following requirements must be satisfied for this sample:
1. [Git](https://git-scm.com/downloads)  command line tool
2. [SAP IoT](https://www.sap.com/products/iot-data-services.html)
3. [HELM](https://helm.sh) Runtime
4. [Docker](https://www.docker.com)
5. Docker registry (or [Docker Hub](https://hub.docker.com) subscription)
6. An Edge Node with [k3s](https://k3s.io/) runtime installed
7. Edge Gateway Service installed in the Edge Node
8. Persistence Service installed in the Edge Node
9. [dft](https://github.com/SAP-Samples/iot-edge-samples/tree/main/IoT_Edge/dft/) sample installed in the Edge Node

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
- **alternateId:**	pressure
- **name:**	pressure
- **properties:**

| Property Name 	| Property Type 	|
|:-------------:	|:-------------:	|
| pressure 	| float 	|
---


2. 	Create the sensor type
- **sensorType name:**			Pressure_ST
- **alternateId:**     	912
- **capabilities:**

| Capability	| Type 	|
|:-------------:	|:-------------:	|
| pressure 	| measure 	|
---

3. Get your _gatewayId_
4. Create a _Device_ into your _gateway_ with:
- **alternateId:** pressureMachine
- **sensor:** implements _SAM_ST_ sensorType with _alternateId_ and _name_ --> pressureSensor


## Download and Installation

### Download the sample app

    git clone https://github.com/SAP-Samples/iot-edge-samples.git
    cd iot-edge-samples

### Build and push the Docker Image

In this sample I'm using docker.io as Registry, some commands could be differently accordingly with the registry configuration.

Login in your docker registry and type the credentials once required.

    docker login docker.io

Build the docker image locally, supposing the version of your image is 1.0.0

    cd Iot_Edge/node-red-iot-addon/docker-node-red-iot-addon
    docker build -t {YOUR DOCKER HUB USERNAME HERE}/node-red-iot-addon:1.0.0 .

Push the image into the registry:

    docker push -a {YOUR DOCKER HUB USERNAME HERE}/node-red-iot-addon

### Customize the HELM chart project and build the tgz solution

Open the file _node-red-iot-addon/chart-node-red-iot-addon/noderediot/values.yaml_

Change the following values accordingly with your Docker Image:
- image.name
- image.tag
---

Open the file _node-red-iot-addon/chart-node-red-iot-addon/noderediot/Chart.yaml_

Change the following values accordingly with your Docker Image:
- appVersion

Lint the project and build the solution:

    cd node-red-iot-addon/chart-node-red-iot-addon/noderediot
    helm lint
    helm package .

Verify that a file **noderediotaddon-_{VERSION OF THE PROJECT}_.tgz** has been correctly created

### Deploy the HELM chart

Open the Policy Service and create a new [Extension Service](https://help.sap.com/viewer/247022ddd1744053af376344471c0821/LATEST/en-US/7fffcdd2c9464b7c9e15811dc10e94f3.html). Use as solution descriptor the HELM chart built in [this other section](#customize-the-helm-chart-project-and-build-the-tgz-solution)

For the _Service Bindings_ option select **Edge Gateway Service** and **Persistence Service**.

### Deploy the service

Search your node in the list of nodes and Deploy the created Extension Service into your node.
As deployment parameter specify the used port for the data ingestion. Standard for REST protocol is _8910_

## Test the service

Open your and navigate to _<Node External IP Address>:16008_:

Node Red UI will be shown.

* Check the _Dashboad_
* Start the simulator
