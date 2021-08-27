package com.sap.persistenceservice.refapp.controller;

import org.apache.http.client.methods.HttpGet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sap.persistenceservice.refapp.service.ConnectionPoolManager;
import com.sap.persistenceservice.refapp.utils.HttpRequestUtil;
import com.sap.persistenceservice.refapp.utils.RefAppEnv;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@Tag(name = "About", description = " Persistence Service Version")
public class VersionController {

    @Autowired
    private ConnectionPoolManager connectionPoolManager;

    @GetMapping(value = "/version", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(description = "Returns version of persistence service")
    public ResponseEntity<String> getPersistenceServiceVersion() {

        String finalUrl = RefAppEnv.PERSISTENCE_SERVICE_VERSION_URL;
        return HttpRequestUtil.getData(new HttpGet(finalUrl), connectionPoolManager.getConnectionPoolManager());

    }

}
