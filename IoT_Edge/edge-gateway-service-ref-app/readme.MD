# Sample service to be used for testing the Edge Gateway Service behavior
This folder contains a sample extension-service that can be used for testing the Edge Gateway Service deploy. 
The extension service will work as a proxy, exposing on a plain transport a set of REST APIs that allows to the client to recall the corresponding Edge Gateway Service endPoints (both the REST APIs and the MQTT Bus APIs).
You can find a Postman API collection in this folder (look at the file `edge-gateway-service-ref-app.postman_collection.json`) that can be used for invoking the REST APIs exposed by the extension service.
The service is written in golang; there are the Docker file, for being able to generate the docker image, and the helm chart.

# Service's functionalities
The go service implements the following functionalities:
* It starts with a default configuration file (look at the config.yaml file in the `app/internal/config` folder) for being able to communicate with the default Edge Gateway Service endPoints
* Overwrites the default configuration with new binding info, in case the property `iot.edge.bindings` of the `helm\values.yaml` is overwritten once the helm chart is installed
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

# How to build and deploy the extension service via the SAP IoT EdgeExtension UI
For deploying this extension service you must follow these steps:
* Create the docker image
  * Go to the `app` sub folder and open a shell on this folder
  * Build the extension service docker image via the following command: `docker build -t <repo/image:tag> .`
  * Push the docker image on the target repo via the following command: `docker push <repo/image:tag>`
* Update the helm chart for downloading the expected docker image
  * Go to the `helm/values.yaml` file and update the `image.name` and the `image.tag` properties consistently
* Update the extension service helm chart changing the values required for uploading the extension service with a unique name and version on the SAP IoT EdgeExtension UI
  * Go to the `helm/Chart.yaml` file and update the `name` and the `version` properties as you want
* Package your solution into the expected .tgz file
  * Open a shell on this folder
  * Run the following command to validate the solution: `helm lint ./helm`
  * Run the following command to package the solution: `helm package ./helm`
* Configure your docker registry on the SAP IoT EdgeExtension UI (if you need further info you can look at the SAP IoT EdgeExtension official documentation)
* Upload the extension service via the SAP IoT EdgeExtension UI and bind it to the Edge Gateway Service (if you need further info you can look at the SAP IoT EdgeExtension official documentation)
* Optionally, to allow to deploy the extension service customizing the default service port (9000) and the default binding to the Edge Gateway Service (that uses the Edge Gateway Service default ports), after having uploaded the extension service you can create two Deployment Configuration Parameters:
  * `iot.edge.bindings`, of type string, that can be used for overwriting the default binding to the Edge Gateway Service (e.g. via a property like this: `{"bindings":[{"type":"MQTT","id":"sap-iot-gateway","api":"MQTT API URL","url":"tcp://edge-gateway-service.sap-iot-gateway:61658"},{"type":"REST","id":"sap-iot-gateway","api":"REST API URL","url":"http://edge-gateway-service.sap-iot-gateway:61660"}]}`)
  * `service.port`, of type int, that can be used for overwritting the default service port
