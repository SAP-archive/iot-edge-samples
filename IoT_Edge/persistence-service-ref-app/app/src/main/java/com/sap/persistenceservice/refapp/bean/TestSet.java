package com.sap.persistenceservice.refapp.bean;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;

import javax.persistence.OneToMany;
import java.io.Serializable;
import java.util.List;
import java.util.UUID;

/**
 *  A set of tests to be run in sequence against the persistence service
 */
public class TestSet implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("name")
    private String testSetName;

    @JsonProperty("connectionUrl")
    private String connectionUrl;

    @JsonProperty("deviceAlternateId")
    private String deviceAlternateId;

    @JsonProperty("iterations")
    private int iterations;

    @JsonProperty("noOfThreads")
    private int noOfThreads;

    @JsonProperty("pollingFreqMillis")
    private int pollingFreqMillis;

    @JsonProperty("tests")
    @OneToMany(mappedBy = "testSetId", targetEntity = TestRun.class)
    private List<TestRun> tests;

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

    public String getTestSetName() {
        return testSetName;
    }

    public int getIterations() {
        return iterations;
    }

    public void setIterations(int iterations) {
        this.iterations = iterations;
    }

    public int getNoOfThreads() {
        return noOfThreads;
    }

    public void setNoOfThreads(int noOfThreads) {
        this.noOfThreads = noOfThreads;
    }

    public List<TestRun> getTests() {
        return tests;
    }

    public int getPollingFreqMillis() {
        return pollingFreqMillis;
    }

    public void setPollingFreqMillis(int pollingFreqMillis) {
        this.pollingFreqMillis = pollingFreqMillis;
    }

    @JsonSetter
    public void setTestSetName(String testSetName) {
        if (testSetName == null || testSetName.isEmpty()) {
            testSetName = UUID.randomUUID().toString();
        }
        this.testSetName = testSetName;
    }
}
