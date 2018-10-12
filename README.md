# SAP Edge Services -  Samples

## Description
The sample scenarios/applications in this repository showcase various extension scenarios to SAP Edge Services.

## Scenario Overview

| Scenario      | Overview      | Link          |
| ------------- | ------------- | ------------- |
| Edge Streaming Aggregation  | This sample creates two types of streaming aggregations: sliding (streaming time window - aggregation calculated in every incoming event) and jumping (database like time bucket - aggregation calculated end of every time bucket). The sliding aggregations can be sent to the Streaming Service rule engine | [streaming-aggregation](https://github.com/SAP/iot-edge-services-samples/tree/master/streaming-aggregation)  |
| Edge Persistence Aggregation  | This sample demonstrates use of the Persistence Service Java API.  This sample queries the Persistence Service at an interval.  The query aggregates data stored in the Persistence Service, and feeds this data back into Edge Services. | [persistence-aggregation-max-temp](https://github.com/SAP/iot-edge-services-samples/tree/master/persistence-aggregation-max-temp)  |

## How to obtain support
These samples are provided "as-is" basis with detailed documentation on how to use them. There is no formal support channel for these samples. For related technical information you can look in to the SAP Edge Services product documentation at http://help.sap.com


## Copyright and License
Copyright (c) 2018 SAP SE or an SAP affiliate company. All rights reserved.

License provided by SAP SAMPLE CODE LICENSE AGREEMENT (see https://github.com/SAP/iot-edge-services-samples/tree/master/LICENSE)
