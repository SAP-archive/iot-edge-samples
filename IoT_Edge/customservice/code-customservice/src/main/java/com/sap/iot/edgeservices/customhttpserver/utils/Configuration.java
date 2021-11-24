package com.sap.iot.edgeservices.customhttpserver.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.util.ObjectUtils;

@org.springframework.context.annotation.Configuration
@PropertySource("classpath:application.properties")
@EnableAutoConfiguration
public class Configuration {

    @Value("${edgePort}")
    private Integer edgePort;

    @Value("${edgeAPIPort}")
    private Integer edgeAPIPort;

    @Value("${ingestionUrl}")
    private String ingestionUrl;

    @Value("${tokenUri}")
    private String tokenUri;

    @Value("${authorizationGrantType}")
    private String authorizationGrantType;

    @Value("${clientId}")
    private String clientId;

    @Value("${clientSecret}")
    private String clientSecret;

    @Value("${deviceConnectivityUrl}")
    private String deviceConnectivityUrl;

    private String deviceConnectivityUrlUnproxed;

    @Value("${gatewayApi}")
    private String gatewayApi;

    @Value("${deviceApi}")
    private String deviceApi;

    @Value("${deviceApiCloud}")
    private String deviceApiCloud;

    @Value("${certificateApi}")
    private String certificateApi;

    @Value("${sensorAlternateId}")
    private String sensorAlternateId;

    @Value("${sensorTypeAlternateId}")
    private String sensorTypeAlternateId;

    public String getDeviceConnectivityUrlUnproxed() {
        return deviceConnectivityUrlUnproxed;
    }

    public void setDeviceConnectivityUrlUnproxed(String deviceConnectivityUrlUnproxed) {
        this.deviceConnectivityUrlUnproxed = deviceConnectivityUrlUnproxed;
    }

    public String getDeviceApiCloud() {
        return deviceApiCloud;
    }

    public void setDeviceApiCloud(String deviceApiCloud) {
        this.deviceApiCloud = deviceApiCloud;
    }

    public String getGatewayApi() {
        return gatewayApi;
    }

    public void setGatewayApi(String gatewayApi) {
        this.gatewayApi = gatewayApi;
    }

    public String getDeviceApi() {
        return deviceApi;
    }

    public void setDeviceApi(String deviceApi) {
        this.deviceApi = deviceApi;
    }

    public String getCertificateApi() {
        return certificateApi;
    }

    public void setCertificateApi(String certificateApi) {
        this.certificateApi = certificateApi;
    }


    public Configuration() {
        if (!ObjectUtils.isEmpty(System.getenv(Constants.SERVICE_PORT.toString()))) {
            edgePort = Integer.parseInt(System.getenv(Constants.SERVICE_PORT.toString()));
        }
        if (!ObjectUtils.isEmpty(System.getenv(Constants.SERVICE_API_PORT.toString()))) {
            edgeAPIPort = Integer.parseInt(System.getenv(Constants.SERVICE_API_PORT.toString()));
        }
        deviceConnectivityUrlUnproxed = System.getenv(Constants.DEVICE_CONNECTIVITY.toString());
        clientId = System.getenv(Constants.CLIENT_ID.toString());
        clientSecret = System.getenv(Constants.CLIENT_SECRET.toString());
        tokenUri = System.getenv(Constants.OAUTH2_AUTH.toString());
    }

    public String getIngestionUrl() {
        return ingestionUrl;
    }

    public String getSensorAlternateId() {
        return sensorAlternateId;
    }

    public void setSensorAlternateId(String sensorAlternateId) {
        this.sensorAlternateId = sensorAlternateId;
    }

    public String getSensorTypeAlternateId() {
        return sensorTypeAlternateId;
    }

    public void setSensorTypeAlternateId(String sensorTypeAlternateId) {
        this.sensorTypeAlternateId = sensorTypeAlternateId;
    }

    public void setIngestionUrl(String ingestionUrl) {
        this.ingestionUrl = ingestionUrl;
    }

    public Integer getEdgePort() {
        return edgePort;
    }

    public void setEdgePort(Integer edgePort) {
        this.edgePort = edgePort;
    }

    public Integer getEdgeAPIPort() {
        return edgeAPIPort;
    }

    public void setEdgeAPIPort(Integer edgeAPIPort) {
        this.edgeAPIPort = edgeAPIPort;
    }

    public String getTokenUri() {
        return tokenUri;
    }

    public void setTokenUri(String tokenUri) {
        this.tokenUri = tokenUri;
    }

    public String getAuthorizationGrantType() {
        return authorizationGrantType;
    }

    public void setAuthorizationGrantType(String authorizationGrantType) {
        this.authorizationGrantType = authorizationGrantType;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public String getDeviceConnectivityUrl() {
        return deviceConnectivityUrl;
    }

    public void setDeviceConnectivityUrl(String deviceConnectivityUrl) {
        this.deviceConnectivityUrl = deviceConnectivityUrl;
    }
}
