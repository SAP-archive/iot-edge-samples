package com.sap.persistenceservice.refapp.bean;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

public class MeasureRequest {

    @JsonProperty("capabilityAlternateId")
    private String capabilityAlternateId;

    @JsonProperty("sensorAlternateId")
    private String sensorAlternateId;

    @JsonProperty("deviceAlternateId")
    private String deviceAlternateId;

    @JsonProperty("measures")
    private List<Map<String, String>> measures;

    @JsonProperty("externalIp")
    private String externalIp;

    public String getCapabilityAlternateId() {
        return capabilityAlternateId;
    }

    public void setCapabilityAlternateId(String capabilityAlternateId) {
        this.capabilityAlternateId = capabilityAlternateId;
    }

    public String getSensorAlternateId() {
        return sensorAlternateId;
    }

    public void setSensorAlternateId(String sensorAlternateId) {
        this.sensorAlternateId = sensorAlternateId;
    }

    public String getDeviceAlternateId() {
        return deviceAlternateId;
    }

    public void setDeviceAlternateId(String deviceAlternateId) {
        this.deviceAlternateId = deviceAlternateId;
    }

    public List<Map<String, String>> getMeasures() {
        return measures;
    }

    public void setMeasures(List<Map<String, String>> measures) {
        this.measures = measures;
    }

    public String getExternalIp() {
        return externalIp;
    }

    public void setExternalIp(String externalIp) {
        this.externalIp = externalIp;
    }

}
