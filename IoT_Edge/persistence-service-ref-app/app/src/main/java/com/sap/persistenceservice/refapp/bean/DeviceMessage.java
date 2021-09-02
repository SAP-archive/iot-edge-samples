package com.sap.persistenceservice.refapp.bean;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DeviceMessage implements Serializable {

    /**
     * 
     */
    private static final long serialVersionUID = 5177800869250496894L;

    @JsonProperty("sensorAlternateId")
    String sensorAlternateId;

    @JsonProperty("capabilityAlternateId")
    String capabilityAlternateId;

    @JsonProperty("measures")
    List<Map<String, Object>> measures;

    public String getSensorAlternateId() {
        return sensorAlternateId;
    }

    public void setSensorAlternateId(String sensorAlternateId) {
        this.sensorAlternateId = sensorAlternateId;
    }

    public String getCapabilityAlternateId() {
        return capabilityAlternateId;
    }

    public void setCapabilityAlternateId(String capabilityAlternateId) {
        this.capabilityAlternateId = capabilityAlternateId;
    }

    public List<Map<String, Object>> getMeasures() {
        return measures;
    }

    public void setMeasures(List<Map<String, Object>> measures) {
        this.measures = measures;
    }

}
