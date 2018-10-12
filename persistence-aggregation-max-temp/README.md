# Persistence Service Aggregation Sample

## Description
This is a sample which can be used to implement custom queries using the Persistence Service Java API.  This sample implements a MAX aggregation.  This sample works with both Edge Services, cloud edition and Edge Services, on-premise edition.  

If using Edge Services, cloud edition, this sample assumes you are running IoT Services Gateway Edge configured for REST.  It consumes the standard IoT Services model for Temperature.  If you are running the IoT Services Gateway Edge configured for another protocol (ie MQTT), then some features will not work (for example sending aggregated data back into Gateway Edge over REST).

### What it does?

On an interval, this sample queries the stored readings in the Persistence Service.  Any new temperature received since the timestamp of the last query is aggregated to return the MAX value received.

If using Edge Services, cloud edition, then the aggregated (MAX) value is then fed back into the IoT Services Gateway Edge via REST as a new capability.  This capability is then visible in the IoT Services Cockpit.

### How do I deploy this service?

This sample is packaged as an OSGI bundle. It is deployed to Edge Services, cloud edition using the IoT Services cockpit.  It is deployed to Edge Services, on-premise edition by placing the OSGI bundle in the EdgeServicesRuntime/plugins folder and modifying the EdgeServicesRuntime/configuration/config.ini file.

## Requirements

We assume that Maven is installed in your system. We also assume that you have Edge Services installed and have access to the file system where Persistence Service is installed.

### Edge Services, cloud edition

For cloud edition, you need a working IoT Services Gateway Edge (REST) with the SAP Edge Services Persistence Service installed.

The following needs to be setup on IoT Services as a data model for the sample to send the results  back into the system.  To create the entries, you need to be logged into IoT Services cockpit with the same tenant that your gateways uses as certificates.

1. Create the capability
	 - capabilityAlternateId	PSMTResult
	 - property					PSMTResult
	 - type 					float
	 - default					N/A
2. Create the sensor type
	 - sensorType name			PSMT
	 - sensorTypeAlternateId  	1002
3. Add the PSMTResult capability to the PSMT Sensor Type

### Edge Services, on-premise edition (3.0 FP02 or newer)

For on-premise edition you simply need a working install of the Persistence Service and Streaming Service.  These are installed together as described in the Edge Services, on-premise edition online documentation.

## Download and Installation

### Download the sample app
```json
git clone https://github.com/SAP/iot-edge-services-samples.git
cd iot-edge-services-samples
cd persistence-aggregation-max-temp
```

### Download the Persistence Service bundle and add to Maven

#### Edge Services, cloud edition

1. Ensure that from your Policy Service tenant, you have installed the Persistence Service.
2. Access the files of the device running your IoT Services Gateway Edge
3. cd /gateway_folder/plugins
4. Copy the file osgi-bundle-PersistenceService-3.1808.0.jar to the project root of this sample.
   NOTE: the version number may change, in which case, you will need to change the pom.xml
5. From root directory of this sample, execute the following command:
```json
mvn install:install-file -Dfile=osgi-bundle-PersistenceService-3.1808.0.jar -DgroupId=com.sap.iot.edgeservices -DartifactId=PersistenceService -Dversion=3.1808.0 -Dpackaging=jar
```
    NOTE: if the version number has changed, you must substitute 3.1808.0 in the above command for the appropriate version number as found in the filename.

#### Edge Services, on-premise

1. Follow instructions in the Streaming Service and Persistence Service guides to download and install Streaming Service and Persistence Service.
3. Once installed, cd EdgeServicesRuntime/plugins
4. Copy the file PersistenceService-3.2.0.jar to the project root of this sample.
   NOTE: the version number may change, in which case, you will need to change the pom.xml
5. From root directory of this sample, execute the following command:
```json
mvn install:install-file -Dfile=PersistenceService-3.2.0.jar -DgroupId=com.sap.iot.edgeservices -DartifactId=PersistenceService -Dversion=3.2.0 -Dpackaging=jar
```
    NOTE: if the version number has changed, you must substitute 3.2.0 in the above command for the appropriate version number as found in the filename.

### Customize the source

If you would like to see more debug output, edit the file:
src\main\java\com\sap\iot\edgeservices\persistence\sample\PersistenceSampleActivator.java
modify the following line (line 53) from "INFO" to "DEBUG"
```json
    public static String LOG_LEVEL_STRING = "INFO";
```

#### Edge Services, cloud edition

By default, the sample works directly with Edge Services, cloud edition and nothing needs to be changed.  

#### Edge Services, on-premise

When data is inserted into the Persistence Service, it will be accessed differently between cloud edition and on-premise edition.  The current sample uses the cloud edition sample data.  To change it to on-premise edition:

Edit the file
```json
src\main\java\com\sap\iot\edgeservices\persistence\sample\custom\CalculateMaxTemperature.java
```
In the constructor of this class, set CLOUD_EDGE_SERVICES = false (line 33)
```json
  private static Boolean CLOUD_EDGE_SERVICES = false;  //SET TO false for ON-PREMISE
```

### Compile and Package

1. Go to the project root folder where pom.xml file is located.
2. Edit the pom.xml and ensure that the version number of the Persistence Service jar file matches the JSON.  If it does not match, change the number in the pom.xml
```json
        <dependency>
            <groupId>com.sap.iot.edgeservices</groupId>
            <artifactId>PersistenceService</artifactId>
            <version>3.1808.0</version>
            <scope>provided</scope>
        </dependency>
```
3. Run following command to compile and build the package:
```json
mvn clean install
```
4. Verify that the file PersistenceSampleMaxTemperature-1.0.0.jar was created in the /target folder.

### Deploy

#### Edge Services, cloud edition

1. Use the IoT Service cockpit to navigate to your gateway.
2. In Bundle Management, upload the /target/PersistenceSampleMaxTemperature-1.0.0.jar file.

#### Edge Services, on-premise edition

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

### Edge Services, cloud edition

1. You will need to post JSON to the IoT Service gateway edge using a tool like Postman.  
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
To actually see the MAX function working correctly, you will need to send in multiple samples within 10 seconds for the sample to choose a maximum.

2. Log into IoT Service Cockpit
3. Navigate to your gateway
4. select the device for fridge2
5. graph the results for
```json
sensorType name:            PSMT
capabilityAlternateId:      PSMTResult
```

### Edge Services, on-premise

1. You will need to modify the Streaming Service to publish to Persistence.  Using the Streaming Service Edge Console, modify the HttpProtocolPlugin configuration and set "PUBLISH_TO_PERSISTENCE=true".

2. You will need to post JSON to the IoT Service gateway edge using a tool like Postman.  
```json
URL:        http://<server>:8699/measures/fridge2
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
To actually see the MAX function working correctly, you will need to send in multiple samples within 10 seconds for the sample to choose a maximum.

3. Alternatively, to send in data using the Streaming Service Edge Console, create a sensor profile with the name "Temperature" and use the "Live Sensors" feature to send in data using the "Emulated Device".

4. View the EdgeServicesRuntime log file (EdgeServicesRuntime\logs\sapedgeservices-stdout.yyyy-mm-dd.log) to watch INFO or DEBUG messages .  


## How to obtain support
These samples are provided "as-is" basis with detailed documentation on how to use them. There is no formal support channel for these samples. For related technical information you can look in to the Edge Services product documentation at http://help.sap.com

## Limitations / Disclaimer
Note: Sample scenarios/applications are designed to help you get an overall understanding of various extensibility concepts/patterns. SAP recommends not to use these samples for any productive usage. They show basic interaction with an SAP Edge Services system. Topics like authentication, error handling, transactional correctness, security, caching, tests were omitted on purpose for the sake of simplicity.

## Copyright and License
Copyright (c) 2018 SAP SE or an SAP affiliate company. All rights reserved.

License provided by SAP SAMPLE CODE LICENSE AGREEMENT (see https://github.com/SAP/iot-edge-services-samples/tree/master/LICENSE)
