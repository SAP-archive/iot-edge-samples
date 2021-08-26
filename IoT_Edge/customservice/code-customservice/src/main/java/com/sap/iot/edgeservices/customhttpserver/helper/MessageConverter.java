package com.sap.iot.edgeservices.customhttpserver.helper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.iot.edgeservices.customhttpserver.utils.Configuration;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MessageConverter {
    @Autowired
    private ObjectMapper mapper;

    @Autowired
    private Configuration configuration;

    //This is a sample message: {"events":[{"E":"4745672","T":"+ 1487752992000 +","V":[{"V":""+10+"","I":"1.1"}, {"V":""+0+"","I":"10.1"}]}]}
    public List<Map<String, Object>> convertMessage (String message) throws JsonProcessingException {
        List<Map<String, Object>> outMessages = new ArrayList<>();
        JsonNode actualObj = mapper.readTree(message);
        JsonNode events = actualObj.get("events");
        for (JsonNode event : events) {
            String device = event.get("E").asText();
            String timestamp = event.get("T").asText().replace("+","" ).replace(" ", "");
            for (JsonNode value : event.get("V")){
                Map<String, Object> outMessage = new HashMap<>();
                Map<String, Object> values = new HashMap<>();
                List<Map<String,Object>> listValues = new ArrayList<>();
                String[] capabilityAndCheck = value.get("I").asText().split("\\.");
                String capability = capabilityAndCheck[0];
                boolean check = capabilityAndCheck[1].contentEquals("1");
                String propValue = value.get("V").asText().replace("+", "");
                values.put("value", propValue);
                values.put("valid", check);
                outMessage.put("deviceAlternateId", device);
                outMessage.put("timestamp", timestamp);
                outMessage.put("capabilityAlternateId", capability);
                outMessage.put("sensorTypeAlternateId", configuration.getSensorTypeAlternateId());
                outMessage.put("sensorAlternateId", configuration.getSensorAlternateId());
                listValues.add(values);
                outMessage.put("measures", listValues);
                outMessages.add(outMessage);
            }
        }
        return outMessages;
    }

    public String getMessage(Map<String, Object> message) throws JsonProcessingException {
        return mapper.writeValueAsString(message);
    }
}
