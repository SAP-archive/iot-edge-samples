FROM openjdk:11.0.10-jdk-slim

RUN groupadd persistence_service_ref_app --gid 1000 && \
    useradd --create-home --shell /bin/bash --gid 1000 --uid 1000 persistence_service_ref_app && \
    apt-get -y update && \
    apt-get -y install netcat && \
    apt-get -y install curl

COPY ./imports/app*.jar /opt/persistence_service_ref_app/lib/persistence-service-ref-app.jar

RUN chown -R persistence_service_ref_app:persistence_service_ref_app /home && \
    chmod -R +rwx /home/* && \
    chown -R persistence_service_ref_app:persistence_service_ref_app /opt && \
    chmod -R +rwx /opt

USER persistence_service_ref_app
WORKDIR /opt/persistence_service_ref_app

CMD java -jar /opt/persistence_service_ref_app/lib/persistence-service-ref-app.jar
