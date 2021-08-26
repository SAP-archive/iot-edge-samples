package com.sap.iot.edgeservices.customhttpserver.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.util.ObjectUtils;

import java.util.Map;

@org.springframework.context.annotation.Configuration
@PropertySource("classpath:application.properties")
@EnableAutoConfiguration
public class Configuration {

    @Autowired
    private ObjectMapper mapper;

    private Integer edgePort;

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

    private String certDir;

    private String bindings;

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

    public String getCertDir() {
        return certDir;
    }

    public void setCertDir(String certDir) {
        this.certDir = certDir;
    }

    public String getBindings() {
        return bindings;
    }

    public void setBindings(String bindings) {
        this.bindings = bindings;
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
        deviceConnectivityUrlUnproxed = System.getenv(Constants.DEVICE_CONNECTIVITY.toString());
        clientId = System.getenv(Constants.CLIENT_ID.toString());
        clientSecret = System.getenv(Constants.CLIENT_SECRET.toString());
        tokenUri = System.getenv(Constants.OAUTH2_AUTH.toString());
        certDir = System.getenv(Constants.CERTIFICATE_DIR.toString());
        bindings = System.getenv(Constants.SERVICE_BINDINGS.toString());
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

    public JsonNode getFromBindings(Map<String, String> params) {
        try {
            JsonNode map = mapper.readTree(bindings);
            JsonNode bindingsParsed = map.findValues("bindings").get(0);
            for (JsonNode node : bindingsParsed) {
                boolean found = true;
                for (Map.Entry<String, String> param : params.entrySet()) {
                    String value = node.findValues(param.getKey()).get(0).asText();
                    if (!value.contains(param.getValue())) {
                        found = false;
                        break;
                    }
                }
                if (found) {
                    return node;
                }
            }
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
        throw new IllegalStateException("Unable to get binding");
    }
}
