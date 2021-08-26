package com.sap.iot.edgeservices.customhttpserver.helper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.scribejava.core.model.OAuth2AccessToken;
import com.github.scribejava.core.model.OAuthRequest;
import com.github.scribejava.core.model.Response;
import com.github.scribejava.core.model.Verb;
import com.github.scribejava.core.oauth.OAuth20Service;
import com.sap.iot.edgeservices.customhttpserver.http.Oauth2;
import com.sap.iot.edgeservices.customhttpserver.http.RestClientEdge;
import com.sap.iot.edgeservices.customhttpserver.utils.Configuration;
import org.apache.logging.log4j.util.Strings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.PropertySource;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@org.springframework.context.annotation.Configuration
@PropertySource("classpath:application.properties")
@EnableAutoConfiguration
public class RestControllerHelper extends Configuration {
    private static final Logger LOG = LoggerFactory.getLogger(RestControllerHelper.class);
    private String gatewayId = null;

    @Autowired
    private ObjectMapper mapper;

    @Autowired
    private Oauth2 oauth2;

    @Autowired
    private OAuth20Service serviceToken;

    @Autowired
    private Configuration configuration;

    @Autowired
    private RestClientEdge clientEdge;

    private String edgeAddress;

    public RestControllerHelper() {
        super();
    }

    public JsonNode getGateways() {
        String edgeConnectivity = getEdgeFromBindings();
        String url = configuration.getGatewayApi();
        return clientEdge.get(edgeConnectivity, url);
    }

    public String getEdgeFromBindings() {
        if (Strings.isEmpty(edgeAddress)) {
            try {
                Map<String, String> filters = new HashMap<>();
                filters.put("api", "REST API URL");
                filters.put("url", "edge");
                JsonNode edgeNodeUrl = configuration.getFromBindings(filters);
                if (edgeNodeUrl != null) {
                    edgeAddress = edgeNodeUrl.get("url").asText();
                }
            } catch (Exception e) {
                LOG.error("edgeAddress API not found", e);
            }
        }
        return edgeAddress;
    }

    private JsonNode invokeApi(String query) {
        LOG.debug("Invoking {} API", query);
        final OAuth2AccessToken accessToken;
        JsonNode map = null;
        try {
            accessToken = serviceToken.getAccessTokenClientCredentialsGrant();
            OAuthRequest request = new OAuthRequest(Verb.GET, query);
            request.addHeader("Accept", "*");
            serviceToken.signRequest(accessToken, request);
            final Response response = serviceToken.execute(request);
            // The response body is json find only the ThingIds
            map = mapper.readTree(response.getBody());
        } catch (IOException | ExecutionException | InterruptedException e) {
            LOG.error("unable to invoke {} API due to {}", query, e.getMessage(), e);
            Thread.currentThread().interrupt();
        }
        return map;
    }


    private JsonNode sendApi(String query, String body) {
        LOG.debug("Invoking {} API", query);
        final OAuth2AccessToken accessToken;
        JsonNode map = null;
        try {
            accessToken = serviceToken.getAccessTokenClientCredentialsGrant();
            OAuthRequest request = new OAuthRequest(Verb.POST, query);
            request.addHeader("Accept", "*");
            request.setPayload(body);
            request.addHeader("Content-Type", "application/json");
            serviceToken.signRequest(accessToken, request);
            final Response response = serviceToken.execute(request);
            // The response body is json find only the ThingIds
            map = mapper.readTree(response.getBody());
        } catch (IOException | ExecutionException | InterruptedException e) {
            LOG.error("unable to invoke {} API due to {}", query, e.getMessage(), e);
            Thread.currentThread().interrupt();
        }
        return map;
    }

    public String getGatewayId() {
        if (Strings.isEmpty(gatewayId)) {
            JsonNode map = getGateways();
            if (map != null && !(map.findValues("id")).isEmpty()) {
                gatewayId = map.findValues("id").get(0).asText();
            }
        }
        return gatewayId;
    }

    public JsonNode getDevices(String alternateId) {
        String edgeConnectivity = getEdgeFromBindings();
        String query = configuration.getDeviceApi() + "?skip=0&top=100";
        List<String> filters = new ArrayList<>();
        if (!Strings.isEmpty(alternateId)) {
            filters.add("alternateId eq " + alternateId);
        }
        String joinedFilters = String.join(" and ", filters);
        if (!joinedFilters.isEmpty()) {
            query += "&filter=" + joinedFilters;
        }
        LOG.debug("invoking {}", query);
        return clientEdge.get(edgeConnectivity, query);
    }

    public JsonNode getDevices(String gatewayId, String alternateId) {
        String query = configuration.getDeviceConnectivityUrl() + configuration.getDeviceApiCloud() + "?skip=0&top=100";
        List<String> filters = new ArrayList<>();
        if (!Strings.isEmpty(alternateId)) {
            filters.add("alternateId%20eq%20'" + alternateId + "'");
        }
        if (!Strings.isEmpty(gatewayId)) {
            filters.add("gatewayId%20eq%20'" + gatewayId + "'");
        }
        String joinedFilters = String.join("%20and%20", filters);
        if (!joinedFilters.isEmpty()) {
            query += "&filter=" + joinedFilters;

        }
        return invokeApi(query);
    }

    public String getDeviceId(String alternateId) {
        JsonNode map = getDevices(alternateId);
        if (map == null || (map.findValues("id")).isEmpty()) {
            gatewayId = getGatewayId();
            map = postDevice(gatewayId, alternateId, "router");
        }
        if (map != null && !(map.findValues("id")).isEmpty()) {
            return map.findValues("id").get(0).asText();
        }
        return null;
    }

    public String getDeviceId(String gatewayId, String alternateId) {
        JsonNode map = getDevices(gatewayId, alternateId);
        if (map == null || (map.findValues("id")).isEmpty()) {
            map = postDevice(gatewayId, alternateId, "router");
        }
        if (map != null && !(map.findValues("id")).isEmpty()) {
            return map.findValues("id").get(0).asText();
        }
        return null;
    }

    public JsonNode postDevice(String gatewayId, String alternateId, String type) {
        String query = configuration.getDeviceConnectivityUrl() + configuration.getDeviceApiCloud();
        Map<String, Object> bodyMap = new HashMap<>();
        bodyMap.put("alternateId", alternateId);
        bodyMap.put("name", alternateId);
        bodyMap.put("gatewayId", gatewayId);
        List<Object> auth = new ArrayList<>();
        Map<String, Object> authMap = new HashMap<>();
        authMap.put("type", type);
        auth.add(authMap);
        bodyMap.put("authorizations", auth);
        String body = null;
        try {
            body = mapper.writeValueAsString(bodyMap);
        } catch (JsonProcessingException e) {
            LOG.error("Unable to create body of the request {} {} {}", gatewayId, alternateId, type, e);
        }
        if (!Strings.isEmpty(body)) {
            return sendApi(query, body);
        }
        return null;
    }

    public JsonNode getDeviceCertificate(String deviceId) {
        String query = configuration.getDeviceConnectivityUrl() + configuration.getDeviceApiCloud() + configuration.getCertificateApi();
        query = query.replace("{deviceId}", deviceId);
        return invokeApi(query);
    }

}
