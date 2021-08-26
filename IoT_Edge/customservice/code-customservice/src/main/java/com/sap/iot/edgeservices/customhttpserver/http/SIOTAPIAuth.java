package com.sap.iot.edgeservices.customhttpserver.http;

import com.github.scribejava.core.builder.api.DefaultApi20;

import java.util.Map;

public class SIOTAPIAuth extends DefaultApi20 {
    private String accessToken;
    private String url;

    public SIOTAPIAuth(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getAccessTokenEndpoint() {
        return accessToken;
    }

    protected String getAuthorizationBaseUrl() {
        return url;
    }

    @Override
    public String getAuthorizationUrl(String responseType, String apiKey, String callback, String scope, String state, Map<String, String> additionalParams) {
        return super.getAuthorizationUrl(responseType, apiKey, callback, scope, state, additionalParams);
    }
}
