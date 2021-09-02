package com.sap.persistenceservice.refapp.config;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.TimeZone;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.persistenceservice.refapp.utils.Constants;

@Configuration
public class CommonConfiguration {

    /**
     * This method provides centralized object mapper configuration. DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES -
     * Enables failure in case the payloads have unknown properties JsonParser.Feature.STRICT_DUPLICATE_DETECTION-
     * Enables failure if duplicate properties
     */
    @Bean(name = "objectMapper")
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES,
            true);

        DateFormat df = new SimpleDateFormat(Constants.UTC_DATE_FORMAT);
        df.setTimeZone(TimeZone.getTimeZone(Constants.MAPPER_TIME_ZONE));
        objectMapper.setDateFormat(df);

        objectMapper.enable(JsonParser.Feature.STRICT_DUPLICATE_DETECTION);
        return objectMapper;
    }

}
