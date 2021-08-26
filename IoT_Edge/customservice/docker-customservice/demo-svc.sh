#!/usr/bin/env bash

declare -i USER_FATAL_ERROR=192
declare -i USER_ALL_OK=0


echo -e "Ingestion Url=${INGESTION_URL}\n"

echo -e "port param=${SERVICE_PORT}\n"

java -jar custom-http-server-1.0.0.jar

#while true; do sleep 30; done;

exit ${USER_ALL_OK}
