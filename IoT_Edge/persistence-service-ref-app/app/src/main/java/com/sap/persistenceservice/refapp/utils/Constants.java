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

    public static final String FILE_SEPARATOR = "/";

    public static final String CLIENT_KEYSTORE_PASSWORD = "clientKeyStorePassword";
    public static final String CLIENT_TRUSTSTORE_PASSWORD = "clientTrustStorePassword";
    public static final String CLIENT_KEYSTORE = "clientKeyStore";
    public static final String CLIENT_TRUSTSTORE = "clientTrustStore";

    public static final String CERTIFICATES_DIRECTORY = "CERTIFICATES_DIRECTORY";

    public static final String LOG_LEVEL = "LOG_LEVEL";

    public static final String MAX_IN_FLIGHT = "MAX_IN_FLIGHT";

    public static final String SERVICE_BINDINGS = "SERVICE_BINDINGS";
    public static final String PERSISTENCE_REST_SERVICE_BINDINGS = "PERSISTENCE_REST_SERVICE_BINDINGS";
    public static final String EDGE_GATEWAY_REST_SERVICE_BINDINGS = "EDGE_GATEWAY_REST_SERVICE_BINDINGS";
    public static final String SERVICE_TYPE_REST = "REST";
    public static final String PERSISTENCE_SERVICES_URL = "PERSISTENCE_SERVICES_URL";

    public static final String PURCHASE_ORDER = "PURCHASE_ORDER";
    public static final String METRIC = "METRIC";
    public static final String LOAD_TEST_CONFIG = "LOAD_TEST_CONFIG";

    public static final String CONFIG = "TEST_CONFIG";
    public static final String TEST_PROPERTY = "TEST_PROPERTY";

    public static final String DEFAULT_TIME_ZONE = "Etc/UTC";
    public static final String UTC_DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";

    public static final String MAPPER_TIME_ZONE = "UTC";

    public static final String TEST_PROFILE = "test";
}
