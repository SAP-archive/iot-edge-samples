package com.sap.persistenceservice.refapp.utils;

import java.io.IOException;

import org.springframework.util.StringUtils;

import com.sap.persistenceservice.refapp.exception.ServiceBindingException;

public class RefAppEnv {

    private RefAppEnv() {

    }

    public static final boolean LOCAL_TEST = getEnvBool(Constants.LOCAL_TEST, false);

    public static final String LOG_LEVEL = getEnvAsString(Constants.LOG_LEVEL, "INFO");

    public static final String CERTIFICATES_DIRECTORY = getEnvAsString(Constants.CERTIFICATES_DIRECTORY,
        "/opt/persistence_service_ref_app/certificate");

    public static final String SERVICE_BINDINGS = getEnvAsString(Constants.SERVICE_BINDINGS, "");

    public static final int MAX_IN_FLIGHT = getEnvInt(Constants.MAX_IN_FLIGHT, 1000);

    public static String PERSISTENCE_SERVICE_URL;

    static {
        if (LOCAL_TEST) {
            PERSISTENCE_SERVICE_URL = "http://localhost:8443";
        } else {
            try {
                PERSISTENCE_SERVICE_URL = ServiceBindingsUtils.getPersistenceServiceRestUrl();
            } catch (IOException | ServiceBindingException ex) {
                PERSISTENCE_SERVICE_URL = null;
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

}
