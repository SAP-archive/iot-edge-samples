package com.sap.persistenceservice.refapp.iot.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class CapabilityAssignment {

    @JsonProperty("id")
    String id;

    @JsonProperty("type")
    String type;

}
