package com.sap.persistenceservice.refapp.controller;

import java.io.IOException;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.persistenceservice.refapp.bean.Measure;
import com.sap.persistenceservice.refapp.bean.MeasureBean;
import com.sap.persistenceservice.refapp.bean.MeasureRequest;
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

    @PostMapping(value = "/measures")
    @Operation(description = "Post a measure to rest adapter")
    public MeasureRequest postMeasure(@RequestBody MeasureRequest request) throws IOException {
        log.info("Request - create a measure");
        HttpPost post = new HttpPost(
            "http://" + request.getExternalIp() + ":61657/measures/" + request.getDeviceAlternateId());
        MeasureBean bean = new MeasureBean();
        bean.setCapabilityAlternateId(request.getCapabilityAlternateId());
        bean.setMeasures(request.getMeasures());
        bean.setSensorAlternateId(request.getSensorAlternateId());
        String objectval = new ObjectMapper().writeValueAsString(bean);
        log.info("Post data {}", objectval);
        post.setEntity(new StringEntity(objectval));
        post.setHeader("Content-Type", "application/json");
        HttpRequestUtil.postData(post, connectionPoolManager.getIotConnectionManager());
        return request;
    }

    @GetMapping(value = "/measures", produces = { MediaType.APPLICATION_ATOM_XML_VALUE,
        MediaType.APPLICATION_JSON_VALUE })
    @Operation(description = "Returns the device measures")
    public ResponseEntity<String> getDeviceMeasures(HttpServletRequest httpServletRequest) {
        String url = RefAppEnv.PERSISTENCE_SERVICE_MEASURE_URL + "measures?$expand=*";

        HttpGet get = new HttpGet(url);

        ResponseEntity<String> data = HttpRequestUtil.getData(get, connectionPoolManager.getConnectionPoolManager());

        return data;

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