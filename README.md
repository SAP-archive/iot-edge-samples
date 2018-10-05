# SAP Edge Services -  Samples

## Description
The sample scenarios/applications in this repository showcase various extension scenarios to SAP Edge Services. Please check out the branches of the repository for the actual samples.

Note:
The setup and implementation instructions for all samples are provided in the individual applications branches.

## Scenario Overview

| Scenario      | Overview      | Link          |
| ------------- | ------------- | ------------- |
| Edge Streaming Aggregation  | It creates two types of **streaming aggregations**: sliding (streaming time window - aggregation calculated in every incoming event) and jumping (database like time bucket - aggregation calculated end of every time bucket). The sliding aggregations can be send to rule engine | [streaming-aggregation](https://github.com/SAP/iot-edge-services-samples/tree/streaming-aggregation)  | 


## Limitations / Disclaimer
Note: Sample scenarios/applications are designed to help you get an overall understanding of various extensibility concepts/patterns. SAP recommends not to use these samples for any productive usage. They show basic interaction with an SAP Edge Services system. Topics like authentication, error handling, transactional correctness, security, caching, tests were omitted on purpose for the sake of simplicity. 

## How to obtain support
These samples are provided "as-is" basis with detail documentation of how to use them. There are no formal support channel for these samples. For overall technical information you can look in to the Edge Services product documentation at http://help.sap.com

## Copyright and License
Copyright (c) 2018 SAP SE or an SAP affiliate company. All rights reserved. This file is licensed under the Apache Software License, v. 2 except as noted otherwise in the LICENSE file

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
