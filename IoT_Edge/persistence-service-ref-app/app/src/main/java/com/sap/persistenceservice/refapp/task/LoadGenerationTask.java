package com.sap.persistenceservice.refapp.task;

import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.eclipse.paho.client.mqttv3.MqttAsyncClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.persistenceservice.refapp.bean.DeviceMessage;
import com.sap.persistenceservice.refapp.iot.model.DeviceMessagePojo;
import com.sap.persistenceservice.refapp.iot.model.Property;
import com.sap.persistenceservice.refapp.utils.MessageUtil;

public class LoadGenerationTask implements Runnable {

    private static final Logger log = LoggerFactory.getLogger(LoadGenerationTask.class);

    private ObjectMapper objectMapper;

    private MqttAsyncClient mqttClient;

    private DeviceMessagePojo deviceMessagePojo;
    private Random random = new Random();

    private String topic;

    private String capabilityAlternateId;
    private String sensorAlternateId;

    private double maxMessages;

    public LoadGenerationTask(ObjectMapper objectMapper, MqttAsyncClient mqttClient,
        DeviceMessagePojo deviceMessagePojo, double maxMessages) {
        this.objectMapper = objectMapper;
        this.mqttClient = mqttClient;
        this.deviceMessagePojo = deviceMessagePojo;
        this.maxMessages = maxMessages;
        this.topic = "measures/" + deviceMessagePojo.getDeviceAlternateId();
        this.capabilityAlternateId = deviceMessagePojo.getCapability().getAlternateId();
        this.sensorAlternateId = deviceMessagePojo.getSensorAlternateId();
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

    /**
     * This method returns device message
     * 
     * @param config
     * @return
     */
    private DeviceMessage createDeviceMessage() {
        DeviceMessage message = new DeviceMessage();

        message.setCapabilityAlternateId(capabilityAlternateId);
        message.setSensorAlternateId(sensorAlternateId);
        Map<String, Object> measureList = new HashMap<>();

        List<Property> allProperties = deviceMessagePojo.getCapability().getProperties();

        for (Property capabilityProperty : allProperties) {

            if (capabilityProperty.getDataType().equals("string")) {
                measureList.put(capabilityProperty.getName(),
                    String.valueOf(Calendar.getInstance().getTimeInMillis()));
            } else if (capabilityProperty.getDataType().equals("double")) {
                measureList.put(capabilityProperty.getName(), random.nextDouble());
            } else if (capabilityProperty.getName().equals("_time")) {
                measureList.put(capabilityProperty.getName(), Calendar.getInstance().getTimeInMillis());
            } else if (capabilityProperty.getDataType().equals("float")) {
                measureList.put(capabilityProperty.getName(), random.nextFloat());
            } else if (capabilityProperty.getDataType().equals("integer")) {
                measureList.put(capabilityProperty.getName(), Integer.valueOf(random.nextInt()));
            } else if (capabilityProperty.getDataType().equals("long")) {
                measureList.put(capabilityProperty.getName(), random.nextLong());
            } else if (capabilityProperty.getDataType().equals("boolean")) {
                measureList.put(capabilityProperty.getName(), random.nextBoolean());
            } else if (capabilityProperty.getDataType().equals("binary")) {
                byte[] array = new byte[7];
                random.nextBytes(array);
                measureList.put(capabilityProperty.getName(), array);
            } else {
                measureList.put(capabilityProperty.getName(), random.nextFloat());
            }

        }
        message.setMeasures(Collections.singletonList(measureList));
        return message;
    }

}
