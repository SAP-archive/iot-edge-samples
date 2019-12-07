package com.sap.iot.edgeservices.edgeml.config;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonProperty;

public class LoggingInformation implements Serializable {

    /**
     * Generated serial version UID.
     */
    private static final long serialVersionUID = -2920009961164636668L;

    @JsonProperty(value = "bundleLogLevel")
    private String bundleLogLevel = "INFO";

    @JsonProperty(value = "daemonLogLevel")
    private String daemonLogLevel = "INFO";


    public String getBundleLogLevel() {
        return bundleLogLevel;
    }

    public void setBundleLogLevel(String bundleLogLevel) {
        this.bundleLogLevel = bundleLogLevel;
    }

    public String getDaemonLogLevel() {
        return daemonLogLevel;
    }

    public void setDaemonLogLevel(String daemonLogLevel) {
        this.daemonLogLevel = daemonLogLevel;
    }

}
