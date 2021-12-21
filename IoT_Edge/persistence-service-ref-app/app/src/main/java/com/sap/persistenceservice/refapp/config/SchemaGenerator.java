package com.sap.persistenceservice.refapp.config;

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

import com.sap.persistenceservice.refapp.bean.SchemaBean;
import com.sap.persistenceservice.refapp.exception.ServiceBindingException;
import com.sap.persistenceservice.refapp.utils.Constants;
import com.sap.persistenceservice.refapp.utils.JwtTokenUtil;
import com.sap.persistenceservice.refapp.utils.RefAppEnv;

@Component
public class SchemaGenerator {

    private static final Logger log = LoggerFactory.getLogger(SchemaGenerator.class);

    @Autowired
    private Environment env;

    private SchemaBean schemaBean;

    @PostConstruct
    public void init() {
        Random random = new Random();
        // Generate a random schema name
        String schemaName = random.ints(97, 123).limit(10).collect(StringBuilder::new,
            StringBuilder::appendCodePoint, StringBuilder::append).toString();

        SchemaBean schemaInput = new SchemaBean();
        schemaInput.setName(schemaName);

        this.schemaBean = createSchema(schemaInput);
        log.info("Created schema {}", schemaBean.getName());

    }

    public SchemaBean getSchemaBean() {
        if (schemaBean == null) {
            createSchema(schemaBean);
        }
        return schemaBean;
    }

    private SchemaBean createSchema(SchemaBean schema) {

        List<String> profileList = Arrays.asList(env.getActiveProfiles());

        if ((profileList != null && profileList.contains(Constants.TEST_PROFILE))) {
            return new SchemaBean();
        }

        if (StringUtils.isBlank(RefAppEnv.PERSISTENCE_SERVICE_URL)) {
            throw new ServiceBindingException("Could not find URL for Persistence Service from Service Bindings ");
        }

        if (RefAppEnv.LOCAL_TEST) {
            return new SchemaBean();
        }

        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setRequestFactory(new HttpComponentsClientHttpRequestFactory());

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        headers.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
        if (RefAppEnv.IS_CUSTOM_EXTENSION) {
            log.info("Setting request auth");
            headers.set(HttpHeaders.AUTHORIZATION, "Bearer " + JwtTokenUtil.readJwtToken());
        }
        HttpEntity<Object> request = new HttpEntity<>(schema, headers);
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
}
