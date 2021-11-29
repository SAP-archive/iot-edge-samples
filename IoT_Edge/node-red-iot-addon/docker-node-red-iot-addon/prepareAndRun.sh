#!/usr/bin/env bash

declare -i USER_FATAL_ERROR=192
declare -i USER_ALL_OK=0
declare -i EDGE_GATEWAY_HOST=edge-gateway-service.sap-iot-gateway
declare -i PERSISTENCE=persistence-service.persistence-service

NODERED_NAMESPACE=`cat /var/run/secrets/kubernetes.io/serviceaccount/namespace`

echo -e "PERSISTENCE URL=${PERSISTENCE}"
echo -e "NODERED NAMESPACE=${NODERED_NAMESPACE}"
echo -e "EDGE_GATEWAY_MQTT_BUS_TCP_PORT=${EDGE_GATEWAY_MQTT_BUS_TCP_PORT}"
echo -e "EDGE_GATEWAY_MQTT_INGESTION_PORT=${EDGE_GATEWAY_INGESTION_PORT}"
echo -e "EDGE_GATEWAY_REST_API_TCP_PORT=${EDGE_GATEWAY_REST_API_TCP_PORT}"

sed  -i -e 's@<<NAMESPACE>>@'"$NODERED_NAMESPACE"'@g' /data/flows-rep.json
sed  -i -e 's@<<EDGEGATEWAYINGESTION>>@'"$EDGE_GATEWAY_INGESTION_PORT"'@g' /data/flows-rep.json
sed  -i -e 's@<<EDGERESTPORT>>@'"$EDGE_GATEWAY_REST_API_TCP_PORT"'@g' /data/flows-rep.json
sed  -i -e 's@<<EDGEBUSPORT>>@'"$EDGE_GATEWAY_MQTT_BUS_TCP_PORT"'@g' /data/flows-rep.json

npm start --cache /data/.npm -- --userDir /data

exit ${USER_ALL_OK}
