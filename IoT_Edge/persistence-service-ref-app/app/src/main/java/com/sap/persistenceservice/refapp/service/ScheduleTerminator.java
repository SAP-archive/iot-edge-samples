package com.sap.persistenceservice.refapp.service;

import java.util.List;
import java.util.concurrent.ScheduledExecutorService;

import org.eclipse.paho.client.mqttv3.MqttAsyncClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ScheduleTerminator extends Thread {
    private ScheduledExecutorService scheduledExecutorService;
    private int duration;
    private List<MqttAsyncClient> clients;
    private static final Logger log = LoggerFactory.getLogger(ScheduleTerminator.class);

    public ScheduleTerminator(ScheduledExecutorService scheduledExecutorService, int duration,
        List<MqttAsyncClient> clients) {
        this.scheduledExecutorService = scheduledExecutorService;
        this.duration = duration;
        this.clients = clients;
    }

    public void run() {
        log.info("Waiting for {} seconds", duration);
        try {
            Thread.sleep(duration * 1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        log.info("{} seconds has passed. Shutting down executor.", duration);

        for (MqttAsyncClient mqttAsyncClient : clients) {
            try {
                mqttAsyncClient.disconnect();
                mqttAsyncClient.close(true);
            } catch (MqttException ex) {
                log.error("Error while closing mqttClient ", ex);
            }
        }
        scheduledExecutorService.shutdownNow();
    }
}
