package com.sap.persistenceservice.refapp.bean;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

public class MeasureBean {

    @JsonProperty("capabilityAlternateId")
    private String capabilityAlternateId;

    @JsonProperty("sensorAlternateId")
    private String sensorAlternateId;

    @JsonProperty("measures")
    private List<Map<String, String>> measures;

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

    public List<Map<String, String>> getMeasures() {
        return measures;
    }

    public void setMeasures(List<Map<String, String>> measures) {
        this.measures = measures;
    }

}
