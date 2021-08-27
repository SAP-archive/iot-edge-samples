package com.sap.persistenceservice.refapp.controller;

import org.apache.http.client.methods.HttpDelete;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sap.persistenceservice.refapp.service.ConnectionPoolManager;
import com.sap.persistenceservice.refapp.utils.HttpRequestUtil;
import com.sap.persistenceservice.refapp.utils.RefAppEnv;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@Tag(name = "Retention Controller")
public class RetentionController {

    @Autowired
    private ConnectionPoolManager connectionPoolManager;

    @DeleteMapping(value = "/retention/cleanUp")
    @Operation(description = "Enforce retention policy")
    public ResponseEntity<String> enforceRetention() {
        String url = RefAppEnv.PERSISTENCE_SERVICE_MEASURE_URL + "retention/cleanUp";
        return HttpRequestUtil.delete(new HttpDelete(url), connectionPoolManager.getConnectionPoolManager());

    }

}
