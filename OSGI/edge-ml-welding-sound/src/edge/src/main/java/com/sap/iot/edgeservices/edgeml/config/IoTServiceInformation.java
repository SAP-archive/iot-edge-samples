package com.sap.iot.edgeservices.edgeml.config;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonProperty;

public class IoTServiceInformation implements Serializable {

    /**
     * Generated serial version UID.
     */
    private static final long serialVersionUID = 7925181553233084834L;

    @JsonProperty(value = "deviceId")
    private String deviceId;

    @JsonProperty(value = "sensorId")
    private String sensorId;

    @JsonProperty(value = "sensorTypeAlternateId")
    private String sensorTypeAlternateId;

    @JsonProperty(value = "capabilityAlternateId")
    private String capabilityAlternateId;

    @JsonProperty(value = "send")
    private Boolean sendToIoTService = true;


    public String getDeviceId() {
        return deviceId;
    }
    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }
    public String getSensorId() {
        return sensorId;
    }
    public void setSensorId(String sensorId) {
        this.sensorId = sensorId;
    }
    public String getSensorTypeAlternateId() {
        return sensorTypeAlternateId;
    }
    public void setSensorTypeAlternateId(String sensorTypeAlternateId) {
        this.sensorTypeAlternateId = sensorTypeAlternateId;
    }
    public String getCapabilityAlternateId() {
        return capabilityAlternateId;
    }
    public void setCapabilityAlternateId(String capabilityAlternateId) {
        this.capabilityAlternateId = capabilityAlternateId;
    }
    public Boolean getSendToIoTService() {
        return sendToIoTService;
    }
    public void setSendToIoTService(Boolean sendToIoTService) {
        this.sendToIoTService = sendToIoTService;
    }
}
