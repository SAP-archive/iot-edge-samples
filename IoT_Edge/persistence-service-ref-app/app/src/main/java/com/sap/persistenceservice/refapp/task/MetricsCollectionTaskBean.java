package com.sap.persistenceservice.refapp.task;

import java.util.concurrent.ExecutorService;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.persistenceservice.refapp.entity.LoadTestConfig;
import com.sap.persistenceservice.refapp.repository.MetricRepository;
import com.sap.persistenceservice.refapp.service.ConnectionPoolManager;

public class MetricsCollectionTaskBean {

    private LoadTestConfig loadTestConfig;
    private ExecutorService executorService;
    private int metricsCollectionDelay;
    private ObjectMapper objectMapper;
    private ConnectionPoolManager connectionPoolManager;
    private MetricRepository metricRepository;

    public LoadTestConfig getLoadTestConfig() {
        return loadTestConfig;
    }

    public void setLoadTestConfig(LoadTestConfig loadTestConfig) {
        this.loadTestConfig = loadTestConfig;
    }

    public ExecutorService getExecutorService() {
        return executorService;
    }

    public void setExecutorService(ExecutorService executorService) {
        this.executorService = executorService;
    }

    public int getMetricsCollectionDelay() { return metricsCollectionDelay; }

    public void setMetricsCollectionDelay(int metricsCollectionDelay) { this.metricsCollectionDelay = metricsCollectionDelay; }

    public ObjectMapper getObjectMapper() {
        return objectMapper;
    }

    public void setObjectMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ConnectionPoolManager getConnectionPoolManager() {
        return connectionPoolManager;
    }

    public void setConnectionPoolManager(ConnectionPoolManager connectionPoolManager) {
        this.connectionPoolManager = connectionPoolManager;
    }

    public MetricRepository getMetricRepository() {
        return metricRepository;
    }

    public void setMetricRepository(MetricRepository metricRepository) {
        this.metricRepository = metricRepository;
    }

}