package com.sap.iot.edgeservices.customhttpserver.http;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;

import java.net.URI;

public class CustomResponseEntity extends ResponseEntity {
    public CustomResponseEntity(HttpStatus status) {
        super(status);
    }

    public CustomResponseEntity(Object body, HttpStatus status) {
        super(body, status);
    }

    public CustomResponseEntity(MultiValueMap headers, HttpStatus status) {
        super(headers, status);
    }

    public CustomResponseEntity(Object body, MultiValueMap headers, HttpStatus status) {
        super(body, headers, status);
    }

    public CustomResponseEntity(Object body, MultiValueMap headers, int rawStatus) {
        super(body, headers, rawStatus);
    }

    public static ResponseEntity<java.lang.String> badReturn(String body) {
        return badRequest().body(body);
    }

    public static ResponseEntity<String> created(String message) {
        return status(HttpStatus.CREATED).body(message);
    }

}
