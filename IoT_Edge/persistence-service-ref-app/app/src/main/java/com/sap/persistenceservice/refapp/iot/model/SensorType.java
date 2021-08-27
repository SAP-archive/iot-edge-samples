package com.sap.persistenceservice.refapp.iot.model;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class SensorType {

    private static final Logger log = LoggerFactory.getLogger(SensorType.class);

    @JsonProperty("id")
    String id;

    @JsonProperty("alternateId")
    String alternateId;

    @JsonProperty("name")
    String name;

    @JsonProperty("capabilities")
    List<CapabilityAssignment> capabilities;

    /**
     * This method returns if the sensor type is valid or not
     * 
     * @param sensorType
     * @return
     */
    public boolean isValid() {

        if (id == null || id.isEmpty()) {
            log.error("Sensor type id is empty or invalid");
            return false;
        }

        if (name == null || name.isEmpty()) {
            log.error("Sensor type with id {} has no name associated with it", id);
            return false;
        }

        if (capabilities == null || capabilities.isEmpty()) {
            log.error("Sensor type with id {} has no capabilities associated with it", id);
            return false;
        }

        return true;
    }

}
