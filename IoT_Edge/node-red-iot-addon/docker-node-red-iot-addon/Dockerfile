FROM nodered/node-red:1.3.3

USER root

COPY prepareAndRun.sh .
COPY userDir.zip .
RUN mkdir /nodered-certs
RUN chmod a+x prepareAndRun.sh
RUN unzip -oq userDir.zip -d /data
RUN chown node-red /nodered-certs
RUN chown node-red prepareAndRun.sh
RUN chown -R node-red /data
RUN chown node-red userDir.zip
USER node-red
ENV NODE_PATH= \
    FLOWS=
ENTRYPOINT ./prepareAndRun.sh
