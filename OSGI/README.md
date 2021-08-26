# OSGI Samples

This folder contains all the OSGI samples, implementale with [SAP Edge Services, cloud edition](https://help.sap.com/viewer/p/EDGE_SERVICES) and 
[SAP Edge Services, on-premise edition](https://help.sap.com/viewer/p/SAP_EDGE_SERVICES_OP)


## Scenario Overview

| Scenario      | Overview      | Link          |
| ------------- | ------------- | ------------- |
| Edge Streaming Aggregation  | This sample creates two types of streaming aggregations: sliding (streaming time window - aggregation calculated in every incoming event) and jumping (database like time bucket - aggregation calculated end of every time bucket). The sliding aggregations can be sent to the Streaming Service rule engine | [streaming-aggregation](https://github.com/SAP/iot-edge-samples/tree/master/OSGI/streaming-aggregation)  |
| Edge Persistence Aggregation  | This sample demonstrates use of the Persistence Service Java API.  This sample queries the Persistence Service at an interval.  The query aggregates data stored in the Persistence Service, and feeds this data back into Edge Services. | [persistence-aggregation-max-temp](https://github.com/SAP/iot-edge-services-samples/tree/master/OSGI/persistence-aggregation-max-temp)  |
| Edge Machine learning  | This sample demonstrates how a quality machine learning solution can be deployed on SAP Edge Services platform with an example of defective welding detection. | [edge-ml-welding-sound](https://github.com/SAP/iot-edge-services-samples/tree/master/OSGI/edge-ml-welding-sound)  |
| Edge Predictive Analytics 1 | This sample demonstrates how to implement a Predictive Analytics Service.  The service integrates the usage of the Persistence Service Java APIs to get the data, and the Edge Service Configuration object to support dynamic configurations. It is using an external (not provided) JPMML library to compute the prediction,with the provided PMML model | [predictive-pmml](https://github.com/SAP/iot-edge-samples/tree/OSGI/master/predictive-pmml)  |
| Edge Predictive Analytics 2  | This sample demonstrates how to implement a Predictive Analytics Service.  The service integrates the usage of the Persistence Service Java APIs to get the data, and the Edge Service Configuration object to support dynamic configurations. It is using an external python module to compute the prediction with an existing and already existing python model (optionally trained in the cloud) | [predictive-python](https://github.com/SAP/iot-edge-samples/tree/master/predictive-python)  |
| Edge Custom Service | This sample demonstrates how to implement custom logic with an external module intercommunication.  The service integrates the usage of the Edge Service Configuration object to support dynamic configurations. It is using an external python module to compute make some computation, SAP IoT Edge Message bus to exchange messages between the JAVA codebase and the python module (such as the configuration), SAP IoT offline operations to publish new endpoints at the edge by leveraging the integrated Netty Server. | [custom-services-additional-apis-messagebus](https://github.com/SAP/iot-edge-samples/tree/master/custom-services-additional-apis-messagebus)  |
| EBF UI | A sample user interface for the Essential Business Functions edge database. | [EBF UI](https://github.com/SAP/iot-edge-samples/tree/master/ebf-sample)  |


## How to obtain support

These samples are provided "as-is" basis with detailed documentation on how to use them.
