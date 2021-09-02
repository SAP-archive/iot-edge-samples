package com.sap.persistenceservice.refapp.bean;

import java.util.Date;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class MeasureValue {

    @JsonProperty("measureId")
    private String measureId;

    @JsonProperty("gatewayId")
    private String gatewayId;

    @JsonProperty("gatewayAlternateId")
    private String gatewayAlternateId;

    @JsonProperty("deviceId")
    private String deviceId;

    @JsonProperty("deviceAlternateId")
    private String deviceAlternateId;

    @JsonProperty("sensorId")
    private String sensorId;

    @JsonProperty("sensorAlternateId")
    private String sensorAlternateId;

    @JsonProperty("sensorTypeId")
    private String sensorTypeId;

    @JsonProperty("sensorTypeAlternateId")
    private String sensorTypeAlternateId;

    @JsonProperty("capabilityId")
    private String capabilityId;

    @JsonProperty("capabilityAlternateId")
    private String capabilityAlternateId;

    @JsonProperty("timestamp")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS")
    private Date timestamp;

    @JsonProperty("gatewayTimestamp")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS")
    private Date gatewayTimestamp;

    @JsonProperty("measureData")
    private List<MeasureData> measureData;

    public MeasureValue() {
    }

}
