# SAP Edge Gateway Service Reference Application

## Overview
This folder contains a sample extension-service that can be used for testing the SAP Edge Gateway Service behavior.

The extension service will work as a proxy, exposing on an HTTP plain transport a set of REST APIs that allow to the client to recall the corresponding Edge Gateway Service endPoints (both the REST APIs and the MQTT Bus APIs).

You can find a Postman API collection in this folder (look at the file `edge-gateway-service-ref-app.postman_collection.json`) that can be used for invoking the REST APIs exposed by the extension service.

The service is written in golang; there are the Docker file, for being able to generate the docker image, and the helm chart.

## Product Documentation
Product Documentation for SAP IoT is available as follows:
>[SAP IoT HELP Portal](https://help.sap.com/viewer/p/SAP_IoT)

## Description (service's functionalities)
The service implements the following functionalities:
* It starts with a default configuration file (look at the config.yaml file in the `app/internal/config` folder) for being able to communicate with the default Edge Gateway Service endPoints
* Overwrites the default configuration with new binding info, in case the property `service.bindings` of the `helm\values.yaml` is overwritten once the helm chart is installed
* Connects to the Edge Gateway Service MQTT Bus and subscribes to the measures egress topic (`iot/edge/v1/sap-iot-gateway/measures/out`): all the messages received from the Bus egress topic will be cached on the app
* Publish an HTTP REST endPoint on the port 9000 (the default value can be overridden through the property `service.port` of the `helm\values.yaml` once the helm chart is installed)
* Exposes a set of REST APIs that can be used for recalling the corresponding Edge Gateway Service endPoints (both the REST APIs and the MQTT Bus APIs). Here a quick description of the exposed APIs:
  * GET `/capabilities`: recalls the corresponding Edge Gateway Service GET `/capabilities` API
  * GET `/capabilities/{capabilityId}`: recalls the corresponding Edge Gateway Service GET `/capabilities/{capabilityId}` API
  * GET `/devices`: recalls the corresponding Edge Gateway Service GET `/devices` API
  * GET `/devices/{deviceId}`: recalls the corresponding Edge Gateway Service GET `/devices/{deviceId}` API
  * POST `/devices/commands`: recalls the corresponding Edge Gateway Service POST `/devices/commands` API
  * GET `/gateways`: recalls the corresponding Edge Gateway Service GET `/gateways` API
  * GET `/gateways/{gatewayId}`: recalls the corresponding Edge Gateway Service GET `/gateways/{gatewayId}` API
  * GET `/sensors`: recalls the corresponding Edge Gateway Service GET `/sensors` API
  * GET `/sensors/{sensorId}`: recalls the corresponding Edge Gateway Service GET `/sensors/{sensorId}` API
  * GET `/sensorTypes`: recalls the corresponding Edge Gateway Service GET `/sensorTypes` API
  * GET `/sensorTypes/{sensorTypeId}`: recalls the corresponding Edge Gateway Service GET `/sensorTypes/{sensorTypeId}` API
  * GET `/bus/measures`: empties the cache of the messages received from the Edge Gateway Service MQTT Bus egress topic
  * POST `/bus/measures`: sends a measure (the body of the POST) on the Mqtt Bus ingress topic (`iot/edge/v1/sap-iot-gateway/measures/in`)
* Exposes some APIs to allow to READ and UPDATE its configuration:
  * GET `/config`: retrieves the current configuration
  * PUT `/config`: updates the current configuration
* Exposes some APIs used on Kubernetes to check if the service is ready and up and running:
  * GET `/ready`: checks the service is ready
  * GET `/live`: checks the service is alive
* Exposes an API to check Mqtt Bus connection/subscription status:
  * GET `/monitoring/busConnectionStatus`: checks the application is connected to the Edge Gateway Service Bus and subscribed to the measures egress topic

## Code Overview
If you are interested into following the code behavior and understand how the service works, jump to the app entry point at [main.go](app/cmd/main.go) and start following the code from there.

### How To consume Edge Gateway Service MQTT APIs
For understanding how to use kubernetes token for connecting to the Edge Gateway Service MQTT Bus, subscribe to the egress topic, or publish some measures to the ingress topic go to the file [mqttBusClient.go](app/internal/apis/mqttBusClient.go)

### How To consume Edge Gateway Service REST APIs
For understanding how to use kubernetes token for consuming the Edge Gateway Service REST APIs go to the file [apiUtils.go](app/internal/apis/apiUtils.go)

## Deploying this sample

### Requirements
The following requirements must be satisfied for being able to deploy and use this sample:
1. [Git](https://git-scm.com/downloads) command line tool
2. [Docker](https://www.docker.com)
3. Docker registry (or [Docker Hub](https://hub.docker.com) subscription)
4. An HTTP client for invoking the HTTP APIs exposed by the extension (e.g. [Postman](https://www.postman.com))
5. A SAP IoT Device Connectivity instance up and running
6. An Edge Node with [k3s](https://k3s.io/) or [k8s](https://kubernetes.io/) runtime installed
7. Edge Gateway Service installed in the Edge Node
8. Access and familiarity with SAP IoT Device Connectivity APIs

### Preliminary Operations
There are some preliminary operations that are undocumented here that the user has to complete to be able to make the base sample up and running:
1. Onboard the Edge Node into the Lyfecycle Management component. The documentation could be found [here](https://help.sap.com/viewer/9d5719aae5aa4d479083253ba79c23f9/SHIP/en-US/0a222b9c99d94f56abdcfe27f5be0afa.html)
2. Onboard the Edge Gateway Service into your configured Edge Node

### Download the code
```
git clone https://github.com/SAP-Samples/iot-edge-samples.git
cd edge-gateway-service-ref-app
```

### Build and push the extension service Docker image
Build the extension service Docker image:
* Go to the `app` sub folder and open a shell on this folder
* Build the extension service docker image via the following command: `docker build -t <repository/image:tag> .`
* Push the docker image on the target repository via the following command: `docker push <repository/image:tag>`

### Deploy the extension service HELM chart via the SAP IoT Edge Extensions UI
For deploying the extension service you must follow these steps:
* Update the helm chart for downloading the expected docker image
  * Go to the `helm/values.yaml` file and update the `image.name` and the `image.tag` properties consistently
* Update the helm chart changing the values required for uploading the extension service on the SAP IoT Edge Extensions UI with a unique name and version
  * Go to the `helm/Chart.yaml` file and update the `name` and the `version` properties as you want
* Package the solution into the expected .tgz file
  * Open a shell on this folder
  * Run the following command to validate the solution: `helm lint ./helm`
  * Run the following command to package the solution: `helm package ./helm`
  * Verify that a file **edge-gateway-service-ref-app-<VERSION>.tgz** has been correctly created
* Configure your docker registry on the SAP IoT Edge Extensions UI (if you need further info you can look at the SAP IoT Edge Extensions official documentation)
* Upload the extension service via the SAP IoT Edge Extensions UI and bind it to the Edge Gateway Service (if you need further info you can look at the SAP IoT Edge Extensions official documentation)
* Optionally, to allow to deploy the extension service customizing the default service port (9000) and the default binding to the Edge Gateway Service (that uses the Edge Gateway Service default ports), after having uploaded the extension service you can create two Deployment Configuration Parameters:
  * `service.bindings`, of type string, that can be used for overwriting the default binding to the Edge Gateway Service (e.g. via a property like this: `{"bindings":[{"type":"MQTT","id":"sap-iot-gateway","api":"MQTT API URL","url":"tcp://edge-gateway-service.sap-iot-gateway:61658"},{"type":"REST","id":"sap-iot-gateway","api":"REST API URL","url":"http://edge-gateway-service.sap-iot-gateway:61660"}]}`)
  * `service.port`, of type int, that can be used for overwritting the default service port

## Test the service
Once you have deployed the extension service you can start invoking its REST APIs to check the Edge Gateway Service behavior.

For example, you can invoke the GET `/gateways` API and verify it returns the info related to the binded Edge Gateway Service.

**Pay attention:** if you want to invoke the APIs responsible for returning the IoT Device Model, or for ingesting some data on the MQTT Bus, you must before configure your Device Model on the related SAP IoT Device Connectivity instance.
