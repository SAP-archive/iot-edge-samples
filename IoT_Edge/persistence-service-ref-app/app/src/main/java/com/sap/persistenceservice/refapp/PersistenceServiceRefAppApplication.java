package com.sap.persistenceservice.refapp;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.web.servlet.error.ErrorMvcAutoConfiguration;

import com.sap.persistenceservice.refapp.utils.Constants;

@SpringBootApplication
@EnableAutoConfiguration(exclude = { ErrorMvcAutoConfiguration.class, DataSourceAutoConfiguration.class })
public class PersistenceServiceRefAppApplication {

    public static void main(String[] args) {
        // Enforce that any Date objects use UTC timestamps when updating the edge database
        TimeZone.setDefault(TimeZone.getTimeZone(Constants.DEFAULT_TIME_ZONE));
        SpringApplication.run(PersistenceServiceRefAppApplication.class, args);
    }

}
