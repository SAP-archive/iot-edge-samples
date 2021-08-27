package com.sap.persistenceservice.refapp.service;

import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallbackExtended;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CustomMeasureMqttClient implements MqttCallbackExtended {

    private static final Logger log = LoggerFactory.getLogger(CustomMeasureMqttClient.class);

    @Override
    public void connectionLost(Throwable cause) {
        log.error("Connection lost ", cause);

    }

    @Override
    public void messageArrived(String topic, MqttMessage message) throws Exception {
        log.debug("Message arrived on topic {}", topic);
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < token.getTopics().length; i++) {
            sb.append(token.getTopics()[i]);
        }
        log.debug("Message delivered on topic {}", sb.toString());// NOSONAR

    }

    @Override
    public void connectComplete(boolean reconnect, String serverURI) {
        log.info("Connection established {}", serverURI);
    }

}
