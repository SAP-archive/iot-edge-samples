# Edge Custom Service Sample

## Overview
This sample demonstrates how to implement custom logic with an external module intercommunication. The service integrates the usage of the Edge Service Configuration object to support dynamic configurations. It is using an external python module to compute make some computation, SAP IoT Edge Message bus to exchange messages between the JAVA codebase and the python module (such as the configuration), SAP IoT offline operations to publish new endpoints at the edge by leveraging the integrated Netty Server.	

## Product Documentation

Product Documentation for SAP Edge Services is available as follows:

[SAP Edge Services, cloud edition](https://help.sap.com/viewer/p/EDGE_SERVICES)

### Description

The purpose of this sample is to implement a custom filtering on the ingested measurements, to reduce the network traffic (save costs!) and forward to the cloud only the required data. 

In this sample we are blocking the original measurements and forwarding to the cloud only the value of the SNR (signal to noise ratio), wich is computed by leveraging some additional custom APIs published at the edge, inside an external module written in Python.

The measurements are consumed and forwarded to the cloud by using the Edge Messagebus capability.

### Deploying this sample

This sample is packaged as an OSGI bundle. It is deployed to SAP Edge Services, cloud edition using a Custom Service defined within the Policy Service of SAP Edge Services.

## Requirements

The following must be installed for this sample:
1. Java JDK 1.8 or above (https://www.java.com/en/download/)
2. Apache Maven (https://maven.apache.org/download.cgi)
3. Git command line tool (https://git-scm.com/downloads)
4. SAP Edge Services (Cloud or On-premise edition)
5. SAP IoT Edge Platform

### SAP Edge Services, cloud edition

For cloud edition, a working SAP IoT Edge Platform is required, with one SAP Edge Services core service (such as Persistence Service) installed.

The following needs to be setup on SAP IoT as a corect data ingestion

1. 	Create the capabilities
- **capabilityAlternateId:**	power
- **properties:**
		
| Property Name 	| Property Type 	|
|:-------------:	|:-------------:	|
| power 	| float 	|
---
- **capabilityAlternateId:**    pressure
- **properties:**
		
| Property Name 	| Property Type 	|
|:-------------:	|:-------------:	|
| pressure 	| float 	|
---
- **capabilityAlternateId:** snr
- **properties:**

| Property Name 	| Property Type 	|
|:-------------:	|:-------------:	|
| snr 	| float 	|

2. 	Create the sensor type
- **sensorType name:**			packagingSensorType
- **sensorTypeAlternateId:**     	1001
		
3. Add all the capabilities into the **_packagingSensorType_**

## Download and Installation

### Download the sample app
```json
git clone https://github.com/SAP/iot-edge-services-samples.git
cd iot-edge-services-samples
cd custom-services-additional-apis-messagebus
```

### Download the SAP Edge Service dependencies bundles and add to Maven

#### SAP Edge Services Configuration Service

1. Ensure that from the Policy Service, the Persistence Service is installed on your gateway.
2. Access the files of the device running the SAP IoT Edge Platform
3. cd /gateway_folder/custombundles
4. Copy the file ConfigService-3.2002.0.jar to the project root of this sample.
   NOTE: the version number may change, in which case, the version number in the pom.xml file will need to be updated
5. From root directory of this sample, execute the following command:
```json
mvn install:install-file -Dfile=ConfigService-3.2002.0.jar -DgroupId=com.sap.iot.edgeservices -DartifactId=ConfigService -Dversion=3.2002.0 -Dpackaging=jar
```
    NOTE: if the version number has changed, substitute 3.1912.0 in the above command for the appropriate version number as found in the filename.

### Customize the source

You can change the parameters dynamically.
Open the file
src\main\resources\defaultConfiguration.json
create and deploy a new configuration for this service within the Policy Service.
in the body of the configuration put a JSON that contains the parameter that you would like to change. The change is not incremental.

#### SAP Edge Services, cloud edition

By default, the sample works directly with SAP Edge Services, cloud edition and nothing needs to be changed.

#### SAP Edge Services, on-premise edition

This example, with some modifications, could work with SAP Edge Services, on-premise edition.

### Compile and Package

1. Open a shell / command prompt (on Windows as Administrator) and navigate to the `custom-services-additional-apis-messagebus/<project name>` directory.
2. For each project edit the provided pom.xml and ensure that the version number of the inherited services (ConfigService and SAP IoT Edge Platform services) jar files matches. If it does not match, change the numbers in the pom.xml

```json
        <dependency>
            <groupId>com.sap.iot.edgeservices</groupId>
            <artifactId>ConfigService</artifactId>
            <version>3.2002.0</version>
            <scope>provided</scope>
        </dependency>
```
```json
        <gateway.version>4.51.0</gateway.version>
```
```json
        <iot.service.version>4.51.0</iot.service.version>
```

3. For each project, run following command to compile and build the package:
```json
mvn clean install
```
4. Verify that the file <projectName>-1.0.0.jar are created in the /target folder.

### Activate components

You need to activate the external operations as described here: https://help.sap.com/viewer/643f531cbf50462c8cc45139ba2dd051/Cloud/en-US/a6204032ad6e4377be9e2fbe89cddf6b.html

Activate the Edge Messagebus.

It's an ActiveMQ broker available for every SAP Edge Platform, not just MQTT, disabled by default.
- Open the file <Edge Platform folder>/config/config*.xml and put the following xml node (please note that for MQTT it's already inside the file, so just skip this operation):
```json
<cnf:amq> 
  <cnf:brokerName>gateway-mqtt</cnf:brokerName> 
  <cnf:connectors>
    <cnf:server> 
      <cnf:transportConnectors>
        <cnf:transportConnector name="mqtt" uri="mqtt://127.0.0.1:61618?transport.soTimeout=60000"/>
        <cnf:transportConnector name="mqtt+mutualAuth" uri="mqtt+nio+ssl://127.0.0.1:61628?wantClientAuth=true&amp;transport.soTimeout=60000"/>
        <cnf:transportConnector name="nio" uri="nio://127.0.0.1:61617?transport.soTimeout=60000"/>
        <cnf:transportConnector name="tcp-connector" uri="tcp://127.0.0.1:61627?transport.soTimeout=60000"/>
        <cnf:transportConnector name="mqtt-bus-connector" uri="mqtt+nio+ssl://127.0.0.1:61629?needClientAuth=true&amp;transport.soTimeout=60000"/>
      </cnf:transportConnectors>
    </cnf:server>
  </cnf:connectors>
</cnf:amq>
```

- Open the file <Edge Platform folder>/configuration/config.ini and ensure that the following services are started:
```json
plugins/gateway-bus-wrapper-mqtt@6:start,\
plugins/amq-activator@5:start,\
```
#### Enable / Disable Edge Messagebus (no restart required):
1) Add (or modify) a Custom Property for the Edge Platform:
 BUS_MEASURES_FLOW
2) Use "OnlyBus" to turn off completely the ingestion to the cloud, or "CloudAndBus" to enable the forwarding of the measurements to the Bus, without interrupting the standard flow towards the Cloud.

#### Notes about data ingestion at the Edge and Cloud ingestion:

- Output Topic
Here the description of the topic where the Edge Platform publishes the measurements for the Edge Components (cloud forwarding):
iot/edge/v1/tenant/<tenantId>/gateway/<gatewayId>/measures/out
Remark: It works also with "OnlyBus" flag active

- Input Topic
Here the description of the topic from which the Edge Platform listens for the measurements published by the Edge Components:
iot/edge/v1/tenant/<tenantId>/gateway/<gatewayId>/measures/in

-----


### Deploy

#### SAP Edge Services, cloud edition

1. Use the SAP Edge Services Policy service, navigate to the Services list and create new custom services.
2. Use "EXTERNALFLOW" for the event topic field (or what you have defined at line 46 of the file 2. Use "EXTERNALFLOW" for the event topic field (or what you have defined at line 6 of the file ./external-flow-configuration/src/main/java/com/sap/iotservices/gateway/interceptor/ExternalFlowActivator.java for the project external-flow-configuration; use any other unique value for the other projects
3. Use the jar file inside the folder /targetof each single project.
4. Save it.
5. Go in the Gateways and Group of Gateways list and search for your gateway in the list
6. Deploy the created custom services in this order to respect the nested dependencies:
- edgeApiExtension-interface
- edgeApiExtension
- extendedOperations
- external-flow-configuration

### Deploy Configurations

If needed you can create and use a custom configuration for the external-flow-configuration service within the Policy Service. The body of the configuration is a JSON object; these are the default values:
```json
{
  "variance": 1,
  "pressureScale": 1.25,
  "ingestionEnabled": true,
  "filterMeasurements": false,
  "filterCalculation": false,
  "externalConfigurationTopic": "configuration",
  "configurationFile": "defaultConfiguration.json",
  "filteredObjects": [
    {
      "capabilityAlternateId": "power",
      "filterType": "msgbus",
      "condition": "AND"
    },
    {
      "capabilityAlternateId": "snr",
      "filterType": "ingestion",
      "condition": "AND"
    },
    {
      "capabilityAlternateId": "pressure",
      "filterType": "msgbus",
      "condition": "AND"
    },
    {
      "capabilityAlternateId": "pressure_alert",
      "filterType": "ingestion",
      "condition": "AND"
    }
  ]
}
```
If a new configuration is uploaded the old configuration is discarded (it's not incremental). The unspecified values are replaced with the default values.

## Run

### SAP Edge Services, cloud edition

1. Use a supported method to send data to IoT Services Gateway Edge. For example, send data to the SAP IoT Edge Platform MQTT by using a tool like Paho App.
```json
MESSAGE:       {
				"capabilityAlternateId": "power",
				"sensorTypeAlternateId": "1001",
				"sensorAlternateId": "packaging",
				"measures": [{
					"power": 131
				}]
			}
```
To actually see the snr values created correctly, read the measurements inside the other capability.

2. Connect SAP IoT APIs
3. Check the values of
```json
sensorAlternateId:            packaging
capabilityAlternateId:        power
```

```json
sensorAlternateId:            packaging
capabilityAlternateId:        pressure
```
and
```json
sensorAlternateId:            packaging
capabilityAlternateId:        snr
```

Verify how the values change when you enable or disable the data ingestion or the filtering and while changing the behavior inside the python external module.

## How to obtain support

These samples are provided "as-is" basis with detailed documentation on how to use them.


## Copyright and License

Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.

License provided by [SAP SAMPLE CODE LICENSE AGREEMENT](https://github.com/SAP-samples/iot-edge-services-samples/blob/master/predictive-python/LICENSE)
