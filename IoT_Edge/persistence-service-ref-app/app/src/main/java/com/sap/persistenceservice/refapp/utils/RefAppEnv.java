package com.sap.persistenceservice.refapp.utils;

import java.io.IOException;
import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.StringUtils;

public class RefAppEnv {

    private static final Logger log = LoggerFactory.getLogger(RefAppEnv.class);

    private RefAppEnv() {

    }

    public static final boolean LOCAL_TEST = getEnvBool(Constants.LOCAL_TEST, false);

    public static final boolean IS_CUSTOM_EXTENSION = getEnvBool("CUSTOM_EXTENSION", false);

    public static final String LOG_LEVEL = getEnvAsString(Constants.LOG_LEVEL, "INFO");

    public static final String LOAD_TEST_PROTOCOL = getEnvAsString(Constants.LOAD_TEST_PROTOCOL, "MQTT");

    public static final String SERVICE_BINDINGS = getEnvAsString(Constants.SERVICE_BINDINGS, "");

    public static final int MAX_IN_FLIGHT = getEnvInt(Constants.MAX_IN_FLIGHT, 1000);

    public static final int SERVER_PORT = getEnvInt("SERVER_PORT", 8080);

    public static Properties getApplicationProperties() {
        Properties appProperties = new Properties();
        addWebServerConfiguration(appProperties);
        return appProperties;
    }

    public static String PERSISTENCE_SERVICE_URL;

    static {
        if (LOCAL_TEST) {
            PERSISTENCE_SERVICE_URL = "http://localhost:8080";
        } else {
            try {
                PERSISTENCE_SERVICE_URL = ServiceBindingsUtils.getPersistenceServiceRestUrl();
            } catch (IOException e) {
                log.error("Exeption while reading the url for persistence service {}", e.getMessage());
            }
        }
    }

    public static final String PERSISTENCE_SERVICE_SCHEMA_URL = PERSISTENCE_SERVICE_URL
        + "/persistence/v1/context/schema";

    public static final String PERSISTENCE_SERVICE_MEASURE_URL = PERSISTENCE_SERVICE_URL + "/persistence/v1/iot/";

    public static final String PERSISTENCE_SERVICE_VERSION_URL = PERSISTENCE_SERVICE_URL + "/persistence/v1/about";

    private static String getEnvAsString(String envVariableName, String defaultValue) {

        String value = System.getenv(envVariableName);
        if (StringUtils.isEmpty(value)) {
            value = defaultValue;
        }

        return value;

    }

    private static int getEnvInt(String name, int defaultValue) {
        String variableValue = System.getenv(name);
        if (variableValue == null || variableValue.isEmpty()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(variableValue);
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }

    private static boolean getEnvBool(String name, boolean defaultValue) {
        String variableValue = System.getenv(name);
        if (variableValue == null) {
            return defaultValue;
        }
        if ("true".equalsIgnoreCase(variableValue)) {
            return true;
        }
        if ("false".equalsIgnoreCase(variableValue)) {
            return false;
        }
        return defaultValue;
    }

    private static void addWebServerConfiguration(Properties appProperties) {
        appProperties.put("server.port", SERVER_PORT);
    }

}
