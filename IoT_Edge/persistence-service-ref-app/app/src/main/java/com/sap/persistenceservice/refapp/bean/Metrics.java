package com.sap.persistenceservice.refapp.bean;

import java.io.Serializable;

import com.sap.persistenceservice.refapp.entity.LoadTestConfig;
import com.sap.persistenceservice.refapp.entity.Metric;

public class Metrics implements Serializable {

    /**
     * 
     */
    private static final long serialVersionUID = 5688334123917497074L;

    private Metric metric;

    private LoadTestConfig testConfig;

    public Metrics(Metric metric, LoadTestConfig testConfig) {
        this.metric = metric;
        this.testConfig = testConfig;
    }

    public Metric getMetric() {
        return metric;
    }

    public void setMetric(Metric metric) {
        this.metric = metric;
    }

    public LoadTestConfig getTestConfig() {
        return testConfig;
    }

    public void setTestConfig(LoadTestConfig testConfig) {
        this.testConfig = testConfig;
    }
    
    

}
