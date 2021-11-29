package com.sap.iot.edgeservices.customhttpserver.http;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.iot.edgeservices.customhttpserver.utils.Configuration;
import org.apache.http.client.HttpClient;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.TrustAllStrategy;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.ssl.SSLContextBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.util.ResourceUtils;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLContext;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class RestClientEdge {

    private final ObjectMapper mapper = new ObjectMapper();
    private static final Logger LOG = LoggerFactory.getLogger(RestClientEdge.class);

    @Autowired
    Configuration configuration;

    @Autowired
    RestTemplate restTemplate;

    private boolean jwtValid = false;
    private String jwt;

    public RestClientEdge() {
        initToken();
    }

    private void initToken() {
        LOG.info("Init JWT token");
        try {
            jwt = Files.readString(Paths.get("/var/run/secrets/kubernetes.io/serviceaccount/token"));
            jwtValid = true;
        } catch (IOException e) {
            LOG.error("Unable to import JWT token", e);
            jwtValid = false;
        }
    }

    public JsonNode get(String edgeConnectivity, String query) {
        String url = edgeConnectivity + query;

        JsonNode actualObj = null;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        if (!jwtValid){
            initToken();
        }
        headers.setBearerAuth(jwt);
        HttpEntity<String> entity = new HttpEntity<>(null, headers);
        try {
            ResponseEntity<String> responseEntityStr = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            LOG.info("Response: {}", responseEntityStr);
            LOG.info("Response body: {}", responseEntityStr.getBody());
            if (responseEntityStr.getStatusCode().is2xxSuccessful()) {
                actualObj = mapper.readTree(responseEntityStr.getBody());
            }
        } catch (Exception e) {
            LOG.error("Unable to invoke Edge APIs", e);
            jwtValid = false;
        }

        return actualObj;
    }
}
