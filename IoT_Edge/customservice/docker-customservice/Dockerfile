FROM openjdk:8-jdk-slim-buster

ARG USER=demo
ARG GROUP=${USER}
ARG UID=999
ARG GID=${UID}

RUN apt-get update && apt-get install -y --no-install-recommends \
  unzip \
  curl \
  openssl \
  jq \
  && rm -rf /var/lib/apt/lists/*

# Create a group and user 
RUN groupadd -g ${GID} ${GROUP} && \
    useradd -r -u ${UID} -g ${GROUP} -m ${USER}

COPY demo-svc.sh /home/${USER}
COPY custom-http-server-1.0.0.jar /home/${USER}

RUN chmod a+x /home/${USER}/*.sh && \
    chown -R ${USER}:${GROUP} /home/${USER}

USER ${USER}

WORKDIR /home/${USER}

CMD ["./demo-svc.sh"]