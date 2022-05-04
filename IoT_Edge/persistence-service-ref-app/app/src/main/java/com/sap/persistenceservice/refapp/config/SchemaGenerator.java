package com.sap.persistenceservice.refapp.config;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

import javax.annotation.PostConstruct;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.persistenceservice.refapp.bean.SchemaBean;
import com.sap.persistenceservice.refapp.bean.UpdateSchemaConfig;
import com.sap.persistenceservice.refapp.exception.ServiceBindingException;
import com.sap.persistenceservice.refapp.utils.Constants;
import com.sap.persistenceservice.refapp.utils.JwtTokenUtil;
import com.sap.persistenceservice.refapp.utils.RefAppEnv;

/**
 * This class takes care of creating the schema at start up
 * 
 */
@Component
public class SchemaGenerator {

    private static final Logger log = LoggerFactory.getLogger(SchemaGenerator.class);

    @Autowired
    private Environment env;

    @Autowired
    private ObjectMapper objectMapper;

    private RestTemplate restTemplate = new RestTemplate();

    private SchemaBean schemaBean;

    private SchemaBean defaultSchemaBean;

    @PostConstruct
    public void init() throws IOException {
        Random random = new Random();
        restTemplate.setRequestFactory(new HttpComponentsClientHttpRequestFactory());
        // Generate a random schema name
        String schemaName = random.ints(97, 123).limit(10).collect(StringBuilder::new,
            StringBuilder::appendCodePoint, StringBuilder::append).toString();

        SchemaBean schemaInput = new SchemaBean();
        schemaInput.setName(schemaName);

        this.schemaBean = createSchema(schemaInput);
        log.info("Created schema : {}", objectMapper.writeValueAsString(schemaBean));

        if (RefAppEnv.IS_CUSTOM_EXTENSION) {
            return;
        }

        this.defaultSchemaBean = createDefaultSchema();

        log.info("Created default schema : {}", objectMapper.writeValueAsString(defaultSchemaBean));

    }

    public SchemaBean getDefaultSchema() {
        if (defaultSchemaBean == null) {
            defaultSchemaBean = createDefaultSchema();
        }
        return defaultSchemaBean;
    }

    public SchemaBean getSchemaBean() {
        if (schemaBean == null) {
            createSchema(schemaBean);
        }
        return schemaBean;
    }

    private SchemaBean createSchema(SchemaBean schema) {

        List<String> profileList = Arrays.asList(env.getActiveProfiles());

        if (RefAppEnv.LOCAL_TEST || (profileList != null && profileList.contains(Constants.TEST_PROFILE))) {
            return new SchemaBean();
        }

        if (StringUtils.isBlank(RefAppEnv.PERSISTENCE_SERVICE_URL)) {
            throw new ServiceBindingException("Could not find URL for Persistence Service from Service Bindings ");
        }

        HttpEntity<Object> request = getHttpRequest(schema);
        log.info("Requesting creation of schema from custom service {}", RefAppEnv.PERSISTENCE_SERVICE_SCHEMA_URL);

        try {
            ResponseEntity<SchemaBean> response = restTemplate.postForEntity(
                RefAppEnv.PERSISTENCE_SERVICE_SCHEMA_URL,
                request,
                SchemaBean.class);
            return response.getBody();
        } catch (Exception ex) {
            log.error("An error occurred while creating Schema: {}", ex.getMessage());
            throw ex;
        }
    }

    /**
     * This method creates the default schema
     */
    private SchemaBean createDefaultSchema() {

        List<String> profileList = Arrays.asList(env.getActiveProfiles());

        if (RefAppEnv.LOCAL_TEST || (profileList != null && profileList.contains(Constants.TEST_PROFILE))) {
            return new SchemaBean();
        }

        if (StringUtils.isBlank(RefAppEnv.PERSISTENCE_SERVICE_URL)) {
            throw new ServiceBindingException("Could not find URL for Persistence Service from Service Bindings ");
        }

        SchemaBean schemaInput = new SchemaBean();
        schemaInput.setName(RefAppEnv.DEFAULT_SCHEMA);

        HttpEntity<Object> createRequest = getHttpRequest(schemaInput);

        log.info("Requesting creation of schema from custom service {}", RefAppEnv.PERSISTENCE_SERVICE_SCHEMA_URL);

        try {
            ResponseEntity<SchemaBean> response = restTemplate.postForEntity(
                RefAppEnv.PERSISTENCE_SERVICE_SCHEMA_URL,
                createRequest,
                SchemaBean.class);
            return response.getBody();
        } catch (Exception ex) {
            log.info("Schema {} Exists", RefAppEnv.DEFAULT_SCHEMA);
        }

        HttpEntity<Object> updateRequest = getHttpRequest(new UpdateSchemaConfig());

        String updateUrl = RefAppEnv.PERSISTENCE_SERVICE_SCHEMA_URL + "/" + RefAppEnv.DEFAULT_SCHEMA + "/config";

        log.info("Requesting updation of schema from custom service {}", updateUrl);

        try {
            ResponseEntity<SchemaBean> response = restTemplate.postForEntity(
                updateUrl,
                updateRequest,
                SchemaBean.class);
            return response.getBody();
        } catch (Exception ex) {
            log.error("An error occurred while updating Schema: {}", ex.getMessage());
            throw ex;
        }
    }

    private HttpEntity<Object> getHttpRequest(Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        headers.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
        if (RefAppEnv.IS_CUSTOM_EXTENSION) {
            log.info("Setting request auth");
            headers.set(HttpHeaders.AUTHORIZATION, "Bearer " + JwtTokenUtil.readJwtToken());
        }

        HttpEntity<Object> request = new HttpEntity<>(body, headers);
        return request;
    }

}
