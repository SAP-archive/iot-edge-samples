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
public class Device {

    private static final Logger log = LoggerFactory.getLogger(Device.class);

    @JsonProperty("id")
    String id;

    @JsonProperty("online")
    Boolean online;

    @JsonProperty("alternateId")
    String alternateId;

    @JsonProperty("name")
    String name;

    @JsonProperty("gatewayId")
    String gatewayId;

    @JsonProperty("sensors")
    List<Sensor> sensors;

    @JsonProperty("customProperties")
    CustomProperty[] customProperties;

    /**
     * This method checks if device has valid fields or not
     * 
     * @return
     */
    public boolean isValid() {

        if (id == null || id.isEmpty()) {
            log.error("device id is empty or null");
            return false;
        }

        if (name == null || name.isEmpty()) {
            log.error("device with id {} has name which is null or empty", id);
            return false;
        }

        if (gatewayId == null || gatewayId.isEmpty()) {
            log.error("device with id {} has gatewayId which is null or empty", id);
            return false;
        }

        // A device can have 0 sensors - This could happen at device creation time
        if (sensors == null || sensors.isEmpty()) {
            return true;
        }

        for (Sensor sensor : sensors) {
            if (!sensor.isValid()) {
                log.error("device with id {} has invalid sensor", id);
                return false;
            }

        }
        return true;
    }

}
