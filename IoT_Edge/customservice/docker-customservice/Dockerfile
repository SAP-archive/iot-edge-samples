FROM openjdk:17-alpine

ARG USER=httpuser
ARG GROUP=${USER}
ARG UID=999
ARG GID=${UID}

RUN apk update && apk add \
  unzip \
  curl \
  openssl

# Create a group and user
RUN addgroup -S ${GROUP} && adduser -S ${USER} -G ${GROUP}

COPY customhttp.sh /home/${USER}
COPY custom-http-server-2.0.0.jar /home/${USER}

RUN chmod a+x /home/${USER}/*.sh && \
    chown -R ${USER}:${GROUP} /home/${USER}

USER ${USER}

WORKDIR /home/${USER}

CMD ["./customhttp.sh"]
