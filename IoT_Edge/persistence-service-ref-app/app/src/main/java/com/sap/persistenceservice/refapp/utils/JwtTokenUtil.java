package com.sap.persistenceservice.refapp.utils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Class to read the jwt token from pod's file system
 *
 */
public class JwtTokenUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenUtil.class);

    private JwtTokenUtil() {

    }

    public static String readJwtToken() {
        String content = "";
        try {
            content = new String(
                Files.readAllBytes(Paths.get(Constants.TOKEN_PATH)),
                StandardCharsets.UTF_8);
        } catch (IOException ex) {
            log.error("Error while reading the jwt token : {}", ex.getMessage());
        }
        return content;
    }
}
