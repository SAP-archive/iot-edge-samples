package com.sap.persistenceservice.refapp.task;

import java.util.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.persistenceservice.refapp.bean.DeviceMessage;
import com.sap.persistenceservice.refapp.iot.model.DeviceMessagePojo;
import com.sap.persistenceservice.refapp.iot.model.Property;


public abstract class LoadGenerationTask implements Runnable {

    protected ObjectMapper objectMapper;

    protected DeviceMessagePojo deviceMessagePojo;

    protected String capabilityAlternateId;
    protected String sensorAlternateId;

    protected long maxMessages;

    private Random random = new Random();


    public LoadGenerationTask(ObjectMapper objectMapper, DeviceMessagePojo deviceMessagePojo, double maxMessages){
        this.objectMapper = objectMapper;
        this.deviceMessagePojo = deviceMessagePojo;
        this.maxMessages = Math.round(maxMessages);
        this.capabilityAlternateId = deviceMessagePojo.getCapability().getAlternateId();
        this.sensorAlternateId = deviceMessagePojo.getSensorAlternateId();
    }

    @Override
    public void run() {
    }

    /**
     * This method returns device message
     * 
     * @return
     */
    protected DeviceMessage createDeviceMessage() {
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
