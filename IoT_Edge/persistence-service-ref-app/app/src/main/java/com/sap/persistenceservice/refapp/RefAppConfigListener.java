package com.sap.persistenceservice.refapp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;

import com.sap.persistenceservice.refapp.utils.RefAppEnv;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.LoggerContext;

public class RefAppConfigListener implements ApplicationListener<ApplicationEnvironmentPreparedEvent> {

    private static final Logger log = LoggerFactory.getLogger(RefAppConfigListener.class);

    private static final String[] REF_APP_LOGGERS = { "com.sap.persistenceservice.refapp" };

    @Override
    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {
        configureLogger();

    }

    private void configureLogger() {

        LoggerContext loggerContext = (LoggerContext) LoggerFactory.getILoggerFactory();

        Level logLevel = Level.INFO;
        try {
            logLevel = Level.valueOf(RefAppEnv.LOG_LEVEL);
        } catch (IllegalArgumentException ex) {
            logLevel = Level.INFO;
        }

        log.info("Changing the ref app log level to {}", logLevel);

        for (String logger : REF_APP_LOGGERS) {
            loggerContext.getLogger(logger).setLevel(logLevel);
        }

    }

}
