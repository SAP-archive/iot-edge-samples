package com.sap.persistenceservice.refapp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallbackExtended;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PreprocessingMqttClient implements MqttCallbackExtended {

    private static final Logger log = LoggerFactory.getLogger(PreprocessingMqttClient.class);

    ObjectMapper objectMapper;

    private final ArrayNode messages;

    public PreprocessingMqttClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        messages = objectMapper.createArrayNode();
    }

    @Override
    public void connectionLost(Throwable cause) {
        log.error("Connection lost ", cause);
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) throws Exception {
        log.debug("Message arrived on topic {}: ", topic);
        JsonNode json = objectMapper.readTree(message.getPayload());
        log.debug("Message contents: {}", json.asText());

        if (json.isArray()) {
            json.forEach(messages::add);
        }
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < token.getTopics().length; i++) {
            sb.append(token.getTopics()[i]);
        }
        log.debug("Message delivered on topic {}", sb.toString());
    }

    @Override
    public void connectComplete(boolean reconnect, String serverURI) {
        log.info("Connection established {}", serverURI);
    }

    public ArrayNode getMessages() {
        if (messages == null) {
            return objectMapper.createArrayNode();
        }
        return messages;
    }
}