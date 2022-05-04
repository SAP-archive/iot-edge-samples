package com.sap.persistenceservice.refapp.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sap.persistenceservice.refapp.utils.Constants;

import javax.persistence.*;
import java.io.Serializable;

/**
 *  A single instance of a test run against the persistence service
 */
@Entity
@Table(name = Constants.TEST_RUN_CONFIG)
public class TestRunConfig implements Serializable {

    /**
     *
     */
    private static final long serialVersionUID = 1L;

    @EmbeddedId
    private TestKey testId = new TestKey();

    @Column(name = "TEST_NAME")
    @JsonProperty("name")
    private String testName;

    @Column(name = "MEASURES_PER_SECOND")
    @JsonProperty("measuresPerSecond")
    private int measuresPerSecond;

    @Column(name = "DURATION_SECONDS")
    @JsonProperty("durationSeconds")
    private int durationSeconds;

    @Column(name = "CONNECTION_STRING")
    @JsonProperty("connectionUrl")
    private String connectionUrl;

    @Column(name = "DEVICE_ALTERNATE_ID")
    @JsonProperty("deviceAlternateId")
    private String deviceAlternateId;

    @Column(name = "NO_OF_THREADS")
    @JsonProperty("noOfThreads")
    private int noOfThreads;

    @Column(name = "POLLING_FREQ_MILLIS")
    @JsonProperty("pollingFreqMillis")
    private int pollingFreqMillis;

    @Column(name = "COMPLETED_SUCCESSFULLY")
    @JsonProperty("completedSuccessfully")
    private boolean completedSuccessfully;

    @Column(name = "START_TIME")
    @JsonProperty("startTime")
    private long startTime;

    @Column(name = "FINISH_TIME")
    @JsonProperty("finishTime")
    private long finishTime;

    @Column(name = "MEASURES_SENT_ACTUAL")
    @JsonProperty("measuresSentActual")
    private long measuresSentActual;

    @Column(name = "MEASURES_ARRIVED_ACTUAL")
    @JsonProperty("measuresArrivedActual")
    private long measuresArrivedActual;

    @Column(name = "PROGRESS_AFTER_ALL_SENT")
    @JsonProperty("progressAfterAllSent")
    private long progressAfterAllSent;

    public TestRunConfig() {
    }

    public TestRunConfig(String testId, int sequence,
                         String testName, int measuresPerSecond, int durationSeconds,
                         String connectionUrl, String deviceAlternateId, int noOfThreads, int pollingFreqMillis) {
        this.testId.setTestId(testId);
        this.testId.setSequence(sequence);
        this.testName = testName;
        this.measuresPerSecond = measuresPerSecond;
        this.durationSeconds = durationSeconds;
        this.connectionUrl = connectionUrl;
        this.deviceAlternateId = deviceAlternateId;
        this.noOfThreads = noOfThreads;
        this.pollingFreqMillis = pollingFreqMillis;
    }

    public String getTestId() {
        return testId.getTestId();
    }

    public void setTestId(String testId) {
        this.testId.setTestId(testId);
    }

    public int getSequence() {
        return testId.getSequence();
    }

    public void setSequence(int sequence) {
        this.testId.setSequence(sequence);
    }

    public String getTestName() {
        return testName;
    }

    public void setTestName(String testName) {
        this.testName = testName;
    }

    public int getMeasuresPerSecond() {
        return measuresPerSecond;
    }

    public void setMeasuresPerSecond(int measuresPerSecond) {
        this.measuresPerSecond = measuresPerSecond;
    }

    public int getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(int durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

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

    public int getNoOfThreads() {
        return noOfThreads;
    }

    public void setNoOfThreads(int noOfThreads) {
        this.noOfThreads = noOfThreads;
    }

    public int getPollingFreqMillis() {
        return pollingFreqMillis;
    }

    public void setPollingFreqMillis(int pollingFreqMillis) {
        this.pollingFreqMillis = pollingFreqMillis;
    }

    public boolean isCompletedSuccessfully() {
        return completedSuccessfully;
    }

    public void setCompletedSuccessfully(boolean completedSuccessfully) {
        this.completedSuccessfully = completedSuccessfully;
    }

    public long getStartTime() {
        return startTime;
    }

    public void setStartTime(long startTime) {
        this.startTime = startTime;
    }

    public long getFinishTime() {
        return finishTime;
    }

    public void setFinishTime(long finishTime) {
        this.finishTime = finishTime;
    }

    public long getMeasuresSentActual() {
        return measuresSentActual;
    }

    public void setMeasuresSentActual(long measuresSentActual) {
        this.measuresSentActual = measuresSentActual;
    }

    public long getMeasuresArrivedActual() {
        return measuresArrivedActual;
    }

    public void setMeasuresArrivedActual(long measuresArrivedActual) {
        this.measuresArrivedActual = measuresArrivedActual;
    }

    public long getProgressAfterAllSent() {
        return progressAfterAllSent;
    }

    public void setProgressAfterAllSent(long progressAfterAllSent) {
        this.progressAfterAllSent = progressAfterAllSent;
    }

    public void setTestResults(long startTime, long finishTime, boolean completedSuccessfully,
                               long measuresSentActual, long measuresArrivedActual, long progressAfterAllSent) {
        this.startTime = startTime;
        this.finishTime = finishTime;
        this.completedSuccessfully = completedSuccessfully;
        this.measuresSentActual = measuresSentActual;
        this.measuresArrivedActual = measuresArrivedActual;
        this.progressAfterAllSent = progressAfterAllSent;
    }
}

