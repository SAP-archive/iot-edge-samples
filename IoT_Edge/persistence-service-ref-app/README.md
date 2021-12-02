# Persistence Service Reference Application

## Overview

This sample is a custom extension service that demonstrates the creation of a custom schema from Persistence Service. The reference app also allows for sending measure data to Edge Gateway Service using a build in oData API, as well as viewing measure data from Persistence Service.
  
## Requirements

The following requirements must be satisfied for this sample:

1. [Java JDK](https://www.java.com/en/download/) 1.8 or above
2. [Apache Maven](https://maven.apache.org/download.cgi)
3. [Git](https://git-scm.com/downloads)  command line tool
4. [Docker](https://www.docker.com)
5. Docker registry (or [Docker Hub](https://hub.docker.com) subscription)
6. An Edge Node with [k3s](https://k3s.io/) runtime installed
7. Edge Gateway Service installed in the Edge Node
8. Persistence Service installed in the Edge Node

## Preliminary Operations

There are some preliminary operations that are undocumented here that the user has to complete to be able to make the base sample up and running:

1. Onboard the Edge Node into the Lyfecycle Management component. The documentation could be found [here](https://help.sap.com/viewer/9d5719aae5aa4d479083253ba79c23f9/SHIP/en-US/0a222b9c99d94f56abdcfe27f5be0afa.html)
2. Onboard the Edge Gateway Service into your configured Edge Node (protocol MQTT)
3. Onboard Persistence Service into your configured Edge Node

### SAP Iot Device Configuration

You will need to set up a Device with a Sensor and Capability in your Edge Gateway. You can easily create it with the _Device Connectivity_ tile in the SAP IoT Fiori Launchpad.

## Download and Installation

  git clone https://github.com/SAP-Samples/iot-edge-samples.git
  cd persistence-service-ref-app


### Compile and Package the Java application

Run the maven build:
```
mvn clean install
```

### Build and push the Docker image

Build using the Dockerfile:
```

cd docker
docker build -f Dockerfile -t custom-service-ref-app:1.0.0 .
docker tag custom-service-ref-app:1.0.0 <your repository>/custom-service-ref-app:1.0.0
docker push <your repository>/custom-service-ref-app:1.0.0
```

### Deploy the HELM chart

Helm chart is located in assemble/helm/target/persistence-ref-app-1.0.0
```
Upload the helm chart in Policy Service and select bindings to Edge Gateway Service and Persistence Service
```

### Deploy the service

  Search your node in the list of nodes and Deploy the created Extension Service into your node.
