package com.sap.persistenceservice.refapp.controller;

import javax.servlet.http.HttpServletRequest;

import org.apache.http.client.methods.HttpGet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sap.persistenceservice.refapp.service.ConnectionPoolManager;
import com.sap.persistenceservice.refapp.utils.Constants;
import com.sap.persistenceservice.refapp.utils.HttpRequestUtil;
import com.sap.persistenceservice.refapp.utils.RefAppEnv;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@Tag(name = "Capability Measures")
public class CapabilityMeaurementController {

    @Autowired
    private ConnectionPoolManager connectionPoolManager;

    @GetMapping(value = "/capabilityMeasures/{query}", produces = { MediaType.APPLICATION_ATOM_XML_VALUE,
        MediaType.APPLICATION_JSON_VALUE })
    @Operation(description = "Returns measures for capability")
    public ResponseEntity<String> getCapabilityMeasures(
        @RequestParam(value = "capabilityId", required = true) String capabilityId,
        @RequestParam(value = "query", required = false) String query,
        @RequestParam(value = "measureId", required = false) String measureId, HttpServletRequest httpServletRequest) {

        String format = httpServletRequest.getHeader(Constants.ACCEPT_HEADER);

        String baseUrl = RefAppEnv.PERSISTENCE_SERVICE_MEASURE_URL + "capability/" + capabilityId + "/";

        String url = null;
        if ("$metadata".equals(query)) {
            url = baseUrl + query;
        } else {
            if (StringUtils.isEmpty(measureId)) {
                url = baseUrl + "capabilityMeasures?" + query;
            } else {
                url = baseUrl + "capabilityMeasures('" + measureId + "')?" + query;
            }

        }

        HttpGet get = new HttpGet(url);

        if ("$metadata".equals(query)) {

            if (!format.contains("xml")) {
                get.setHeader(Constants.ACCEPT_HEADER, format);
            }

        } else {
            get.setHeader(Constants.ACCEPT_HEADER, format);
        }

        return HttpRequestUtil.getData(get, connectionPoolManager.getConnectionPoolManager());

    }
}
