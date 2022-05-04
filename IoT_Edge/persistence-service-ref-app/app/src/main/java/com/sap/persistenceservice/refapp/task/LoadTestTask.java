package com.sap.persistenceservice.refapp.task;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.persistenceservice.refapp.entity.TestRunConfig;
import com.sap.persistenceservice.refapp.exception.PayloadValidationException;
import com.sap.persistenceservice.refapp.iot.model.DeviceMessagePojo;
import com.sap.persistenceservice.refapp.repository.TestRunRepository;
import com.sap.persistenceservice.refapp.service.ConnectionPoolManager;
import com.sap.persistenceservice.refapp.service.CustomMeasureMqttClient;
import com.sap.persistenceservice.refapp.service.IotModelService;
import com.sap.persistenceservice.refapp.service.ScheduleTerminator;
import com.sap.persistenceservice.refapp.utils.*;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpGet;
import org.eclipse.paho.client.mqttv3.MqttAsyncClient;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

public class LoadTestTask implements Runnable {

    private static final Logger log = LoggerFactory.getLogger(LoadTestTask.class);

    private final TestRunConfig testConfig;

    private final ObjectMapper objectMapper;

    private final ConnectionPoolManager connectionPoolManager;

    private final IotModelService iotModelService;

    private final TestRunRepository testRunRepository;

    public LoadTestTask(TestRunConfig testConfig, ObjectMapper objectMapper,
        ConnectionPoolManager connectionPoolManager, IotModelService iotModelService,
        TestRunRepository testRunRepository) {
        this.testConfig = testConfig;
        this.objectMapper = objectMapper;
        this.connectionPoolManager = connectionPoolManager;
        this.iotModelService = iotModelService;
        this.testRunRepository = testRunRepository;
    }

    @Override
    public void run() {

        log.info("Begin test {} of test set {} / {} ({} messages per second for {} seconds).",
            testConfig.getSequence(), testConfig.getTestId(), testConfig.getTestName(),
            testConfig.getMeasuresPerSecond(), testConfig.getDurationSeconds());

        log.debug("Getting MQTT clients for {} threads", testConfig.getNoOfThreads());
        final List<MqttAsyncClient> clients;
        try {
            clients = getClients(testConfig.getConnectionUrl(), testConfig.getNoOfThreads());
        } catch (MqttException e) {
            log.error("Error while connecting : ", e);
            return;
        }

        int measuresPerSecond = testConfig.getMeasuresPerSecond();
        double periodSeconds = 1 / (double) measuresPerSecond; // how often (in seconds) should each thread send 1
                                                               // message
        double periodMicroseconds = 1000 * 1000 * periodSeconds;
        long totalMessages = measuresPerSecond * testConfig.getDurationSeconds();

        log.debug("Build message objects for device with alternate id {}", testConfig.getDeviceAlternateId());
        List<DeviceMessagePojo> deviceMessagePojo;
        try {
            deviceMessagePojo = iotModelService.getDeviceMessages(testConfig.getDeviceAlternateId());
        } catch (PayloadValidationException e) {
            log.error("Error while building device message body ", e);
            return;
        }

        ScheduledExecutorService scheduledExecutor = getScheduledExecutor(testConfig.getNoOfThreads());

        log.debug("Enqueue all subtasks for test {}", testConfig.getSequence());
        List<LoadGenerationTask> taskList = new ArrayList<>();
        for (int i = 0; i < testConfig.getNoOfThreads(); i++) {
            taskList.add(new MQTTLoadGenerationTask(objectMapper, clients.get(i),
                LoadTestUtil.getRandomElement(deviceMessagePojo), totalMessages));
        }

        log.debug("Get current measure count prior to starting the test");
        long measureCountInitial;
        try {
            measureCountInitial = getMeasureCount();
        } catch (JsonProcessingException e) {
            log.error("Unable to fetch measure count, aborting run {} of test {}",
                testConfig.getSequence(), testConfig.getTestId());
            return;
        }

        long measureCountTarget = measureCountInitial + Math.round(totalMessages);

        MessageUtil.getInstance().initStartTime();

        log.debug("Begin scheduled execution of {} measures per second for {} seconds",
            testConfig.getMeasuresPerSecond(), testConfig.getDurationSeconds());
        AtomicLong startTime = new AtomicLong(Calendar.getInstance().getTimeInMillis());

        for (int i = 0; i < testConfig.getNoOfThreads(); i++) {
            scheduledExecutor.scheduleAtFixedRate(taskList.get(i), 0, (long) periodMicroseconds,
                TimeUnit.MICROSECONDS);
        }

        // Wait until all measures are sent before polling
        try {
            Thread.sleep(testConfig.getDurationSeconds() * 1000);
        } catch (InterruptedException e) {
            log.error("Interrupted exception: {}", e.getMessage());
        }

        log.debug("Poll measure count until all measures have arrived at destination (ie test complete)");
        long measureCountCurrent;
        AtomicLong requestStartTime = new AtomicLong(Calendar.getInstance().getTimeInMillis());
        try {
            measureCountCurrent = getMeasureCount();
        } catch (JsonProcessingException e) {
            log.error("Unable to fetch measure count, aborting run {} of test {}",
                testConfig.getSequence(), testConfig.getTestId());
            return;
        }

        AtomicLong requestEndTime = new AtomicLong(Calendar.getInstance().getTimeInMillis());
        long progressAfterAllSent = measureCountCurrent - measureCountInitial;
        long pollingFrequencyMillis = testConfig.getPollingFreqMillis();
        long requestTimeMillis = requestEndTime.longValue() - requestStartTime.longValue();
        long sleepTimeMillis = Math.max(pollingFrequencyMillis - requestTimeMillis, 0L);

        boolean completedSuccessfully = true;
        long measureCountPrevious;
        int timeoutCounter = 0;

        while (measureCountCurrent < measureCountTarget) {
            // If we poll many times with no new measures, assume test failure to avoid infinite polling
            if (timeoutCounter >= Constants.LOAD_TEST_POLLING_TIMEOUT_ITERATIONS) {
                log.error("Measure count has not increased after {} checks: test failure",
                    Constants.LOAD_TEST_POLLING_TIMEOUT_ITERATIONS);
                completedSuccessfully = false;
                break;
            }

            try {
                Thread.sleep(sleepTimeMillis);
            } catch (InterruptedException e) {
                log.error("Interrupted exception: {}", e.getMessage());
            }

            try {
                requestStartTime = new AtomicLong(Calendar.getInstance().getTimeInMillis());
                measureCountPrevious = measureCountCurrent;

                measureCountCurrent = getMeasureCount();
                log.debug("Current measure count: {} (initial: {}, this test: {}, target total: {})",
                    measureCountCurrent, measureCountInitial, totalMessages, measureCountTarget);

                requestEndTime = new AtomicLong(Calendar.getInstance().getTimeInMillis());
                requestTimeMillis = requestEndTime.longValue() - requestStartTime.longValue();

                // sleep millis before next fetch is the polling frequency minus time taken this iteration, but not < 0
                sleepTimeMillis = Math.max(pollingFrequencyMillis - requestTimeMillis, 0L);

                if (measureCountCurrent == measureCountPrevious) {
                    timeoutCounter++;
                } else {
                    timeoutCounter = 0;
                }
            } catch (JsonProcessingException e) {
                log.error("Unable to fetch measure count, aborting run {} of test {}",
                    testConfig.getSequence(), testConfig.getTestId());
                return;
            }
        }

        log.debug("Persisting test results");
        AtomicLong finishTime = new AtomicLong(Calendar.getInstance().getTimeInMillis());
        long measuresSentActual = MessageUtil.getInstance().getMessageCounter();
        long measuresArrivedActual = measureCountCurrent - measureCountInitial;
        testConfig.setTestResults(startTime.longValue(), finishTime.longValue(),
            completedSuccessfully, measuresSentActual, measuresArrivedActual, progressAfterAllSent);
        testRunRepository.save(testConfig);

        log.info("Test {} of run {} completed after {} milliseconds:\n" +
            "    Name:     {}\n" +
            "    Start:    {}\n" +
            "    Finish:   {}\n" +
            "    Msg/s:    {}\n" +
            "    Duration: {}s\n" +
            "    Messages sent:    {}\n" +
            "    Messages arrived: {}\n" +
            "    Progress after all sent: {} ({}%)\n" +
            "    Threads:  {}\n" +
            "    Polling freq: {}ms",
            testConfig.getSequence(), testConfig.getTestId(), finishTime.longValue() - startTime.longValue(),
            testConfig.getTestName(), startTime.longValue(), finishTime.longValue(),
            testConfig.getMeasuresPerSecond(), testConfig.getDurationSeconds(),
            measuresSentActual, measuresArrivedActual, progressAfterAllSent,
            (double) progressAfterAllSent / (double) totalMessages * 100, testConfig.getNoOfThreads(),
            testConfig.getPollingFreqMillis());

        log.debug("Clean up measures table");
        ResponseEntity<String> cleanupResponse = HttpRequestUtil.delete(new HttpDelete(Constants.RETENTION_API_URL),
            connectionPoolManager.getConnectionPoolManager());
        int cleanupResponseStatus = cleanupResponse.getStatusCodeValue();
        if (cleanupResponseStatus != 204) {
            log.error("Retention DELETE returned status code {} (expected 204), load test cleanup failed",
                cleanupResponseStatus);
        }

        log.debug("Terminate scheduledExecutor and clean up MQTT clients");
        ScheduleTerminator scheduleTerminator = new ScheduleTerminator(scheduledExecutor, 0, clients);
        scheduleTerminator.start();

        // wait before running next test to ensure retention job and scheduleTerminator have finished
        try {
            Thread.sleep(Constants.SECONDS_BETWEEN_LOAD_TESTS * 1000);
        } catch (InterruptedException e) {
            log.error("Interrupted exception: {}", e.getMessage());
        }

        MessageUtil.getInstance().reset();
    }

    private ScheduledExecutorService getScheduledExecutor(int noOfThreads) {
        return Executors.newScheduledThreadPool(noOfThreads, new ThreadFactory() {
            private final AtomicInteger counter = new AtomicInteger(0);

            @Override
            public Thread newThread(Runnable r) {
                final Thread t = new Thread(r);
                t.setName("MQTT async client thread-" + counter.incrementAndGet());
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

        List<MqttAsyncClient> asyncClients = new ArrayList<>();

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

    private long getMeasureCount() throws JsonProcessingException {

        String odataResponse = HttpRequestUtil.getRawData(new HttpGet(Constants.ODATA_COUNT_QUERY),
            connectionPoolManager.getConnectionPoolManager());

        JsonNode json = objectMapper.readTree(odataResponse);
        return json.get("@odata.count").asLong();

    }

}
