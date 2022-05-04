package com.sap.persistenceservice.refapp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.sap.persistenceservice.refapp.utils.Constants;
import com.sap.persistenceservice.refapp.utils.JwtTokenUtil;
import com.sap.persistenceservice.refapp.utils.RefAppEnv;
import org.eclipse.paho.client.mqttv3.MqttAsyncClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PreprocessingSubscriberService {

    private static final Logger log = LoggerFactory.getLogger(PreprocessingSubscriberService.class);

    @Autowired
    ObjectMapper objectMapper;

    private MqttAsyncClient mqttClient;

    private PreprocessingMqttClient mqttClientCallback;

    private final String clientId = "persistence-ref-app";

    public void setupClient(String connectionUrl) throws MqttException {
        if (mqttClient != null && mqttClient.isConnected()) {
            mqttClient.disconnect();
            mqttClient.close(true);
        }

        log.info("Attempting to connect to MQTT URL {}", connectionUrl);

        mqttClient = getClient(connectionUrl);
        mqttClient.subscribe(Constants.PREPROCESSING_MQTT_TOPIC, 0);
    }

    private MqttAsyncClient getClient(String connectionUrl) throws MqttException {
        MqttConnectOptions connOpts = new MqttConnectOptions();
        connOpts.setAutomaticReconnect(true);
        connOpts.setCleanSession(true);
        connOpts.setMaxReconnectDelay(6000);
        connOpts.setMaxInflight(RefAppEnv.MAX_IN_FLIGHT);
        connOpts.setUserName(this.clientId);
        connOpts.setPassword(JwtTokenUtil.readJwtToken().toCharArray());

        MqttAsyncClient asyncClient = new MqttAsyncClient(connectionUrl, this.clientId,
                new MemoryPersistence());
        mqttClientCallback = new PreprocessingMqttClient(objectMapper);

        asyncClient.setCallback(mqttClientCallback);
        asyncClient.connect(connOpts);
        while (true) {
            if (asyncClient.isConnected()) {
                log.info("Preprocessing subscriber client is connected");
                break;
            }
        }

        return asyncClient;
    }

    public ArrayNode getMessages() {
        return mqttClientCallback.getMessages();
    }
}
