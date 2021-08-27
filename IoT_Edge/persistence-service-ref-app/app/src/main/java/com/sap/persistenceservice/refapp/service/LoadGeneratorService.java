package com.sap.persistenceservice.refapp.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.eclipse.paho.client.mqttv3.MqttAsyncClient;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.persistenceservice.refapp.bean.RetentionLoadTestConfig;
import com.sap.persistenceservice.refapp.entity.LoadTestConfig;
import com.sap.persistenceservice.refapp.exception.PayloadValidationException;
import com.sap.persistenceservice.refapp.iot.model.DeviceMessagePojo;
import com.sap.persistenceservice.refapp.repository.LoadTestRepository;
import com.sap.persistenceservice.refapp.repository.MetricRepository;
import com.sap.persistenceservice.refapp.task.LoadGenerationTask;
import com.sap.persistenceservice.refapp.task.MetricsCollectionTask;
import com.sap.persistenceservice.refapp.task.MetricsCollectionTaskBean;
import com.sap.persistenceservice.refapp.task.RetentionTriggerTask;
import com.sap.persistenceservice.refapp.utils.LoadTestUtil;
import com.sap.persistenceservice.refapp.utils.MessageUtil;
import com.sap.persistenceservice.refapp.utils.RefAppEnv;

@Service
public class LoadGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(LoadGeneratorService.class);

    @Autowired
    private MetricRepository metricRepository;

    @Autowired
    private LoadTestRepository loadTestRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ConnectionPoolManager connectionPoolManager;

    @Autowired
    private IotModelService iotModelService;

    public LoadTestConfig startLoadGenerator(LoadTestConfig request, boolean collectMetrics)
        throws PayloadValidationException {

        LoadTestUtil.validateConfig(request);

        boolean isRetention = request instanceof RetentionLoadTestConfig;

        int deleteCall = -1;

        double frequency = request.getFrequency(); // unit is msg/seconds
        double period_seconds = 1 / frequency; // how often (in seconds) should each thread send 1 message
        double maxMessages = frequency * request.getDuration();
        log.info("frequency = sending {} msg/sec, period = sending one message every {} seconds, maxMessages {}",
            frequency,
            period_seconds, maxMessages);
        double period_microseconds = 1000 * 1000 * period_seconds;

        List<DeviceMessagePojo> deviceMessagePojo = getDeviceMessages(request);

        ScheduledExecutorService scheduledExecutor = getScheduledExecutor(request.getNoOfThreads());

        if (isRetention) {
            deleteCall = ((RetentionLoadTestConfig) request).getRetentionAfter();
            new Thread(new RetentionTriggerTask(deleteCall, connectionPoolManager)).start();
        }

        LoadTestConfig savedConfig = null;
        if (isRetention) {
            savedConfig = loadTestRepository.save(LoadTestUtil.getTestConfig((RetentionLoadTestConfig) request));
        } else {
            savedConfig = loadTestRepository.save(request);
        }

        final List<MqttAsyncClient> clients;
        try {
            clients = getClients(savedConfig.getConnectionUrl(), request.getNoOfThreads());
        } catch (MqttException ex) {
            log.error("Error while connecting ", ex);
            return null;
        }

        List<LoadGenerationTask> taskList = new ArrayList<LoadGenerationTask>();
        for (int i = 0; i < request.getNoOfThreads(); i++) {
            taskList.add(new LoadGenerationTask(objectMapper, clients.get(i),
                LoadTestUtil.getRandomElement(deviceMessagePojo), maxMessages));
        }

        MessageUtil.getInstance().initStartTime();

        for (int i = 0; i < request.getNoOfThreads(); i++) {
            scheduledExecutor.scheduleAtFixedRate(taskList.get(i), 0, (long) period_microseconds,
                TimeUnit.MICROSECONDS);
        }

        ScheduleTerminator scheduleTerminator = new ScheduleTerminator(scheduledExecutor, request.getDuration(),
            clients);

        scheduleTerminator.start();

        collectMertics(request, collectMetrics, savedConfig, scheduledExecutor);

        return savedConfig;

    }

    private ScheduledExecutorService getScheduledExecutor(int noOfThreads) {

        return Executors.newScheduledThreadPool(noOfThreads, new ThreadFactory() {
            private final AtomicInteger counter = new AtomicInteger(0);

            @Override
            public Thread newThread(Runnable r) {
                final Thread t = new Thread(r);
                t.setName("Mqtt asyn client thread-" + counter.incrementAndGet());
                t.setDaemon(true);
                return t;
            }
        });
    }

    private List<MqttAsyncClient> getClients(String connectionUrl, int noOfThreads) throws MqttException {
        MqttConnectOptions connOpts = new MqttConnectOptions();
        connOpts.setAutomaticReconnect(true);
        connOpts.setCleanSession(true);
        connOpts.setHttpsHostnameVerificationEnabled(false);
        connOpts.setMaxReconnectDelay(60000);
        connOpts.setMaxInflight(RefAppEnv.MAX_IN_FLIGHT);

        List<MqttAsyncClient> asyncClients = new ArrayList<MqttAsyncClient>();

        for (int i = 0; i < noOfThreads; i++) {
            MqttAsyncClient asyncClient = new MqttAsyncClient(connectionUrl, MqttClient.generateClientId(),
                new MemoryPersistence());
            asyncClient.setCallback(new CustomMeasureMqttClient());
            asyncClient.connect(connOpts);
            while (true) {
                if (asyncClient.isConnected()) {
                    log.info("Client is connected");
                    break;
                }
            }
            asyncClients.add(asyncClient);
        }

        return asyncClients;
    }

    private List<DeviceMessagePojo> getDeviceMessages(LoadTestConfig request) throws PayloadValidationException {

        if (RefAppEnv.LOCAL_TEST) {
            return Collections.singletonList(LoadTestUtil.generateMessageForLocalTest(request));
        }
        return iotModelService.getDeviceMessages(request.getDeviceAlternateId());
    }

    private void collectMertics(LoadTestConfig request, boolean collectMetrics, LoadTestConfig savedConfig,
        ScheduledExecutorService scheduledExecutor) {

        if (collectMetrics) {
            MetricsCollectionTaskBean metricsCollectionParameter = new MetricsCollectionTaskBean();
            metricsCollectionParameter.setLoadTestConfig(savedConfig);
            metricsCollectionParameter.setExecutorService(scheduledExecutor);
            metricsCollectionParameter.setMetricsCollectionDelay(request.getMetricsCollectionDelay());
            metricsCollectionParameter.setObjectMapper(objectMapper);
            metricsCollectionParameter.setConnectionPoolManager(connectionPoolManager);
            metricsCollectionParameter.setMetricRepository(metricRepository);
            new Thread(new MetricsCollectionTask(metricsCollectionParameter)).start();
        }
    }

}
