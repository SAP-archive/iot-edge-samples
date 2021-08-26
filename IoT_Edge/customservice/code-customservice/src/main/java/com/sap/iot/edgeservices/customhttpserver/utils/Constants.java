package com.sap.iot.edgeservices.customhttpserver.utils;

public enum Constants {
    DEVICE_CONNECTIVITY("DEVICE_CONNECTIVITY"),
    CLIENT_ID("CLIENT_ID"),
    CLIENT_SECRET("CLIENT_SECRET"),
    OAUTH2_AUTH("OAUTH2_AUTH"),
    CERTIFICATE_DIR("CERTIFICATE_DIR"),
    SERVICE_BINDINGS("SERVICE_BINDINGS"),
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
