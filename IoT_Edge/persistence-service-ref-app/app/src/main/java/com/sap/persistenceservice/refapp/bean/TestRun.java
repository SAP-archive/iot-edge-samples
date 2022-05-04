package com.sap.persistenceservice.refapp.bean;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

/**
 *  A single instance of a test run against the persistence service
 */
public class TestRun implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("measuresPerSecond")
    private int measuresPerSecond;

    @JsonProperty("durationSeconds")
    private int durationSeconds;

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

}
