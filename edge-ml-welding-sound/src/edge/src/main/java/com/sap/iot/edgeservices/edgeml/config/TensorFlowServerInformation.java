package com.sap.iot.edgeservices.edgeml.config;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TensorFlowServerInformation implements Serializable {

    /**
     * Generated serial version UID.
     */
    private static final long serialVersionUID = -700133741709917263L;

    @JsonProperty(value = "port")
    private String port;

    @JsonProperty(value = "restAPIPort")
    private String restAPIPort;

    @JsonProperty(value = "modelName")
    private String modelName;


    public String getPort() {
        return port;
    }
    public void setPort(String port) {
        this.port = port;
    }
    public String getRestAPIPort() {
        return restAPIPort;
    }
    public void setRestAPIPort(String restAPIPort) {
        this.restAPIPort = restAPIPort;
    }
    public String getModelName() {
        return modelName;
    }
    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

}
