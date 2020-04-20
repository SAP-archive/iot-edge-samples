package com.sap.iot.edgeservices.edgeml.util;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;


public final class SetupUtils {
    private static final Logger LOGGER = LogManager.getLogger(SetupUtils.class);

    private SetupUtils() {}

    public static void createDirectory(String directory) {
        createDirectories(directory);
    }

    public static void createDirectories(String... directories) {
        for (String directory : directories) {
            Path directoryPath = Paths.get(directory);
            if (!Files.exists(directoryPath)) {
                try {
                    LOGGER.debug("Creating directory {}", directoryPath);
                    Files.createDirectories(directoryPath);
                } catch (IOException ioe) {
                    LOGGER.error("Cannot create directory: {}", ioe.getMessage());
                }
            }
        }
    }
}
