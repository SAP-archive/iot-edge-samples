package com.sap.persistenceservice.refapp.iot.model;

public class DeviceMessagePojo {

    private String deviceAlternateId;

    private String sensorAlternateId;

    private Capability capability;

    public DeviceMessagePojo(String deviceAlternateId, String sensorAlternateId, Capability capability) {
        this.deviceAlternateId = deviceAlternateId;
        this.sensorAlternateId = sensorAlternateId;
        this.capability = capability;
    }

    public String getDeviceAlternateId() {
        return deviceAlternateId;
    }

    public String getSensorAlternateId() {
        return sensorAlternateId;
    }

    public Capability getCapability() {
        return capability;
    }

}
