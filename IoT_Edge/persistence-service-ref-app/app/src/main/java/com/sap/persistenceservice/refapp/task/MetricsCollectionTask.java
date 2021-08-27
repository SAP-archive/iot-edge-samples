package com.sap.persistenceservice.refapp.task;

import java.io.IOException;
import java.util.Date;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;

import org.apache.http.client.methods.HttpGet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.persistenceservice.refapp.bean.Measure;
import com.sap.persistenceservice.refapp.entity.LoadTestConfig;
import com.sap.persistenceservice.refapp.entity.Metric;
import com.sap.persistenceservice.refapp.repository.MetricRepository;
import com.sap.persistenceservice.refapp.service.ConnectionPoolManager;
import com.sap.persistenceservice.refapp.utils.Constants;
import com.sap.persistenceservice.refapp.utils.HttpRequestUtil;
import com.sap.persistenceservice.refapp.utils.MessageUtil;
import com.sap.persistenceservice.refapp.utils.RefAppEnv;

public class MetricsCollectionTask implements Runnable {

    private static final Logger log = LoggerFactory.getLogger(MetricsCollectionTask.class);

    private LoadTestConfig loadTestConfig;

    private ExecutorService executorService;

    private int metricsCollectionDelay;

    private ObjectMapper objectMapper;

    private ConnectionPoolManager connectionPoolManager;

    private MetricRepository metricRepository;

    public MetricsCollectionTask(MetricsCollectionTaskBean parameterObject) {
        this.loadTestConfig = parameterObject.getLoadTestConfig();
        this.executorService = parameterObject.getExecutorService();
        this.metricsCollectionDelay = parameterObject.getMetricsCollectionDelay();
        this.objectMapper = parameterObject.getObjectMapper();
        this.connectionPoolManager = parameterObject.getConnectionPoolManager();
        this.metricRepository = parameterObject.getMetricRepository();
    }

    @Override
    public void run() {

        try {
            Thread.sleep(metricsCollectionDelay * 1000);
        } catch (InterruptedException ex) {
            log.error("Error while halting thread {}", ex.getMessage());
        }

        log.info("Metric collector is invoked");

        String url = RefAppEnv.PERSISTENCE_SERVICE_MEASURE_URL
            + "measures?$expand=*&$top=1&$orderby=timestamp%20desc";
        HttpGet get = new HttpGet(url);
        get.setHeader(Constants.ACCEPT_HEADER, "application/json");
        try {
            Measure measure = objectMapper.readValue(
                HttpRequestUtil.getRawData(get, connectionPoolManager.getConnectionPoolManager()),
                Measure.class);

            Date date = new Date(MessageUtil.getInstance().getStartTime().get());
            Metric metric = new Metric(date, measure.getValue().get(0).getTimestamp(), loadTestConfig);
            metricRepository.save(metric);
        } catch (IOException ex) {
            log.error("Error while parsing the response {}", ex.getMessage());
        }
        try {
            executorService.shutdown();
            executorService.awaitTermination(5, TimeUnit.SECONDS);
        } catch (InterruptedException ex) {
            log.error("Error while shutting down the executor ", ex);
        }
        MessageUtil.getInstance().reset();

        log.info("Metrics collection done. End of test {} run", loadTestConfig.getTestName());
    }

}
