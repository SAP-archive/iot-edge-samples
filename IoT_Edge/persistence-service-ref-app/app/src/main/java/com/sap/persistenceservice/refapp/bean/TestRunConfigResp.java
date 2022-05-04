package com.sap.persistenceservice.refapp.bean;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sap.persistenceservice.refapp.entity.TestRunConfig;

/**
 * A single instance of a test run against the persistence service Only used for initial POST response, and so does not
 * include results fields
 */
public class TestRunConfigResp implements Serializable {


    /**
     * 
     */
    private static final long serialVersionUID = 316502083530245296L;

    @JsonProperty("testId")
    private String testId;

    @JsonProperty("sequence")
    private int sequence;

    @JsonProperty("name")
    private String testName;

    @JsonProperty("measuresPerSecond")
    private int measuresPerSecond;

    @JsonProperty("durationSeconds")
    private int durationSeconds;

    @JsonProperty("noOfThreads")
    private int noOfThreads;

    @JsonProperty("pollingFreqMillis")
    private int pollingFreqMillis;

    public TestRunConfigResp(TestRunConfig object) {
        this.testId = object.getTestId();
        this.sequence = object.getSequence();
        this.testName = object.getTestName();
        this.measuresPerSecond = object.getMeasuresPerSecond();
        this.durationSeconds = object.getDurationSeconds();
        this.noOfThreads = object.getNoOfThreads();
        this.pollingFreqMillis = object.getPollingFreqMillis();
    }
}
