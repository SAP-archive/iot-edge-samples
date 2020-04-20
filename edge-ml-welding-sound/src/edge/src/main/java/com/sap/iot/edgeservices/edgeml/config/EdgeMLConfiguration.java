package com.sap.iot.edgeservices.edgeml.config;

import java.io.Serializable;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public class EdgeMLConfiguration implements Serializable {

    /**
     * Generated serial version UID.
     */
    private static final long serialVersionUID = -7046615135308372173L;

    @JsonProperty(value = "outputIoTService")
    private IoTServiceInformation outputIoTService;

    @JsonProperty(value = "tensorflowServer")
    private TensorFlowServerInformation tfServerInformation;

    @JsonProperty(value = "logging")
    private LoggingInformation logging;

    @JsonProperty(value = "classifications")
    private List<String> classifications;

    @JsonProperty(value = "modelDownloadInterval")
    private float modelDownloadInterval = 2880.0f; // default download interval of 2 days

    @JsonProperty(value = "configVersion")
    private String configVersion;


    public IoTServiceInformation getOutputIoTService() {
        return outputIoTService;
    }

    public void setOutputIoTService(IoTServiceInformation outputIoTService) {
        this.outputIoTService = outputIoTService;
    }

    public TensorFlowServerInformation getTfServerInformation() {
        return tfServerInformation;
    }

    public void setTfServerInformation(TensorFlowServerInformation tfServerInformation) {
        this.tfServerInformation = tfServerInformation;
    }

    public LoggingInformation getLogging() {
        return logging;
    }

    public void setLogging(LoggingInformation logging) {
        this.logging = logging;
    }

    public List<String> getClassifications() {
        return classifications;
    }

    public void setClassifications(List<String> classifications) {
        this.classifications = classifications;
    }

    public float getModelDownloadInterval() {
        return modelDownloadInterval;
    }

    public void setModelDownloadInterval(float modelDownloadInterval) {
        this.modelDownloadInterval = modelDownloadInterval;
    }

    public String getConfigVersion() {
        return configVersion;
    }

    public void setConfigVersion(String configVersion) {
        this.configVersion = configVersion;
    }
}
