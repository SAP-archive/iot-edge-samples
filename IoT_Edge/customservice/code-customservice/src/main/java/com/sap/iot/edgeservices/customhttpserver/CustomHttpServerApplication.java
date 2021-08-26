package com.sap.iot.edgeservices.customhttpserver;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.scribejava.core.oauth.OAuth20Service;
import com.sap.iot.edgeservices.customhttpserver.helper.MessageConverter;
import com.sap.iot.edgeservices.customhttpserver.http.Oauth2;
import com.sap.iot.edgeservices.customhttpserver.http.RestClient;
import com.sap.iot.edgeservices.customhttpserver.http.RestClientEdge;
import com.sap.iot.edgeservices.customhttpserver.storage.StorageProperties;
import com.sap.iot.edgeservices.customhttpserver.storage.StorageService;
import com.sap.iot.edgeservices.customhttpserver.utils.Constants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
@EnableConfigurationProperties(StorageProperties.class)
public class CustomHttpServerApplication {

    private static final Logger LOG = LoggerFactory.getLogger(CustomHttpServerApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(CustomHttpServerApplication.class, args);
    }

    @Bean
    public Oauth2 oauth2() {
        return new Oauth2();
    }

    @Bean
    public OAuth20Service oAuth20Service(Oauth2 oauth2) {
        return oauth2.getNewService();
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    @Bean
    public MessageConverter messageConverter() {
        return new MessageConverter();
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public RestClient restClient() {
        return new RestClient();
    }

    @Bean
    public RestClientEdge restClientEdge() {
        return new RestClientEdge();
    }

    @Bean
    CommandLineRunner init(StorageService storageService, RestClient client) {
        return (args) -> {
            // probably it's possible to remove all the existing storage at startup  with the deleteAll method;
            storageService.init();
            //TODO we can also init the resttemplate at startup once router certificate are working
            //client.init();

            //Log ENV
            LOG.info("DEVICE_CONNECTIVITY: {}", System.getenv(Constants.DEVICE_CONNECTIVITY.toString()));
            LOG.info("CERTIFICATE_DIR: {}", System.getenv(Constants.CERTIFICATE_DIR.toString()));
            LOG.info("CLIENT_ID: {}", System.getenv(Constants.CLIENT_ID.toString()));
            LOG.info("CLIENT_SECRET: {}", System.getenv(Constants.CLIENT_SECRET.toString()));
            LOG.info("OAUTH2_AUTH: {}", System.getenv(Constants.OAUTH2_AUTH.toString()));
            LOG.info("SERVICE_BINDINGS: {}", System.getenv(Constants.SERVICE_BINDINGS.toString()));
            LOG.info("SERVICE_PORT: {}", System.getenv(Constants.SERVICE_PORT.toString()));
        };
    }
}