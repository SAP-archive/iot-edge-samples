#!/bin/sh

USER_FATAL_ERROR=192
USER_ALL_OK=0


echo -e "API port param=${SERVICE_API_PORT}\n"

echo -e "Ingestion port param=${SERVICE_PORT}\n"

java -jar custom-http-server-2.0.0.jar

#while true; do sleep 30; done;

exit ${USER_ALL_OK}
