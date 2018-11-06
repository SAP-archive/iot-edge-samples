# Streaming Aggregation Sample

## Overview

This streaming aggregation sample demonstrates different aggregation methods that can be extended to implement other aggregation scenarios. There are many reasons why aggregations are important for IOT applications at the edge. Sensor data is often known to be fluctuating; therefore, it may be desirable to create rules based on aggregated sensor readings, instead of rules based on individual sensor readings. Also, when running ML/AI models at the edge, these models may need to run on aggregated data due to the amount of computing resources or time required to run the model.

After customizing this sample to your own implementation, make sure to thoroughly test before deploying to production environments. This sample is written in Java and internally it uses the custom rule feature of the SAP Edge Services Streaming Service to compute the aggregation. More details can be found in *High-Level Design* section.

This sample assumes the user has a working knowledge of SAP Edge Services and is comfortable programming in Java. The user must be familiar with the Streaming Service, Streaming Service Edge Console, and configuring streaming rules in the Streaming Service.

## Product Documentation

Product Documentation for SAP Edge Services is available as follows:

[SAP Edge Services, cloud edition](https://help.sap.com/viewer/p/EDGE_SERVICES)

[SAP Edge Services, on-premise edition](https://help.sap.com/viewer/p/SAP_EDGE_SERVICES_OP)

### Description

This sample creates two types of streaming aggregations. These are called *persistence aggregation* and *streaming rule aggregation*.

### Persistence Aggregation

Persistence aggregations are calculated in a time window. For example, if a time window of 30 seconds is defined, then aggregations are calculated at the end of 30 seconds. The window is then cleared, and sensor readings start accumulating for the next 30 seconds. This sample saves the aggregated data to a file. This sample could be extended to save the aggregated data in the SAP Edge Services Persistence Service.

### Streaming Rule Aggregation

Streaming rule aggregations are calculated in a sliding time window where the aggregation is calculated every time a new reading arrives. For example, if a sliding time window of 30 seconds is defined, then every second, the time window slides forward one second, removing data that is older than 30 seconds. The calculated streaming aggregations can be sent back to the Streaming Service as an event for additional processing.

### Receiving sensor data

The sensor readings for this streaming aggregation sample are received from the Streaming Service using the Streaming Service custom rule feature. In the configuration of the custom rule, configure the host and port that the custom streaming project is running. In the JSON configuration of this streaming aggregation sample, put the same host and port - this aggregation sample will bind to this port when it starts. The Streaming Service also will send data to this port. The data transfer to this streaming aggregation sample and the subscription of the aggregated result are handled by the Streaming Service.

### Computing the streaming aggregations

This streaming aggregation sample internally uses a streaming engine in a separate process to compute the aggregation. The aggregation logic is written in CCL (continuous computation language). Using the configuration of this streaming aggregation sample, CCL is generated, compiled and executed to compute the aggregation.

### Using streaming aggregations in the streaming rule
The streaming aggregations created in this sample can be brought back to the custom rule of SAP Edge Services Streaming Service as an event. To send the aggregated data to an external system, configure a Streaming Service enterprise plugin to send the aggregated data to the external system.

### Expected performance

Performance is highly dependent on the configuration of this sample, and the computing hardware running this sample. For example, the number and size of the aggregation time windows defined will impact performance, as will the memory, CPU, network and disk of the host computer.

For most hardware, if the aggregation time windows are small - less than a few thousand sensor readings (combined) within the configured time windows, then performance should be consistent, assuming new readings continuously arrive at the same speed.

Performance should always be tested using a customer's exact configuration and hardware to ensure it satisfies requirements.

### Supported aggregations

The following 11 aggregations are supported by this aggregation sample:

AVG, SUM, COUNT, MIN, MAX, MEDIAN, STDDEV (standard deviation), COUNTDISTINCT (count of distinct values), WEIGHTEDAVG (weighted average), LASTVALUE (last value in the time bucket), and FIRSTVALUE (first value in the time bucket). All the aggregations are grouped by device id, sensor id and profile id.

### High-Level Design

This sample leverages the custom rule feature of the Streaming Service. This sample dynamically generates a CCL file that implements the aggregations, and the necessary streams to interact with the Streaming Service.

This streaming aggregation sample is mainly control by the JSON configuration file. The JSON configuration file has two types of configurations: streams and rules.

1.	Streams: This section defines the supported aggregations and whether a persistence aggregation needs to be calculated.
2.	Rules: This section defines what are aggregations are subscribed by a sensor profile and a rule.

Depending on the parameters of this JSON configuration, when this sample starts it generates, compiles and starts the CCL file. Once it is started, then the rule subscription configuration is published to an internal control stream of this CCL. The CCL can dynamically adjust the rule subscription.

Once it starts, the Streaming Service custom rule which is configured for this sample will send data to this aggregation sample. The same streaming aggregation sample can handle data from many sensor profiles.

Depending on the rule subscription, streaming aggregations are published to a pre-defined stream where the Streaming Service receives the aggregated data.

The streaming aggregation sample has a subscriber which listens to the computed persistence aggregations. When it receives the aggregations, it stores these values into a CSV file. It could be extended to store in the Persistence Service.

### Modifying the generated CCL code

The generated CCL code cannot be changed since it is generated from the JSON configuration every time the sample starts. To extend or modify the generated CCL, the CCL generator written in Java must be modified (CclGen.java).

### Deploying this sample

This sample must be manually deployed to the computer running SAP Edge Services. The sections below describe how to build, deploy and run this sample. A future enhancement of this sample would involve converting the Java project to an OSGI bundle. As an OSGi bundle, it could be deployed from either the cloud (for SAP Edge Services, cloud edition) or deployed to the Edge Services Runtime (SAP Edge Service, on-premise edition).

## Requirements

The following must be installed for this sample:
1. Java JDK 1.8 or above (https://www.java.com/en/download/)
2. Apache Maven (https://maven.apache.org/download.cgi)
3. Git command line tool (https://git-scm.com/downloads)
4. SAP Edge Services (Cloud or On-premise edition)
5. Packaging tool (Tar utility is usually pre-installed in Linux / WinZip or similar for Windows)

### SAP Edge Services

#### Cloud edition

For cloud edition, a working IoT Services Gateway Edge (REST) is required, with the SAP Edge Services Streaming Service installed.

#### On-premise edition (3.0 FP02 or newer)

For on-premise edition, a working install of the Persistence Service and Streaming Service is required. These are installed together as described in the SAP Edge Services, on-premise edition online documentation.

## Download and Installation

### Download the sample app
```json
git clone https://github.com/SAP/iot-edge-services-samples.git
cd iot-edge-services-samples
cd streaming-aggregation
```

### Compile and Package

1. Open a shell / command prompt (on Windows as Administrator) and navigate to the `streaming-aggregation` directory.
2. Copy libraries to Maven repository by running following command:
```json
mvn eclipse:eclipse
```
3. The above command will throw errors for streaming libraries. It will also show the command that needs to run in the command line. Follow those commands to copy all the libraries. Libraries are in $STREAMING_HOME/libj folder.
4. Run the following command to compile and build the package:
```json
mvn clean install
```
5. Create tar (for Linux) which will include all the 3rd party jars:
```json
cp aggr-cnf.json target
cd target
tar -cvf ../EdgeAnalytics.tar SampleEdgeAnalytics-null.jar aggr-cnf.json lib/*.jar
```
6. Create zip (for Windows) which will include all the 3rd party jars:
```json
mkdir EdgeAnalytics
copy aggr-cnf.json EdgeAnalytics
copy target\SampleEdgeAnalytics-null.jar EdgeAnalytics
mkdir EdgeAnalytics\lib
copy target\lib\* EdgeAnalytics\lib
Use WinZip or similar tool to zip the EdgeAnalytics folder
```

## Configuration

The JSON file controls the configuration of this streaming aggregation sample. There are two sections in the JSON file: streams and rules. The streams section is fixed. This means this section must be there for this sample to function properly.

Each section in the streams has three fixed and one optional name/value pairs. The properties “name”, “time” and “type” are fixed. The property “persist” is optional. If the “persist” property is true for an aggregation, then this sample will create the aggregation and save it in a CSV file.

In the rule section of the JSON file there are three name value pairs defined for each section. These are “ruleId”, “profileId” and “aggr”. This is where the streaming aggregation to streaming rule mapping is configurated. The rule section is optional. If omitted, there will be no streaming aggregations generated.

### Example
I have two sensor profiles Temperature_0_1 and Humidity_0_1. I have already defined two custom rules for each profile: “TempAvg” and “HumdAvg”.

I want to generate AVG and SUM every 30 seconds for both sensor profiles and save for future analysis.

I would also like to bring the AVG of Temperature_0_1 to a rule “TempAvg” and AVG of Humidity_0_1 to a rule “HumdAvg”.

Solution:

1. First, configure the streams section of the JSON file. Put “persist”: true as shown below ONLY for the AVG and SUM to indicate the streaming aggregation sample must generate and save these persistence aggregations. Also, change the value of the “time” to 30 SECONDS for both AVG and SUM.
```json
    {
      "name": "AVGSTREAM",
      "time": "10SEC",
      "type": "AVG",
      "persist": true
    },
    {
      "name": "SUMSTREAM",
      "time": "10SEC",
      "type": "SUM",
      "persist": true
    },
```
2. Next, configure the rule section to indicate that AVG calculated for sensor profiles Temperature_0_1 and Humidity_0_1 should be sent to rules TempAvg and HumdAvg respectively.
```json
    {
      "ruleId": "TempAvg",
      "profileId": "Temperature_0_1",
      "aggr": "AVG"
    },
    {
      "ruleId": "HumidAvg",
      "profileId": "Humdity_0_1",
      "aggr": "AVG"
    }
```
3. In the Streaming Service Edge Console, ensure sensor profiles are created for Temperature_0_1 and Humidity_0_1. Also, ensure custom rules TempAvg and HumidAvg are created for each sensor profile. In both custom rules, set the host name as localhost and port as 9090. 

4. In the JSON configuration file for this sample, ensure the host and port are the same as configured in the custom rules.

5. Once JSON file is saved, restart the streaming aggregation sample so that it will regenerate the CCL and start the aggregations.

### Deploy and Run
Here are the steps to deploy, run and test:

1. Un-tar the tar file to a folder
2. Open the aggr-conf.json file in a text editor
3. Start the Streaming Service if it is already not running
4. Login to the Streaming Service Edge Console using browser: https://localhost
5. If missing, create a sensor profile: Temperature_0_1
6. Create a custom rule called: TempAggregation
7. Configure the custom rule with host localhost and port 9090
8. Save the custom rule
9. Copy the sensor profile id and rule id (both are hexadecimal string)
10. Go back to the aggr-conf.json file and find the section called “rules” - change the ruleId and profileId
11. Save the aggr-conf.json file
12. In the command line, set the STREAMING_HOME. For example, if the "edgeservices" folder is at "c:\Gateway\edgeservices" then STREAMING_HOME should be set to "C:\Gateway\edgeservices\esp\ESP-5_1"
13. To run aggregation service from the command line:
```json
java -jar SampleEdgeAnalytics-null.jar
```
14. Restart the Streaming Service
15. Use a supported method to send data to the Temperature_0_1 sensor profile in SAP Edge Services Streaming Service. (For example, a tool such as MQTTBox or Postman can be used)
16. Check the file for aggregations and events in the UI. If "persist" aggregation is configurated, then new aggregations are created in the CSV file in the same folder. If streaming aggregations are configured, then view the events generated in the Streaming Service Edge Console.


## Limitations

There are some limitations of what is possible with this streaming aggregation sample:

For Persistence Aggregation:
- You can only define ONE custom rule for ONE sensor profile (sensor data)
- You can define only one type of aggregation once for each sensor profile. You cannot define the same aggregation type for a sensor profile twice and provide different time (window) property
- You can define one or more unique aggregations for each sensor profile

For Streaming Aggregation:
- You can only define ONE custom rule for ONE sensor profile (sensor data)
- You can define only one type of aggregation once for each sensor profile. You cannot define the same aggregation type for a sensor profile twice and provide different time (window) property
- You can define one or more unique aggregations for each sensor profile
- You can only bring ONE type of aggregation as an event back to the Streaming Service

## Known Issues

Currently, the on-premise Streaming Service requires this streaming aggregation sample to start before the Streaming Service starts. For any other issues, check the log file that this streaming aggregation sample generates as well as Streaming Service log files located at .../dep_iot_edge/log/

## How to obtain support

These samples are provided "as-is" basis with detailed documentation on how to use them. 

## Copyright and License

Copyright (c) 2018 SAP SE or an SAP affiliate company. All rights reserved.

License provided by [SAP SAMPLE CODE LICENSE AGREEMENT](https://github.com/SAP/iot-edge-services-samples/tree/master/streaming-aggregation/LICENSE)
