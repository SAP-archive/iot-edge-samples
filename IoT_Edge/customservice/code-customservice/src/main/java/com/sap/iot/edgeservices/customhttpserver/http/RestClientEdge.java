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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.util.ResourceUtils;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLContext;
import java.nio.file.Files;
import java.nio.file.Paths;

public class RestClientEdge {

    private final ObjectMapper mapper = new ObjectMapper();
    private static final Logger LOG = LoggerFactory.getLogger(RestClientEdge.class);
    private RestTemplate restTemplate = null;

    @Autowired
    Configuration configuration;

    public JsonNode get(String edgeConnectivity, String query) {
        String url = edgeConnectivity + query;
        if (restTemplate == null) {
            restTemplate = restTemplate(new RestTemplateBuilder());
        }

        JsonNode actualObj = null;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            ResponseEntity<String> responseEntityStr = restTemplate.
                    getForEntity(url, String.class);

            LOG.info("Response: {}", responseEntityStr);
            LOG.info("Response body: {}", responseEntityStr.getBody());
            if (responseEntityStr.getStatusCode().is2xxSuccessful()) {
                actualObj = mapper.readTree(responseEntityStr.getBody());
            }
        } catch (Exception e) {
            LOG.error("Unable to invoke Edge APIs", e);

        }

        return actualObj;
    }

    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        try {
            char[] password = new String(Files.readAllBytes(Paths.get(configuration.getCertDir() + "/clientKeyStorePassword"))).toCharArray();
            SSLContext sslContext = SSLContextBuilder
                    .create()
                    .loadKeyMaterial(ResourceUtils.getFile(configuration.getCertDir() + "/clientKeyStore"), password, password)
                    .loadTrustMaterial(TrustAllStrategy.INSTANCE)
                    .build();
            HostnameVerifier hostnameVerifier = new NoopHostnameVerifier();
            SSLConnectionSocketFactory sslSocketFactory = new SSLConnectionSocketFactory(sslContext, hostnameVerifier);

            HttpClient client = HttpClients.custom().setSSLSocketFactory(sslSocketFactory).build();
            return builder
                    .requestFactory(() -> new HttpComponentsClientHttpRequestFactory(client))
                    .build();
        } catch (Exception e) {
            return null;
        }
    }
}
