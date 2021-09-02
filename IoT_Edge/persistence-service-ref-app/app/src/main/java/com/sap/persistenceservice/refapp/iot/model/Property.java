package com.sap.persistenceservice.refapp.iot.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class Property {

    @JsonProperty("dataType")
    String dataType;

    @JsonProperty("formatter")
    NumberFormatterBean formatter;

    @JsonProperty("name")
    String name;

    @JsonProperty("unitOfMeasure")
    String unitOfMeasure;

}
