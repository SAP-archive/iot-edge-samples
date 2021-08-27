package com.sap.persistenceservice.refapp.bean;

import java.io.Serializable;
import java.util.List;

import com.sap.persistenceservice.refapp.entity.LoadTestConfig;
import com.sap.persistenceservice.refapp.entity.Metric;

public class ConfigMetricBean implements Serializable {

    /**
     * 
     */
    private static final long serialVersionUID = 85531758419293269L;

    private LoadTestConfig config;
    private List<Metric> metrics;

    public LoadTestConfig getConfig() {
        return config;
    }

    public void setConfig(LoadTestConfig config) {
        this.config = config;
    }

    public List<Metric> getMetrics() {
        return metrics;
    }

    public void setMetrics(List<Metric> metrics) {
        this.metrics = metrics;
    }

}
