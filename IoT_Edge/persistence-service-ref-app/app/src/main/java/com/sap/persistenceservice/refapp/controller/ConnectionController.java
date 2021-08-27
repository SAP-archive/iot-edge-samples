package com.sap.persistenceservice.refapp.controller;

import java.sql.Connection;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sap.persistenceservice.refapp.bean.SchemaBean;
import com.sap.persistenceservice.refapp.config.SchemaGenerator;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@Tag(name = "Custom schema")
public class ConnectionController implements InitializingBean {

    private static final Logger log = LoggerFactory.getLogger(ConnectionController.class);

    @Autowired
    private DataSource refAppDatasource;

    @Autowired
    private SchemaGenerator schemaGenerator;

    @GetMapping(value = "/schemaDetails")
    @Operation(description = "Gets a schema details")
    public SchemaBean getSchemaDetails() {
        log.info("Request - getting schema details");
        return schemaGenerator.getSchemaBean();
    }

    @GetMapping(value = "/checkConnection")
    @Operation(description = "Checks the connection status")
    public String checkConnection() {

        try (Connection conn = refAppDatasource.getConnection()) {
            log.info("Successfully connected to the database");
            log.info("Connected to datasource");
            return "successfully connected to database";
        } catch (SQLException ex) {
            log.error(ex.getMessage());
            return "failed to connect to database";
        }
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        if (refAppDatasource == null) {
            throw new Exception("refAppDatasource is not injected");
        }
    }

}
