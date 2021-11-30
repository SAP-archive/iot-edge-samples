package com.sap.persistenceservice.refapp;

import java.util.TimeZone;

import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.web.servlet.error.ErrorMvcAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;

import com.sap.persistenceservice.refapp.utils.Constants;
import com.sap.persistenceservice.refapp.utils.RefAppEnv;

@SpringBootApplication
@EnableAutoConfiguration(exclude = { ErrorMvcAutoConfiguration.class, DataSourceAutoConfiguration.class })
public class PersistenceServiceRefAppApplication {

    public static void main(String[] args) {
        // Enforce that any Date objects use UTC timestamps when updating the edge database
        TimeZone.setDefault(TimeZone.getTimeZone(Constants.DEFAULT_TIME_ZONE));
        new SpringApplicationBuilder(PersistenceServiceRefAppApplication.class)
            .properties(RefAppEnv.getApplicationProperties()).run(args);
    }

}
