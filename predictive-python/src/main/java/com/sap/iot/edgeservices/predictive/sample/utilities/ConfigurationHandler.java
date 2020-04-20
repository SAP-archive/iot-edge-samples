/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Copyright (c) 2020 SAP SE or an affiliate company. All rights reserved.
 * The sample is not intended for production use.  Provided "as is".
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
package com.sap.iot.edgeservices.predictive.sample.utilities;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.iot.edgeservices.predictive.sample.proxies.CustomConfiguration;

public class ConfigurationHandler {
	private static final Logger LOGGER = LoggerFactory.getLogger(ConfigurationHandler.class); // logger
	private static final String BASE_PATH = "./../edgeservices/"; // base path for custom configuration, same of other
																	// services
	private static final String UNIFORM_PATH_SEPARATOR = "/"; // linux/windows valid file separator

	private static ObjectMapper mapper = new ObjectMapper()
		.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
		.configure(DeserializationFeature.FAIL_ON_MISSING_CREATOR_PROPERTIES, false); // json object mapper
	private static String lastFingerprint = null; // last used fingerprint

	// Constructors
	private ConfigurationHandler() {
		super();
	}

	/**
	 * load an existing configuration
	 * 
	 * @param serviceName
	 *            name of current service
	 * @return the existing configuration (if any)
	 */
	public static CustomConfiguration loadConfigurationFromDisk(CustomConfiguration defaultConfiguration,
		String serviceName) {
		if (defaultConfiguration == null) {
			defaultConfiguration = loadDefaultConfiguration();
		}
		// existing file paths
		String jsonFile = BASE_PATH + serviceName + "/" + serviceName + ".json";
		String fingerprintFile = BASE_PATH + serviceName + "/" + serviceName + "_fingerprint.txt";
		CustomConfiguration fromFile = null;
		String content = null;
		String fingerprint = null;
		File path = new File(jsonFile);
		if (!path.exists()) {
			LOGGER.info("Configuration file does not exists: {}", jsonFile);
			return null;
		}
		try {
			byte[] contentBytes = Files.readAllBytes(Paths.get(jsonFile));
			content = new String(contentBytes, Charset.defaultCharset());
		} catch (IOException e) {
			LOGGER.error("Unable to read configuration from file: {} due to {}", jsonFile, e.getMessage(), e);
		}
		// if there is no file there is also no needs to load the fingerprint
		if (!StringUtils.isEmpty(content)) {
			try {
				byte[] contentBytes = Files.readAllBytes(Paths.get(fingerprintFile));
				fingerprint = new String(contentBytes, Charset.defaultCharset());
			} catch (IOException e) {
				LOGGER.error("Unable to read configuration from file: {} due to {}", fingerprintFile, e.getMessage(),
					e);
			}
			// convert to a POJO
			fromFile = extractCustomConfiguration(content);
		}
		// populate missing values
		if (fromFile != null) {
			fromFile.mergeMissingValues(defaultConfiguration);
		} else {
			LOGGER.error("Unable to extract POJO configuration");
			return defaultConfiguration;
		}
		// set the fingerprint
		lastFingerprint = fingerprint;
		return fromFile;
	}

	/**
	 * write a configuration into the disk
	 * 
	 * @param serviceName
	 *            the service name
	 * @param content
	 *            string with the content of the configuration
	 * @param fingerprint
	 *            current fingerprint
	 * @return the written configuration object
	 */
	public static CustomConfiguration writeConfigurationToDisk(String serviceName, String content, String fingerprint) {
		// convert the string to a POJO
		CustomConfiguration conf = extractCustomConfiguration(content);
		if (conf == null) {
			// configuration not valid
			return null;
		}
		// build the path and make the dirs
		String basePath = BASE_PATH + serviceName;
		File path = new File(basePath);
		if (!path.exists()) {
			boolean created = path.mkdirs();
			if (!created) {
				LOGGER.error("Unable to create the path tree: {}", basePath);
				return null;
			}
		}
		// write configuration to json file
		try {
			String filename = serviceName + ".json";
			File jsonFile = new File(basePath + UNIFORM_PATH_SEPARATOR + filename);
			FileUtils.writeStringToFile(jsonFile, content, Charset.defaultCharset().name());
		} catch (IOException e) {
			LOGGER.error("Unable to write the file: {}.json due to {}", serviceName, e.getMessage(), e);
			return null;
		}
		// persist fingerprint
		try {
			String filename = serviceName + "_fingerprint.txt";
			File fingerprintFile = new File(basePath + UNIFORM_PATH_SEPARATOR + filename);
			FileUtils.writeStringToFile(fingerprintFile, fingerprint, Charset.defaultCharset().name());
		} catch (IOException e) {
			LOGGER.error("Unable to write the file: {}_fingerprint.txt due to {}", serviceName, e.getMessage(), e);
			return null;
		}
		// set reference for the last fingerprint
		lastFingerprint = fingerprint;
		return conf;
	}

	/**
	 * convert the configuration from string to object
	 * 
	 * @param content
	 *            json string of the configuration
	 * @return configuration object
	 */
	private static CustomConfiguration extractCustomConfiguration(String content) {
		try {
			return mapper.readValue(content, CustomConfiguration.class);
		} catch (IOException e) {
			LOGGER.error("Unable to read configuration {}", e.getMessage(), e);
		}
		return null;
	}

	/**
	 * @return default configuration object
	 */
	public static CustomConfiguration loadDefaultConfiguration() {
		// load default file from classloader
		InputStream stream = ConfigurationHandler.class.getClassLoader()
			.getResourceAsStream("defaultConfiguration.json");
		if (stream == null) {
			LOGGER.error("No default configuration file");
			return null;
		}
		String content = null;
		CustomConfiguration config = null;
		try {
			// convert the stream to a string
			content = IOUtils.toString(stream, Charset.defaultCharset().name());
		} catch (IOException e) {
			LOGGER.error("Unable to read configuration file {}", e.getMessage(), e);
		}
		// if the file is potentially valid extract the POJO
		if (!StringUtils.isEmpty(content)) {
			config = extractCustomConfiguration(content);
		}
		return config;
	}

	// getters
	public static String getLastFingerprint() {
		return lastFingerprint;
	}
}
