package com.sap.iot.edgeservices.customhttpserver.http;

import com.github.scribejava.core.builder.ServiceBuilder;
import com.github.scribejava.core.oauth.OAuth20Service;
import com.sap.iot.edgeservices.customhttpserver.utils.Constants;
import org.springframework.beans.factory.annotation.Value;

public class Oauth2 {
    @Value("${clientId}")
    private String clientId;
    @Value("${clientSecret}")
    private String secret;
    @Value("${tokenUri}")
    private String tokenUri;
    private OAuth20Service accessKey;

    public Oauth2(String clientId, String secret) {
        this.clientId = clientId;
        this.secret = secret;
    }

    public Oauth2() {
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public OAuth20Service getAccessKey() {
        return accessKey;
    }

    public OAuth20Service getNewService() {

        accessKey = new ServiceBuilder(clientId)
                .apiSecret(secret)
                .build(new SIOTAPIAuth(tokenUri));
        return accessKey;
    }
}
