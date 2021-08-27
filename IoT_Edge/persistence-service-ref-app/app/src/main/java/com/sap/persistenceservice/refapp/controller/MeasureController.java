package com.sap.persistenceservice.refapp.controller;

import java.io.IOException;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpGet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.persistenceservice.refapp.bean.Measure;
import com.sap.persistenceservice.refapp.bean.MeasureValue;
import com.sap.persistenceservice.refapp.service.ConnectionPoolManager;
import com.sap.persistenceservice.refapp.utils.Constants;
import com.sap.persistenceservice.refapp.utils.HttpRequestUtil;
import com.sap.persistenceservice.refapp.utils.RefAppEnv;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@Tag(name = "Device Measures")
public class MeasureController {

    private static final Logger log = LoggerFactory.getLogger(MeasureController.class);

    @Autowired
    private ConnectionPoolManager connectionPoolManager;

    @Autowired
    private ObjectMapper objectMapper;

    @DeleteMapping(value = "/measures/{measureId}")
    public ResponseEntity<String> deleteMeasureId(
        @RequestParam(value = "measureId", required = true) String measureId) {
        return deleteMeasure(measureId);

    }

    @GetMapping(value = "/measures/{query}", produces = { MediaType.APPLICATION_ATOM_XML_VALUE,
        MediaType.APPLICATION_JSON_VALUE })
    @Operation(description = "Returns the device measures")
    public ResponseEntity<String> getDeviceMeasures(@RequestParam(value = "query", required = false) String query,
        @RequestParam(value = "measureId", required = false) String measureId, HttpServletRequest httpServletRequest) {
        String format = httpServletRequest.getHeader(Constants.ACCEPT_HEADER);

        String url = null;
        if ("$metadata".equals(query)) {
            url = RefAppEnv.PERSISTENCE_SERVICE_MEASURE_URL + query;
        } else {
            if (StringUtils.isEmpty(measureId)) {
                url = RefAppEnv.PERSISTENCE_SERVICE_MEASURE_URL + "measures?" + query;
            } else {
                url = RefAppEnv.PERSISTENCE_SERVICE_MEASURE_URL + "measures('" + measureId + "')?" + query;
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

    @DeleteMapping(value = "/measures")
    @Operation(description = "Delete all measures")
    public ResponseEntity<String> deleteAllMeasures() {

        Runnable deleteTask = () -> {
            String url = RefAppEnv.PERSISTENCE_SERVICE_MEASURE_URL + "measures?$select=measureId";
            HttpGet get = new HttpGet(url);
            get.setHeader(Constants.ACCEPT_HEADER, "application/json");
            Measure measure = null;
            try {
                measure = objectMapper.readValue(
                    HttpRequestUtil.getRawData(get, connectionPoolManager.getConnectionPoolManager()),
                    Measure.class);
            } catch (IOException ex) {
                log.error("Error while parsing the response {}", ex.getMessage());

            }
            List<MeasureValue> values = measure.getValue();
            for (MeasureValue measureValue : values) {
                try {
                    deleteMeasure(measureValue.getMeasureId());
                } catch (Exception ex) {
                    log.error("Measure {} cannot be deleted : {}", measureValue.getMeasureId(), ex.getMessage());
                }

            }
        };
        // start the thread
        new Thread(deleteTask).start();
        return new ResponseEntity<>("Request accepted", HttpStatus.NO_CONTENT);

    }

    private ResponseEntity<String> deleteMeasure(String measureId) {
        String url = RefAppEnv.PERSISTENCE_SERVICE_MEASURE_URL + "measures('" + measureId + "')";
        return HttpRequestUtil.delete(new HttpDelete(url), connectionPoolManager.getConnectionPoolManager());
    }

}