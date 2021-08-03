# Boiler Demo with R model integration

## Overview

The boiler demo has 5 sensors sending in data / second.  Each sensor reading consists of 3 properties:
  - Temperature (float)
  - Pressure (float)
  - ReadingTime (date)

The 6th sensor, sends in the same data as above, but it has a special sensorAlternateId, `simulatorDevice`, 
indicating it is the simulator page which allows the person giving the demo to control various aspects of the demo.  By tagging the sensor id with a special value, we can identify these readings later.

These sensor readings are sent via IoT Gateway REST calls, which in turn are:
  - Stored in the Edge Services Persistence Service
    - No configuration required
  - Fed into the Edge Services Streaming Service
    - Configuration is required and done in several ways

As sensor readings are fed into the IoT Gateway, they are in turn fed through a R model to calculate the boilers efficiency based on the temperature and pressure readings.  There is no documentation on the R model, it was not written by this team, it was simply provided as is.

For each sensor reading fed into the R model the resulting efficiency of that reading is fed back into the IoT Gateway as a 7th sensor reading.
  - Th R model sensor reading consists of 2 properties:
    - Efficiency (float)
    - ReadingTime (date)

## Specifics
Now that we have 6 sensors feeding data into the IoT Gateway, we have also installed this bundle.

This bundle:
  - Uses the Persistence Service OSGi bundle API
  - Every 2 seconds
    - Queries the Persistence Service for data new sensor readings since the last time it checked
    - Stores these values in
      - `BoilerPredictiveModel/boiler-R/input_new.csv`
        ```
        Temperature, Pressure, ReadingTime
        30.0, 80.0, 1550242352160
        30.0, 80.0, 1550242351160
        ```
      - Then shells out to the OS and runs R
        ```
        $ Rscript --vanilla boilerEfficiency_csv_no_output_file.R input.csv
         
        "efficiency"
        "1" 30.9206268162867
        "2" 30.8770967770818
        ```
        - The output from the model is fed back into the IoT Gateway via the REST call as additional sensor readings (7th)
    - For this demo, the Edge Services Streaming Service has rules around this (7th) value
    
## Configuration
  - The various settings / values the bundle uses are stored in `config.properties` 
     ```
     $ cat BoilerPredictiveModel/config.properties
     ################################################################################
     # Copyright (c) 2018 SAP SE or an affiliate company. All rights reserved.
     ################################################################################
     readingDeviceAlternateId=
     readingSensorTypeAlternateId=11
     readingCapabilityAlternateId=ESBoiler_Reading
     readingSensorAlternateId=simulatorDevice
     sendingDeviceAlternateId=Demo4_426_REST_SaDevice
     sendingSensorTypeAlternateId=11
     sendingCapabilityAlternateId=ESBoiler_Predictive
     sendingSensorAlternateId=boiler_predictive
     iotGatewayMeasureURL=http://localhost:8699/measures/
     pollingFrequency=2000
     logLevel=DEBUG
     ```
  - readingDeviceAlternateId
    - No long used by demo
  - readingSensorTypeAlternateId=11
    - When pulling data from the Persistence Service which PROFILE_ID to reference
  - readingCapabilityAlternateId=ESBoiler_Reading
    - When pulling data from the Persistence Service which OBJECT_ID to reference
  - readingSensorAlternateId=simulatorDevice
    - When pulling data from the Persistence Service which SENSOR_ID to reference
    - This is used to identity the special simulator page (in other words the 6th sensor)
  - sendingDeviceAlternateId=Demo4_426_REST_SaDevice
    - After running R and sending the reading to the IoT Gateway, which IoT Gateway device to use
  - sendingSensorTypeAlternateId=11
    - After running R and sending the reading to the IoT Gateway, which IoT Gateway Sensor Type to use
  - sendingCapabilityAlternateId=ESBoiler_Predictive
    - After running R and sending the reading to the IoT Gateway, which IoT Gateway Capability to use
  - sendingSensorAlternateId=boiler_predictive
    - After running R and sending the reading to the IoT Gateway, which IoT Gateway Sensor to use
  - iotGatewayMeasureURL=http://localhost:8699/measures/
    - After running R and sending the reading to the IoT Gateway, which IoT Gateway REST URL to use
  - pollingFrequency=2000
    - When the demo is started, how often it should query the Persistence Service for new data

## Building
  - The bundle is built using Maven
    - `mvn clean package`
  - Deploying the bundle
    - After the build is successful
      - `target/BoilerPredictiveModel-3.1812.0.jar`
    - Deploy this to your gateway in any way you choose
      - Via the IoT Services Cockpit
      - SCPing the file to the gateway
        - Copy to the IoT gateway/plugins directory
        - `g! install file:plugins/BoilerPredictiveModel-3.1812.0.jar`
        - Edit `gateway/configuration/config.ini`
          - Add this line to the 2nd last line of the file
            - `plugins/BoilerPredictiveModel-3.1812.0.jar@6:start,\`

