package com.sap.persistenceservice.refapp.bean;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class SchemaBean {

    @JsonProperty("name")
    private String name;

    @JsonProperty("config")
    private SchemaConfigBean config;

    public SchemaBean() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public SchemaConfigBean getConfig() {
        return config;
    }

    public void setConfig(SchemaConfigBean config) {
        this.config = config;
    }
}
