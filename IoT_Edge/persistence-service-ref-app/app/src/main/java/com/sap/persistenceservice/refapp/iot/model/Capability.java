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
public class Capability {

    private static final Logger log = LoggerFactory.getLogger(Capability.class);

    @JsonProperty("id")
    String id;

    @JsonProperty("alternateId")
    String alternateId;

    @JsonProperty("name")
    String name;

    @JsonProperty("properties")
    List<Property> properties;

    /**
     * This method checks the validity of the capability
     * 
     * @param capability
     * @return
     */
    public boolean isValid() {

        if (id == null || id.isEmpty()) {
            log.error("Capability id is empty");
            return false;
        }

        if (properties == null || properties.isEmpty()) {
            log.error("Capability with id {} does not have any properties", id);
            return false;
        }

        if (name == null || name.isEmpty()) {
            log.error("Capability with id {} does not have a name", id);
            return false;
        }

        return true;
    }
}
