# Persistence Service Aggregation Sample

## Overview
This persistence service aggregation sample can be used to implement custom queries using the SAP Edge Services Persistence Service Java API. This sample implements a MAX aggregation. This sample works with both SAP Edge Services, cloud edition and SAP Edge Services, on-premise edition.

If using Edge Services, cloud edition, this sample assumes the IoT Services Gateway Edge is configured for REST ingestion. It consumes the standard IoT Services model for Temperature. If the IoT Services Gateway Edge is configured for another protocol (ie MQTT), then some features will not work (for example sending aggregated data back into Gateway Edge over REST).

This sample assumes the user has a working knowledge of SAP Edge Services and is comfortable programming in Java.

## Product Documentation

Product Documentation for SAP Edge Services is available as follows:

[SAP Edge Services, cloud edition](https://help.sap.com/viewer/p/EDGE_SERVICES)

[SAP Edge Services, on-premise edition](https://help.sap.com/viewer/p/SAP_EDGE_SERVICES_OP)

### Description

On an interval, this persistence service aggregation sample queries the stored readings in the Persistence Service. Any new temperature received since the timestamp of the last query is aggregated to return the MAX value received.

If using SAP Edge Services, cloud edition, then the aggregated (MAX) value is then fed back into the IoT Services Gateway Edge via REST as a new capability. This capability is then visible in the IoT Services Cockpit.

### Deploying this sample

This sample is packaged as an OSGI bundle. It is deployed to SAP Edge Services, cloud edition using the IoT Services cockpit. It is deployed to SAP Edge Services, on-premise edition by placing the OSGI bundle in the EdgeServicesRuntime/plugins folder and modifying the EdgeServicesRuntime/configuration/config.ini file.

## Requirements

The following must be installed for this sample:
1. Java JDK 1.8 or above (https://www.java.com/en/download/)
2. Apache Maven (https://maven.apache.org/download.cgi)
3. Git command line tool (https://git-scm.com/downloads)
4. SAP Edge Services (Cloud or On-premise edition)

### SAP Edge Services, cloud edition

For cloud edition, a working IoT Services Gateway Edge (REST) is required, with the SAP Edge Services Persistence Service installed.

The following needs to be setup on IoT Services as a data model for the sample to send the results back into the system. To create the entries, login to the IoT Services cockpit with the same tenant that your gateway uses.

1. Create the capability
	 - capabilityAlternateId	PSMTResult
	 - property					PSMTResult
	 - type 					float
	 - default					N/A
2. Create the sensor type
	 - sensorType name			PSMT
	 - sensorTypeAlternateId     1002
3. Add the PSMTResult capability to the PSMT Sensor Type

### SAP Edge Services, on-premise edition (3.0 FP02 or newer)

For on-premise edition, a working install of the Persistence Service and Streaming Service is required. These are installed together as described in the SAP Edge Services, on-premise edition online documentation.

## Download and Installation

### Download the sample app
```json
git clone https://github.com/SAP/iot-edge-services-samples.git
cd iot-edge-services-samples
cd persistence-aggregation-max-temp
```

### Download the Persistence Service bundle and add to Maven

#### SAP Edge Services, cloud edition

1. Ensure that from the Policy Service, the Persistence Service is installed on your gateway.
2. Access the files of the device running the IoT Services Gateway Edge
3. cd /gateway_folder/plugins
4. Copy the file osgi-bundle-PersistenceService-3.1808.1.jar to the project root of this sample.
   NOTE: the version number may change, in which case, the version number in the pom.xml file will need to be updated
5. From root directory of this sample, execute the following command:
```json
mvn install:install-file -Dfile=osgi-bundle-PersistenceService-3.1808.1.jar -DgroupId=com.sap.iot.edgeservices -DartifactId=PersistenceService -Dversion=3.1808.1 -Dpackaging=jar
```
    NOTE: if the version number has changed, substitute 3.1808.1 in the above command for the appropriate version number as found in the filename.

#### SAP Edge Services, on-premise edition

1. Follow instructions in the Streaming Service and Persistence Service guides to download and install Streaming Service and Persistence Service.
3. Once installed, cd EdgeServicesRuntime/plugins
4. Copy the file PersistenceService-3.2.0.jar to the project root of this sample.
   NOTE: the version number may change, in which case, the version number in the pom.xml file will need to be updated
5. From root directory of this sample, execute the following command:
```json
mvn install:install-file -Dfile=PersistenceService-3.2.0.jar -DgroupId=com.sap.iot.edgeservices -DartifactId=PersistenceService -Dversion=3.2.0 -Dpackaging=jar
```
    NOTE: if the version number has changed, substitute 3.2.0 in the above command for the appropriate version number as found in the filename.

### Customize the source

To see more debug output, edit the file:
src\main\java\com\sap\iot\edgeservices\persistence\sample\PersistenceSampleActivator.java
modify the following line (line 53) from "INFO" to "DEBUG"
```json
    public static String LOG_LEVEL_STRING = "INFO";
```

#### SAP Edge Services, cloud edition

By default, the sample works directly with SAP Edge Services, cloud edition and nothing needs to be changed.

#### SAP Edge Services, on-premise edition

When data is inserted into the Persistence Service, it will be accessed differently between cloud edition and on-premise edition. The current sample uses the cloud edition sample data. To change it to on-premise edition:

Edit the file
```json
src\main\java\com\sap\iot\edgeservices\persistence\sample\custom\CalculateMaxTemperature.java
```
In the constructor of this class, set CLOUD_EDGE_SERVICES = false (line 33)
```json
  private static Boolean CLOUD_EDGE_SERVICES = false;  //SET TO false for ON-PREMISE
```

### Compile and Package

1. Open a shell / command prompt (on Windows as Administrator) and navigate to the `persistence-aggregation-max-temp` directory.
2. Edit the provided pom.xml and ensure that the version number of the Persistence Service jar file matches the JSON. If it does not match, change the number in the pom.xml
```json
        <dependency>
            <groupId>com.sap.iot.edgeservices</groupId>
            <artifactId>PersistenceService</artifactId>
            <version>3.1808.1</version>
            <scope>provided</scope>
        </dependency>
```
3. Run following command to compile and build the package:
```json
mvn clean install
```
4. Verify that the file PersistenceSampleMaxTemperature-1.0.0.jar was created in the /target folder.

### Deploy

#### SAP Edge Services, cloud edition

1. Use the IoT Services cockpit to navigate to your gateway.
2. In Bundle Management, upload the /target/PersistenceSampleMaxTemperature-1.0.0.jar file.

#### SAP Edge Services, on-premise edition

1. Edit the file:
```json
EdgeServicesRuntime/configuration/config.ini
```
The last two lines of the file should look like this:
```json
  plugins/StreamingService-3.2.0.jar@5:start,\
  plugins/PersistenceSampleMaxTemperature-1.0.0.jar@5:start
```
NOTE: a backslash was added to the previous last line and there must not be any space after that backslash.
2. Copy the /target/PersistenceSampleMaxTemperature-1.0.0.jar file to the EdgeServicesRuntime/plugins folder.
3. Restart Edge Services, on-premise

## Run

### SAP Edge Services, cloud edition

1. Use a supported method to send data to IoT Services Gateway Edge. For example, send data to the IoT Services Gateway Edge using a tool like Postman.
```json
URL:        http://<server>:8699/measures/fridge2
HEADERS:    Content-type: application/json
BODY:       {
              "sensorTypeAlternateId":"0",
              "capabilityAlternateId":"1",
              "measures":[["120"]],
              "sensorAlternateId":"test1234"
            }
```
To actually see the MAX function working correctly, send in multiple samples within 10 seconds for the sample to choose a maximum.

2. Login to the IoT Services Cockpit
3. Navigate to your gateway
4. select the device for fridge2
5. graph the results for
```json
sensorType name:            PSMT
capabilityAlternateId:      PSMTResult
```

### SAP Edge Services, on-premise edition

1. Modify the Streaming Service to publish to Persistence. Using the Streaming Service Edge Console, modify the HttpProtocolPlugin configuration and set "PUBLISH_TO_PERSISTENCE=true", and "AUTHENTICATION_TYPE=None".

2. Use a supported method to send data to the Temperature sensor profile in SAP Edge Services Streaming Service. For example, send data to the Streaming Service using a tool like Postman.
```json
URL:        https://<server>:443
HEADERS:    Content-type: application/json
BODY:       {
                "deviceId": "fridge2",
                "deviceTag": "internal",
                "readings": [
                    {
                        "sensorProfileName": "Temperature",
                        "readingValue": 85.9
                    }
                ]
            }
```
To actually see the MAX function working correctly, send in multiple samples within 10 seconds for the sample to choose a maximum.

3. Alternatively, to send in data using the Streaming Service Edge Console, create a sensor profile with the name "Temperature" and use the "Live Sensors" feature to send in data using the "Emulated Device".

4. View the EdgeServicesRuntime log file (EdgeServicesRuntime\logs\sapedgeservices-stdout.yyyy-mm-dd.log) to watch INFO or DEBUG messages.


## How to obtain support

These samples are provided "as-is" basis with detailed documentation on how to use them.


## Copyright and License

Copyright (c) 2018 SAP SE or an SAP affiliate company. All rights reserved.

License provided by [SAP SAMPLE CODE LICENSE AGREEMENT](https://github.com/SAP/iot-edge-services-samples/tree/master/persistence-aggregation-max-temp/LICENSE)
