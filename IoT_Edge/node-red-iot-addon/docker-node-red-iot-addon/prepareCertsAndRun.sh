#!/usr/bin/env bash

declare -i USER_FATAL_ERROR=192
declare -i USER_ALL_OK=0

mkdir /nodered-certs

### CHECK if P12 certificates are in the right position...
TRUSTSTORE_P12_FILE="/etc/secrets/custom-certs/clientTrustStore"
if [ ! -f "$TRUSTSTORE_P12_FILE" ]; then
    echo "$TRUSTSTORE_P12_FILE does not exist."
    exit ${USER_FATAL_ERROR}
fi

TRUSTSTORE_P12_PASSWORD="/etc/secrets/custom-certs/clientTrustStorePassword"
if [ ! -f "$TRUSTSTORE_P12_PASSWORD" ]; then
    echo "$TRUSTSTORE_P12_PASSWORD does not exist."
    exit ${USER_FATAL_ERROR}
fi

KEYSTORE_P12_FILE="/etc/secrets/custom-certs/clientKeyStore"
if [ ! -f "$KEYSTORE_P12_FILE" ]; then
    echo "$KEYSTORE_P12_FILE does not exist."
    exit ${USER_FATAL_ERROR}
fi

KEYSTORE_P12_PASSWORD="/etc/secrets/custom-certs/clientKeyStorePassword"
if [ ! -f "$KEYSTORE_P12_PASSWORD" ]; then
    echo "$KEYSTORE_P12_PASSWORD does not exist."
    exit ${USER_FATAL_ERROR}
fi

# Password are read from files...
CLIENT_TRUSTSTORE_SECRET=$(echo -n $( cat ${TRUSTSTORE_P12_PASSWORD} ))
CLIENT_KEYSTORE_SECRET=$(echo -n $( cat ${KEYSTORE_P12_PASSWORD} ))

### CONVERT PKCS12 truststore into file containing a concatenation of PEM files contained inside the p12 file
echo -e "Extracting PEM certificate from P12 truststore ${TRUSTSTORE_P12_FILE}...\n"
# Retrieve every ca file from PKCS12 truststore.
ALIASES=$( keytool -list -v -keystore "${TRUSTSTORE_P12_FILE}" -storepass ${CLIENT_TRUSTSTORE_SECRET} | grep 'Alias name:' | cut -d ":" -f 2 | awk '{ sub(/^[ \t]+/, ""); print }' )
TRUSTSTORE_PEM_FILE="/nodered-certs/cacerts.crt"
while IFS= read -r certalias
do 
    echo -e "Alias Name extracted=${certalias}\n"
    loc_tmpfilename="/nodered-certs/tmp.crt"
    keytool -keystore "${TRUSTSTORE_P12_FILE}" -storepass ${CLIENT_TRUSTSTORE_SECRET} -storetype pkcs12 -exportcert -rfc -alias "${certalias}" -file ${loc_tmpfilename}
    echo -e "PEM file created for Alias=${certalias}\n"
    cat "${loc_tmpfilename}" >> "${TRUSTSTORE_PEM_FILE}" 
    rm -rf ${loc_tmpfilename}
done <<< "$ALIASES"
echo -e "Truststore PEM certificate ${TRUSTSTORE_PEM_FILE} created.\n"

echo -e "\n\n"
cat ${TRUSTSTORE_PEM_FILE}
echo -e "\n\n"

### CONVERT PKCS12 keystore 
KEYSTORE_PEM_FILE="/nodered-certs/client.crt"
KEYSTORE_PEM_KEY_FILE="/nodered-certs/client.key"

echo -e "Extracting PEM certificate from P12 keystore ${KEYSTORE_P12_FILE}...\n"
openssl pkcs12 -in "$KEYSTORE_P12_FILE" -nokeys -nodes -passin pass:${CLIENT_KEYSTORE_SECRET} | openssl x509 -out "${KEYSTORE_PEM_FILE}" 
if [ $? -ne 0 ]; then
    echo "Error extracting PEM certificate from P12 keystore ${KEYSTORE_P12_FILE}."
    exit ${USER_FATAL_ERROR}
fi

echo -e "Keystore PEM certificate ${KEYSTORE_PEM_FILE} created.\n"

echo -e "Extracting PEM key from P12 keystore...\n"
openssl pkcs12 -in "$KEYSTORE_P12_FILE" -out ${KEYSTORE_PEM_KEY_FILE} -passin pass:${CLIENT_KEYSTORE_SECRET} -nodes -nocerts
if [ $? -ne 0 ]; then
    echo "Error extracting PEM key from P12 keystore ${KEYSTORE_P12_FILE}."
    exit ${USER_FATAL_ERROR}
fi
echo -e "PEM key ${KEYSTORE_PEM_KEY_FILE} created.\n"

## Extracting information from ServiceBindings 
echo -e "Service Bindings=${SERVICE_BINDINGS}\n"

MQTT_URL=$( echo ${SERVICE_BINDINGS} | jq -cr '.bindings[] | select(.type | contains("MQTT")) | .url' )
echo -e "MQTT Bus URL=${MQTT_URL}"

# TODO: information that must be retrieved from service bindings
EDGE_GATEWAY_HOST="$( echo ${MQTT_URL} | cut -d ':' -f 2 | cut -c3- )"
EDGE_GATEWAY_MQTT_BUS_TCP_PORT="$( echo ${MQTT_URL} | cut -d ':' -f 3 )"

REST_URL=$( echo ${SERVICE_BINDINGS} | jq -cr '.bindings[] | select(.type | contains("REST")) | select(.url | contains("gateway"))  | .url' )
echo -e "REST API URL=${REST_URL}"

EDGE_GATEWAY_REST_API_TCP_PORT="$( echo ${REST_URL} | cut -d ':' -f 3 )"

# Edge Gateway REST API call
EDGE_GATEWAY_URL="${EDGE_GATEWAY_HOST}:${EDGE_GATEWAY_REST_API_TCP_PORT}"
echo -e "Edge Gateway Host=${EDGE_GATEWAY_HOST}"
echo -e "Edge Gateway MQTT Bus TCP port=${EDGE_GATEWAY_MQTT_BUS_TCP_PORT}"
echo -e "Edge Gateway REST API TCP port=${EDGE_GATEWAY_REST_API_TCP_PORT}"
echo -e "Edge full REST API URL=${EDGE_GATEWAY_URL}"

GATEWAY_UUID=$( echo ${SERVICE_BINDINGS} | jq -cr '.bindings[] | select(.type | contains("MQTT")) | .id' )
BUS_TOPIC_OUT="iot/edge/v1/${GATEWAY_UUID}/measures/out"
echo -e "BUS_TOPIC_OUT=${BUS_TOPIC_OUT}\n"

#GATEWAY_INFO=$( curl -s -k --cert ${KEYSTORE_PEM_FILE} --key ${KEYSTORE_PEM_KEY_FILE} -X GET "https://${EDGE_GATEWAY_URL}/iot/edge/api/v1/gateways" -H "accept: application/json" )
GATEWAY_INFO=$( curl -s --cacert ${TRUSTSTORE_PEM_FILE} --cert ${KEYSTORE_PEM_FILE} --key ${KEYSTORE_PEM_KEY_FILE} -X GET "https://${EDGE_GATEWAY_URL}/iot/edge/api/v1/gateways" -H "accept: application/json" )

echo -e "Edge Gateway REST API call:\n"
echo -e "${GATEWAY_INFO}"

#while true; do sleep 30; done;

#echo -e "Receiving measures from MQTT bus...\n"
# Edge Gateway MQTT Bus subscription waiting for MQTT measures.
# This command must be written in a single line...disconnect when 5 messages are received
#mosquitto_sub -h ${EDGE_GATEWAY_HOST} -p ${EDGE_GATEWAY_MQTT_BUS_TCP_PORT} -C 5 -i ${IOT_SERVICE_INSTANCE_ID} --cafile ${TRUSTSTORE_PEM_FILE} --cert ${KEYSTORE_PEM_FILE} --key ${KEYSTORE_PEM_KEY_FILE} -t ${BUS_TOPIC_OUT}

PERSISTENCE=$( echo ${SERVICE_BINDINGS} | jq -cr '.bindings[] | select(.url | contains("persistence")) | .url' )
PERSISTENCE_ID=$( echo ${SERVICE_BINDINGS} | jq -cr '.bindings[] | select(.url | contains("persistence")) | .id' )
PERSISTENCE_HOST="$( echo ${PERSISTENCE} | cut -d ':' -f 2 | cut -c3- )"
PERSISTENCE_PORT="$( echo ${PERSISTENCE} | cut -d ':' -f 3 )"

echo -e "PERSISTENCE URL=${PERSISTENCE}"
echo -e "PERSISTENCE ID=${PERSISTENCE_ID}"
echo -e "PERSISTENCE HOST=${PERSISTENCE_HOST}"

sed  -i -e 's@<<PERSISTENCE>>@'"$PERSISTENCE"'@g' /data/flows-rep.json
sed  -i -e 's@<<EDGEGATEWAY>>@'"$EDGE_GATEWAY_HOST"'@g' /data/flows-rep.json
sed  -i -e 's@<<EDGEGATEWAY_BUS>>@'"$EDGE_GATEWAY_MQTT_BUS_TCP_PORT"'@g' /data/flows-rep.json
sed  -i -e 's@<<EDGERESTPORT>>@'"$EDGE_GATEWAY_REST_API_TCP_PORT"'@g' /data/flows-rep.json
sed  -i -e 's@<<EDGEBUSPORT>>@'"$EDGE_GATEWAY_MQTT_BUS_TCP_PORT"'@g' /data/flows-rep.json
#sed  -i -e 's@<<EDGEGATEWAY_INGESTION>>@'"$EDGE_GATEWAY_HOST"'@g' test

npm start --cache /data/.npm -- --userDir /data

exit ${USER_ALL_OK}
