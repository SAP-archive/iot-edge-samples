package com.sap.persistenceservice.refapp.task;

import java.io.UnsupportedEncodingException;

import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.persistenceservice.refapp.bean.DeviceMessage;
import com.sap.persistenceservice.refapp.iot.model.DeviceMessagePojo;
import com.sap.persistenceservice.refapp.service.ConnectionPoolManager;
import com.sap.persistenceservice.refapp.utils.HttpRequestUtil;
import com.sap.persistenceservice.refapp.utils.MessageUtil;

public class RESTLoadGenerationTask extends LoadGenerationTask {

    private static final Logger log = LoggerFactory.getLogger(RESTLoadGenerationTask.class);

    private ConnectionPoolManager connectionPoolManager;
    private String connectionUrl;
    
    public RESTLoadGenerationTask(ObjectMapper objectMapper,
        DeviceMessagePojo deviceMessagePojo, double maxMessages, ConnectionPoolManager connectionPoolManager,
        String connectionUrl) {
        super(objectMapper, deviceMessagePojo, maxMessages);
        this.connectionPoolManager = connectionPoolManager;
        this.connectionUrl = connectionUrl;
    }

    @Override
    public void run() {

        if (MessageUtil.getInstance().getMessageCounter() >= maxMessages) {
            return;
        }

        DeviceMessage deviceMessage = createDeviceMessage();

        try {
            HttpPost post = new HttpPost(
                connectionUrl + "/measures/" + deviceMessagePojo.getDeviceAlternateId());
            String objectval = new ObjectMapper().writeValueAsString(deviceMessage);
            post.setEntity(new StringEntity(objectval));
            post.setHeader("Content-Type", "application/json");
            HttpRequestUtil.postData(post, connectionPoolManager.getIotConnectionManager());
            MessageUtil.getInstance().incrementMessageCounter();
        } catch(UnsupportedEncodingException | JsonProcessingException ex){
            log.error("Error while posting message ", ex);
        }
    }
}
