package com.sap.persistenceservice.refapp.controller;

import com.fasterxml.jackson.databind.node.ArrayNode;
import com.sap.persistenceservice.refapp.service.ConnectionPoolManager;
import com.sap.persistenceservice.refapp.service.PreprocessingSubscriberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Preprocessing Subscriber")
public class PreprocessingSubscriberController {

    private static final Logger log = LoggerFactory.getLogger(PreprocessingSubscriberController.class);

    @Autowired
    private ConnectionPoolManager connectionPoolManager;

    @Autowired
    private PreprocessingSubscriberService preprocessingSubscriberService;

    @PostMapping(value = "/preprocessing/subscribe")
    @Operation(description = "Subscribe to the MQTT topic")
    public void subscribe(@RequestBody String connectionUrl) throws MqttException {
        preprocessingSubscriberService.setupClient(connectionUrl);
    }

    @GetMapping(value = "/preprocessing/messages")
    @Operation(description = "Fetch all MQTT messages received on preprocessing output topic")
    public ArrayNode getMessages() {
        return preprocessingSubscriberService.getMessages();
    }
}
