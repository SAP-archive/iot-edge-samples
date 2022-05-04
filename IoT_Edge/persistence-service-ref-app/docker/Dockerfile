FROM alpine:3.15.0

RUN addgroup -g 1000 persistence_service_ref_app && \
    adduser -s /bin/bash -G persistence_service_ref_app -u 1000 -D persistence_service_ref_app && \
    apk update && \
    apk add curl && \
    apk add --no-cache openjdk11

COPY ./imports/app*.jar /opt/persistence_service_ref_app/lib/persistence-service-ref-app.jar

RUN chown -R persistence_service_ref_app:persistence_service_ref_app /home && \
    chmod -R +rwx /home/* && \
    chown -R persistence_service_ref_app:persistence_service_ref_app /opt && \
    chmod -R +rwx /opt

USER persistence_service_ref_app
WORKDIR /opt/persistence_service_ref_app

CMD java -jar /opt/persistence_service_ref_app/lib/persistence-service-ref-app.jar
