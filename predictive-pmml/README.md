# Predictive Service (PMML) Sample

## Overview
The implemented scenario is documented [here](https://blogs.sap.com/2019/11/05/implement-predictive-analytics-at-the-edge/)

## Product Documentation

Product Documentation for SAP Edge Services is available as follows:

[SAP Edge Services, cloud edition](https://help.sap.com/viewer/p/EDGE_SERVICES)

### Description

On an interval, this execute a prediction based on the KNN algorithm, to identify if the measured color is an expected color.

The predictions (both punctual and a global index) values are then fed back into the IoT Services Gateway Edge via REST as a different capability. This capability is then visible in the IoT Services Cockpit.

### Deploying this sample

This sample is packaged as an OSGI bundle. It is deployed to SAP Edge Services, cloud edition using a Custom Service defined within the Policy Service of SAP Edge Services.

## Requirements

The following must be installed for this sample:
1. Java JDK 1.8 or above (https://www.java.com/en/download/)
2. Apache Maven (https://maven.apache.org/download.cgi)
3. Git command line tool (https://git-scm.com/downloads)
4. SAP Edge Services (Cloud or On-premise edition)
4. Java PMML Libraries

### SAP Edge Services, cloud edition

For cloud edition, a working IoT Services Gateway Edge (REST) is required, with the SAP Edge Services Persistence Service installed.

The following needs to be setup on IoT Services as a data model for the sample to permit the PMML model to analyze correctly the data and to send the results back into the system. To create the entries, login to the IoT Services cockpit with the same tenant that your gateway uses.

1. 	Create the capabilities
- **capabilityAlternateId:**	color
- **properties:**
		
| Property Name 	| Property Type 	|
|:-------------:	|:-------------:	|
| R 	| float 	|
| G 	| float 	|
| B 	| float 	|
---
- **capabilityAlternateId:**    color prediction
- **properties:**
		
| Property Name 	| Property Type 	|
|:-------------:	|:-------------:	|
| label 	| string 	|
| neighbor1 	| float 	|
| neighbor2 	| float 	|
| neighbor3 	| float 	|
---
- **capabilityAlternateId:** validity color score
- **properties:**

| Property Name 	| Property Type 	|
|:-------------:	|:-------------:	|
| index 	| float 	|

2. 	Create the sensor type
- **sensorType name:**			color sensor type
- **sensorTypeAlternateId:**     	255
		
3. Add all the capabilities into the **_color sensor type_** Sensor Type

## Download and Installation

### Download the sample app
```json
git clone https://github.com/SAP/iot-edge-services-samples.git
cd iot-edge-services-samples
cd predictive-model-pmml
```

### Download the SAP Edge Service dependencies bundles and add to Maven

#### SAP Edge Services Persistence Service

1. Ensure that from the Policy Service, the Persistence Service is installed on your gateway.
2. Access the files of the device running the IoT Services Gateway Edge
3. cd /gateway_folder/custombundles
4. Copy the file PersistenceService-3.1912.0.jar to the project root of this sample.
   NOTE: the version number may change, in which case, the version number in the pom.xml file will need to be updated
5. From root directory of this sample, execute the following command:
```json
mvn install:install-file -Dfile=PersistenceService-3.1912.0.jar -DgroupId=com.sap.iot.edgeservices -DartifactId=PersistenceService -Dversion=3.1912.0 -Dpackaging=jar
```
    NOTE: if the version number has changed, substitute 3.1912.0 in the above command for the appropriate version number as found in the filename.
	
#### SAP Edge Services Configuration Service

1. Ensure that from the Policy Service, the Persistence Service is installed on your gateway.
2. Access the files of the device running the IoT Services Gateway Edge
3. cd /gateway_folder/custombundles
4. Copy the file ConfigService-3.1912.0.jar to the project root of this sample.
   NOTE: the version number may change, in which case, the version number in the pom.xml file will need to be updated
5. From root directory of this sample, execute the following command:
```json
mvn install:install-file -Dfile=ConfigService-3.1912.0.jar -DgroupId=com.sap.iot.edgeservices -DartifactId=ConfigService -Dversion=3.1912.0 -Dpackaging=jar
```
    NOTE: if the version number has changed, substitute 3.1912.0 in the above command for the appropriate version number as found in the filename.

### Customize the source

You can change the pmml model and some configuration parameters dynamically.
Open the file
src\main\resources\defaultConfiguration.json
create and deploy a new configuration for this service within the Policy Service.
in the body of the configuration put a JSON that contains the parameter that you would like to change. The change is not incremental.

#### SAP Edge Services, cloud edition

By default, the sample works directly with SAP Edge Services, cloud edition and nothing needs to be changed.

#### SAP Edge Services, on-premise edition

This example, with some modifications, could works with SAP Edge Services, on-premise edition. Some of them are already controlled with the flag _**CLOUD_EDGE_SERVICES**_

Edit the file
```json
src\main\java\com\sap\iot\edgeservices\predictive\sample\custom\PredictValue.java
```
In the definition, set CLOUD_EDGE_SERVICES = false (line 49)
```json
  private static Boolean CLOUD_EDGE_SERVICES = false;  //SET TO false for ON-PREMISE
```

### Compile and Package

1. Open a shell / command prompt (on Windows as Administrator) and navigate to the `predictive-pmml` directory.
2. Edit the provided pom.xml and ensure that the version number of the Persistence Service and ConfigService jar files matches the JSON. If it does not match, change the numbers in the pom.xml
```json
        <dependency>
            <groupId>com.sap.iot.edgeservices</groupId>
            <artifactId>PersistenceService</artifactId>
            <version>3.1912.0</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>com.sap.iot.edgeservices</groupId>
            <artifactId>ConfigService</artifactId>
            <version>3.1912.0</version>
            <scope>provided</scope>
        </dependency>
```
3. Run following command to compile and build the package:
```json
mvn clean install
```
4. Verify that the file PredictiveModel-1.0.0.jar was created in the /target folder.

### Satisfy the dependencies

The following inherited dependencies must be satisfied by installing the OSGi versions of the following jar files:
-	pmml-agent-1.4.13.jar
-	org.eclipse.persistence.core-2.7.4.jar
-	org.eclipse.persistence.moxy-2.7.4.jar
-	jaxb-osgi-2.3.2.jar
-	pmml-model-1.4.13.jar
-	pmml-model-metro-1.4.13.jar
-	pmml-model-moxy-1.4.13.jar
-	commons-math3-3.6.1.jar
-	pmml-evaluator-1.4.13.jar


### Deploy

#### SAP Edge Services, cloud edition

1. Use the SAP Edge Services Policy service, navigate to the Services list and create a new custom service.
2. Use "RGBSERVICE" for the event topic field (or what you have defined at line 56 of the file src\main\java\com\sap\iot\edgeservices\predictive\sample\PredictiveModule.java
3. Use the file /target/PredictiveModel-1.0.0.jar file.
4. Save it.
5. Go in the Gateways and Group of Gateways list and search for your gateway in the list
6. Deploy the created custom service

### Deploy Configurations

If needed you can create and use a custom configuration for the service within the Policy Service. The body of the configuration is a JSON object; these are the default values:
```json
{
  "predictionSensorTypeAlternateId": "255",
  "capabilityAlternateId": "color",
  "predictionSensorAlternateId": "color sensor",
  "predictionCapabilityAlternateId": "color prediction",
  "predictionIndexCapabilityAlternateId": "validity color score",
  "edgePlatformRestEndpoint": "http://localhost:8699/measures/",
  "plantColorOutOfRangeLimit": "100",
  "plantScalingForOutOfRange": "1.25",
  "analysisFrequency": 10000,
  "pmmlFileContentAsString": ""
}
```
If a new configuration is uploaded the old configuration is discarded (it's not incremental). The unspecified values are replaced with the default values.

## Run

### SAP Edge Services, cloud edition

1. Use a supported method to send data to IoT Services Gateway Edge. For example, send data to the SAP IoT Services Gateway Edge using a tool like Postman.
```json
URL:        http://<server>:8699/measures/colordevice
HEADERS:    Content-type: application/json
BODY:       {
				"capabilityAlternateId": "color",
				"sensorTypeAlternateId": "255",
				"sensorAlternateId": "color sensor",
				"measures": [{
					"R": "235",
					"G": "64",
					"B": "52"
				}]
			}
```
To actually see the predicted values created correctly, read the measurements inside the other capabilities.

2. Login to the IoT Services Cockpit
3. Navigate to your gateway
4. select the device for color device
5. graph the results for
```json
sensorAlternateId:            color sensor
capabilityAlternateId:        color prediction
```
and
```json
sensorAlternateId:            color sensor
capabilityAlternateId:        validity color score
```

## How to obtain support

These samples are provided "as-is" basis with detailed documentation on how to use them.


## Copyright and License

Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.

License provided by [SAP SAMPLE CODE LICENSE AGREEMENT](https://github.com/SAP-samples/iot-edge-services-samples/blob/master/predictive-pmml/LICENSE)
