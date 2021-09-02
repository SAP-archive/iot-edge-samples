package com.sap.persistenceservice.refapp.controller;

import java.util.List;

import org.eclipse.paho.client.mqttv3.MqttException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sap.persistenceservice.refapp.bean.ConfigMetricBean;
import com.sap.persistenceservice.refapp.bean.Metrics;
import com.sap.persistenceservice.refapp.bean.RetentionLoadTestConfig;
import com.sap.persistenceservice.refapp.entity.LoadTestConfig;
import com.sap.persistenceservice.refapp.exception.PayloadValidationException;
import com.sap.persistenceservice.refapp.service.LoadGeneratorService;
import com.sap.persistenceservice.refapp.service.MetricsService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@Tag(name = "Load generator")
public class LoadGenerator {

    private static final Logger log = LoggerFactory.getLogger(LoadGenerator.class);

    @Autowired
    private LoadGeneratorService loadGeneratorService;

    @Autowired
    private MetricsService metricsService;

    @PostMapping(value = "/loadGenerator")
    @Operation(description = "Load generator configuration")
    public LoadTestConfig startLoadTest(@RequestBody LoadTestConfig request,
        @RequestParam(value = "collectMetrics", required = true, defaultValue = "true") boolean collectMetrics)
        throws PayloadValidationException, MqttException {
        log.info("Start load generator");
        return loadGeneratorService.startLoadGenerator(request, collectMetrics);
    }

    @PostMapping(value = "/loadGenerator/retention")
    @Operation(description = "Load generator configuration")
    public LoadTestConfig startLoadTestWithRetention(@RequestBody RetentionLoadTestConfig request)
        throws PayloadValidationException, MqttException {
        log.info("Start load generator with retention");
        return loadGeneratorService.startLoadGenerator(request, true);
    }

    @GetMapping(value = "/loadTestMetrics")
    @Operation(description = "Returns the metrics for number of tests run so far")
    public List<Metrics> returnMatrics() {
        return metricsService.collectMetrics();
    }

    @GetMapping(value = "/loadTestMetrics/{testName}")
    @Operation(description = "Returns the metrics for number of tests run so far")
    public ConfigMetricBean returnMatricsForLoadTestConfig(String testName) {
        return metricsService.collectMetricsForLoadTest(testName);
    }

}
