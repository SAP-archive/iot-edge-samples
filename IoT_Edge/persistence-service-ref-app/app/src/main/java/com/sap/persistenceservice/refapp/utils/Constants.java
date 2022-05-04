package com.sap.persistenceservice.refapp.utils;

public class Constants {

    private Constants() {

    }

    public static final String POSTGRES_DRIVER = "org.postgresql.Driver";
    public static final String POSTGRES_VALIDATION_QUERY = "SELECT 1";
    public static final int CONNECTION_VALIDATION_INTERVAL = 1000;
    public static final boolean CONNECTION_TEST_WHILE_IDLE = true;
    public static final boolean CONNECTION_TEST_ON_BORROW = true;
    public static final boolean JMX_ENABLED = true;
    public static final int CONNECTION_POOL_INITIAL_SIZE = 2;
    public static final int CONNECTION_POOL_MAX_ACTIVE = 5;
    public static final int CONNECTION_POOL_MIN_IDLE = 2;
    public static final int CONNECTION_POOL_MAX_IDLE = 5;

    public static final String ACCEPT_HEADER = "accept";

    public static final String LOCAL_TEST = "LOCAL_TEST";

    public static final String LOG_LEVEL = "LOG_LEVEL";
    public static final String LOAD_TEST_PROTOCOL = "LOAD_TEST_PROTOCOL";

    public static final String MAX_IN_FLIGHT = "MAX_IN_FLIGHT";

    public static final String SERVICE_BINDINGS = "SERVICE_BINDINGS";
    public static final String PERSISTENCE_REST_SERVICE_BINDINGS = "PERSISTENCE_REST_SERVICE_BINDINGS";
    public static final String EDGE_GATEWAY_REST_SERVICE_BINDINGS = "EDGE_GATEWAY_REST_SERVICE_BINDINGS";
    public static final String SERVICE_TYPE_REST = "REST";
    public static final String PERSISTENCE_SERVICES_URL = "PERSISTENCE_SERVICES_URL";

    public static final String PURCHASE_ORDER = "PURCHASE_ORDER";
    public static final String METRIC = "METRIC";
    public static final String LOAD_TEST_CONFIG = "LOAD_TEST_CONFIG";
    public static final String TEST_RUN_CONFIG = "LOAD_TEST_RESULTS";
    public static final String MEASURE = "MEASURE";

    public static final String CONFIG = "TEST_CONFIG";
    public static final String TEST_PROPERTY = "TEST_PROPERTY";

    public static final String DEFAULT_TIME_ZONE = "Etc/UTC";
    public static final String UTC_DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";

    public static final String MAPPER_TIME_ZONE = "UTC";

    public static final String TEST_PROFILE = "test";

    public static final String REST = "REST";
    public static final String MQTT = "MQTT";

    public static final String TOKEN_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/token";

    public static final int LOAD_TEST_POLLING_TIMEOUT_ITERATIONS = 10;
    public static final int SECONDS_BETWEEN_LOAD_TESTS = 10;

    public static final String ODATA_COUNT_QUERY = RefAppEnv.PERSISTENCE_SERVICE_MEASURE_URL
        + "measures?$count=true&$top=0";

    public static final String RETENTION_API_URL = RefAppEnv.PERSISTENCE_SERVICE_MEASURE_URL + "retention/cleanUp";

    public static final String PREPROCESSING_MQTT_TOPIC = "iot/edge/v1/sap-iot-gateway/measures/preprocessing";
}
