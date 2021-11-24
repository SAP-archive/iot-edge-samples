package com.sap.iot.edgeservices.customhttpserver.utils;

public enum Constants {
    DEVICE_CONNECTIVITY("DEVICE_CONNECTIVITY"),
    CLIENT_ID("CLIENT_ID"),
    CLIENT_SECRET("CLIENT_SECRET"),
    OAUTH2_AUTH("OAUTH2_AUTH"),
    SERVICE_API_PORT("SERVICE_API_PORT"),
    EDGE_HOSTNAME("edge-gateway-service.sap-iot-gateway"),
    EDGE_API_PROTOCOL("http://"),
    SERVICE_PORT("SERVICE_PORT");

    private final String text;

    /**
     * @param text text value
     */
    Constants(final String text) {
        this.text = text;
    }

    /* (non-Javadoc)
     * @see java.lang.Enum#toString()
     */
    @Override
    public String toString() {
        return text;
    }
}
