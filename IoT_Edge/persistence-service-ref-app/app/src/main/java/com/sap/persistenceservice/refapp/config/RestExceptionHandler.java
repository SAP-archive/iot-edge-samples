package com.sap.persistenceservice.refapp.config;

import javax.persistence.EntityNotFoundException;
import javax.validation.ConstraintViolationException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.sap.persistenceservice.refapp.exception.PayloadValidationException;
import com.sap.persistenceservice.refapp.exception.ServiceBindingException;

/**
 * This class handles exceptions for REST APIs
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@ControllerAdvice
public class RestExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(RestExceptionHandler.class);

    private static final String INVALID_REQUEST = "Invalid request {}";

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    protected ResponseEntity<String> handleHttpRequestMethodNotSupportedException(

        HttpRequestMethodNotSupportedException ex) {
        log.error("Method not supported : {}", ex.getLocalizedMessage());
        return new ResponseEntity<>("Method not allowed", HttpStatus.METHOD_NOT_ALLOWED);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    protected ResponseEntity<String> handleMethodArgumentNotValidException(
        MethodArgumentNotValidException ex) {
        log.error("MethodArgumentNotValidException: {}", ex.getLocalizedMessage());
        String message = "Invalid argument";
        if (ex.getBindingResult().hasErrors()) {
            StringBuilder builder = new StringBuilder(message);
            builder.append(": ");
            ex.getBindingResult().getAllErrors().forEach(e -> builder.append(e.getDefaultMessage()).append(";"));
            builder.deleteCharAt(builder.length() - 1);
            message = builder.toString();
        }
        return new ResponseEntity<>(message, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    protected ResponseEntity<String> handleHttpMessageNotReadableException(
        HttpMessageNotReadableException ex) {
        log.error("Http Message Not Readable Exception : {}", ex.getLocalizedMessage());
        return new ResponseEntity<>("Invalid request payload", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    protected ResponseEntity<String> handleMethodArgumentTypeMismatchException(
        MethodArgumentTypeMismatchException ex) {
        log.error(INVALID_REQUEST, ex.getLocalizedMessage());
        return new ResponseEntity<>(
            "Invalid or out of range value " + ex.getValue() + " for " + ex.getName(),
            HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(PayloadValidationException.class)
    protected ResponseEntity<String> handlePayloadValidationException(
        PayloadValidationException ex) {
        log.error("Payload Validation exception: {}", ex.getLocalizedMessage());
        return new ResponseEntity<>(ex.getLocalizedMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    protected ResponseEntity<String> handleConstraintViolationException(
        ConstraintViolationException ex) {
        log.error(INVALID_REQUEST, ex.getLocalizedMessage());
        String message = "Invalid request";
        if (!ex.getConstraintViolations().isEmpty()) {
            StringBuilder builder = new StringBuilder(message);
            builder.append(": ");
            ex.getConstraintViolations().forEach(v -> builder.append(v.getMessage()).append(";"));
            builder.deleteCharAt(builder.length() - 1);
            message = builder.toString();
        }
        return new ResponseEntity<>(message, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    protected ResponseEntity<String> handleEntityNotFoundException(EntityNotFoundException ex) {
        log.error(INVALID_REQUEST, ex.getLocalizedMessage());
        return new ResponseEntity<>(ex.getMessage(),
            HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ServiceBindingException.class)
    protected ResponseEntity<String> handleServiceBindingException(ServiceBindingException ex) {
        log.error("Invalid service bindings {}", ex.getLocalizedMessage());
        return new ResponseEntity<>(ex.getMessage(),
            HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(Exception.class)
    protected ResponseEntity<String> handleException(Exception ex) {
        log.error("Internal server error: {}", ex.getLocalizedMessage());
        return new ResponseEntity<>("Internal server error! Please check logs for more details",
            HttpStatus.INTERNAL_SERVER_ERROR);
    }

}
