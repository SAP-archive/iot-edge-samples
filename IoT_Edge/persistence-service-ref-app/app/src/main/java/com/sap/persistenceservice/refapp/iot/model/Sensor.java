package com.sap.persistenceservice.refapp.iot.model;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class Sensor {

    private static final Logger log = LoggerFactory.getLogger(Sensor.class);

    @JsonProperty("id")
    String id;

    @JsonProperty("alternateId")
    String alternateId;

    @JsonProperty("name")
    String name;

    @JsonProperty("deviceId")
    String deviceId;

    @JsonProperty("sensorTypeAlternateId")
    String sensorTypeAlternateId;

    /**
     * This method checks if the sensor has valid fields or not
     * 
     * @return
     */
    public boolean isValid() {
        if (id == null || id.isEmpty()) {
            log.error("Sensor id cannot be null or empty");
            return false;
        }

        if (name == null || name.isEmpty()) {
            log.error("Sensor name cannot be null or empty");
            return false;
        }

        if (deviceId == null || deviceId.isEmpty()) {
            log.error("device id for sensor with id {} cannot be null or empty", id);
            return false;
        }

        if (sensorTypeAlternateId == null || sensorTypeAlternateId.isEmpty()) {
            log.error("sensor type alternate id for sensor id {} cannot be null or empty", id);
            return false;
        }
        return true;
    }

}
