package com.sap.persistenceservice.refapp.task;

import org.eclipse.paho.client.mqttv3.MqttAsyncClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.persistenceservice.refapp.bean.DeviceMessage;
import com.sap.persistenceservice.refapp.iot.model.DeviceMessagePojo;
import com.sap.persistenceservice.refapp.utils.MessageUtil;

public class MQTTLoadGenerationTask extends LoadGenerationTask{
    private static final Logger log = LoggerFactory.getLogger(MQTTLoadGenerationTask.class);

    private MqttAsyncClient mqttClient;

    private String topic;

    public MQTTLoadGenerationTask(ObjectMapper objectMapper, MqttAsyncClient mqttClient,
        DeviceMessagePojo deviceMessagePojo, double maxMessages) {
        super(objectMapper, deviceMessagePojo, maxMessages);
        this.mqttClient = mqttClient;
        this.topic = "measures/" + deviceMessagePojo.getDeviceAlternateId();
    }

    @Override
    public void run() {

        if (MessageUtil.getInstance().getMessageCounter() >= maxMessages) {
            return;
        }

        DeviceMessage deviceMessage = createDeviceMessage();

        try {
            byte[] messageBytes = objectMapper.writeValueAsBytes(deviceMessage);
            mqttClient.publish(topic, new MqttMessage(messageBytes));
            MessageUtil.getInstance().incrementMessageCounter();
        } catch (MqttException | JsonProcessingException ex) {
            log.error("Error while publishing message ", ex);
        }
    }
}
