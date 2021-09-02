package com.sap.persistenceservice.refapp.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sap.persistenceservice.refapp.bean.ConfigMetricBean;
import com.sap.persistenceservice.refapp.bean.Metrics;
import com.sap.persistenceservice.refapp.entity.LoadTestConfig;
import com.sap.persistenceservice.refapp.entity.Metric;
import com.sap.persistenceservice.refapp.repository.LoadTestRepository;
import com.sap.persistenceservice.refapp.repository.MetricRepository;

@Service
public class MetricsService {

    @Autowired
    private MetricRepository metricRepository;

    @Autowired
    private LoadTestRepository loadTestRepository;

    public ConfigMetricBean collectMetricsForLoadTest(String testName) {
        ConfigMetricBean bean = new ConfigMetricBean();
        List<Metric> metricList = new ArrayList<>();
        metricRepository.findByTestName(testName).forEach(metricList::add);
        bean.setMetrics(metricList);

        Optional<LoadTestConfig> testConfig = loadTestRepository.findById(testName);
        if (testConfig.isPresent()) {
            bean.setConfig(testConfig.get());
        }
        return bean;
    }

    public List<Metrics> collectMetrics() {

        List<Metric> metricList = new ArrayList<>();
        metricRepository.findAll().forEach(metricList::add);

        List<Metrics> metrics = new ArrayList<>();

        for (Metric metric : metricList) {
            metrics.add(new Metrics(metric, loadTestRepository.findById(metric.getTestName()).get()));
        }

        return metrics;
    }

}
