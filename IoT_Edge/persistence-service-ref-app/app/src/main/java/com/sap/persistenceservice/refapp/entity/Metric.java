package com.sap.persistenceservice.refapp.entity;

import java.io.Serializable;
import java.util.Date;
import java.util.Random;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.sap.persistenceservice.refapp.utils.Constants;

@Entity
@Table(name = Constants.METRIC)
public class Metric implements Serializable {

    /**
     * 
     */
    private static final long serialVersionUID = -5503138917001875102L;

    @Id
    @Column(name = "id")
    @JsonIgnore
    private Integer id;

    @Column(name = "START_TIME")
    @Temporal(TemporalType.TIMESTAMP)
    @JsonProperty("startTime")
    private Date startTime;

    @Column(name = "END_TIME")
    @JsonProperty("endTime")
    @Temporal(TemporalType.TIMESTAMP)
    private Date endTime;

    @Column(name = "DURATION")
    @JsonProperty("duration")
    private long duration;

    @Column(name = "AVERAGE")
    @JsonProperty("average")
    private double average;

    @Column(name = "TEST_NAME")
    @JsonProperty("testName")
    private String testName;

    @Column(name="FREQUENCY")
    @JsonProperty("frequency")
    private int frequency;

    /**
     * Default constructor
     */
    public Metric() {

    }

    public Metric(Date startTime, Date endTime, LoadTestConfig testConfig) {
        id = new Random().nextInt();
        this.startTime = startTime;
        this.endTime = endTime;
        this.duration = endTime.getTime() - startTime.getTime();
        this.testName = testConfig.getTestName();
        this.average = duration / (testConfig.getFrequency() * testConfig.getDuration());
        this.frequency = testConfig.getFrequency();
    }

    public String getTestName() {
        return testName;
    }

    public void setTestName(String testName) {
        this.testName = testName;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setStartTime(Date startTime) {
        this.startTime = startTime;
    }

    public void setEndTime(Date endTime) {
        this.endTime = endTime;
    }

    public Integer getId() {
        return id;
    }

    public Date getStartTime() {
        return startTime;
    }

    public Date getEndTime() {
        return endTime;
    }

    public long getDuration() {
        return duration;
    }

    public void setDuration(long duration) {
        this.duration = duration;
    }

    public double getAverage() { return average; }

    public void setAverage(double average) { this.average = average; }

    public int getFrequency() { return frequency; }

    public void setFrequency(int frequency) { this.frequency = frequency; }
}
