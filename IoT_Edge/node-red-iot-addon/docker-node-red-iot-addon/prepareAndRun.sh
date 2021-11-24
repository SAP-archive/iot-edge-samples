#!/usr/bin/env bash

declare -i USER_FATAL_ERROR=192
declare -i USER_ALL_OK=0
declare -i EDGE_GATEWAY_HOST=edge-gateway-service.sap-iot-gateway.svc.cluster.local
declare -i PERSISTENCE=persistence-service.persistence-service.svc.cluster.local

echo -e "PERSISTENCE URL=${PERSISTENCE}"
echo -e "EDGE_GATEWAY_MQTT_BUS_TCP_PORT=${EDGE_GATEWAY_MQTT_BUS_TCP_PORT}"
echo -e "EDGE_GATEWAY_REST_API_TCP_PORT=${EDGE_GATEWAY_REST_API_TCP_PORT}"

sed  -i -e 's@<<PERSISTENCE>>@'"$PERSISTENCE"'@g' /data/flows-rep.json
sed  -i -e 's@<<EDGEGATEWAY>>@'"$EDGE_GATEWAY_HOST"'@g' /data/flows-rep.json
sed  -i -e 's@<<EDGEGATEWAY_BUS>>@'"$EDGE_GATEWAY_MQTT_BUS_TCP_PORT"'@g' /data/flows-rep.json
sed  -i -e 's@<<EDGERESTPORT>>@'"$EDGE_GATEWAY_REST_API_TCP_PORT"'@g' /data/flows-rep.json
sed  -i -e 's@<<EDGEBUSPORT>>@'"$EDGE_GATEWAY_MQTT_BUS_TCP_PORT"'@g' /data/flows-rep.json
#sed  -i -e 's@<<EDGEGATEWAY_INGESTION>>@'"$EDGE_GATEWAY_HOST"'@g' test

npm start --cache /data/.npm -- --userDir /data

exit ${USER_ALL_OK}
