package com.sap.persistenceservice.refapp.entity;

import java.io.Serializable;
import java.util.UUID;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.sap.persistenceservice.refapp.utils.Constants;

@Entity
@Table(name = Constants.LOAD_TEST_CONFIG)
public class LoadTestConfig implements Serializable {

    /**
     * 
     */
    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "TEST_NAME")
    @JsonProperty("name")
    private String testName;

    @Column(name = "CONNECTION_STRING")
    @JsonProperty("connectionUrl")
    private String connectionUrl;

    @Column(name = "DEVICE_ALTERNATE_ID")
    @JsonProperty("deviceAlternateId")
    private String deviceAlternateId;

    @Column(name = "FREQUENCY")
    @JsonProperty("frequency")
    private int frequency;

    @Column(name = "DURATION")
    @JsonProperty("duration")
    private int duration;

    @Column(name = "METRICS_COLLECTION_DELAY")
    @JsonProperty("metricsCollectionDelay")
    private int metricsCollectionDelay;

    @Column(name = "NO_OF_THREADS")
    @JsonProperty("noOfThreads")
    private int noOfThreads;

    public String getConnectionUrl() {
        return connectionUrl;
    }

    public void setConnectionUrl(String connectionUrl) {
        this.connectionUrl = connectionUrl;
    }

    public String getDeviceAlternateId() {
        return deviceAlternateId;
    }

    public void setDeviceAlternateId(String deviceAlternateId) {
        this.deviceAlternateId = deviceAlternateId;
    }

    public int getFrequency() {
        return frequency;
    }

    public void setFrequency(int frequency) {
        this.frequency = frequency;
    }

    public int getDuration() {
        return duration;
    }

    public void setDuration(int duration) {
        this.duration = duration;
    }

    public int getMetricsCollectionDelay() {
        return metricsCollectionDelay;
    }

    public void setMetricsCollectionDelay(int metricsCollectionDelay) {
        this.metricsCollectionDelay = metricsCollectionDelay;
    }

    public String getTestName() {
        return testName;
    }

    public int getNoOfThreads() {
        return noOfThreads;
    }

    public void setNoOfThreads(int noOfThreads) {
        this.noOfThreads = noOfThreads;
    }

    @JsonSetter
    public void setTestName(String testName) {
        if (testName == null || testName.isEmpty()) {
            testName = UUID.randomUUID().toString();
        }
        this.testName = testName;
    }

}
