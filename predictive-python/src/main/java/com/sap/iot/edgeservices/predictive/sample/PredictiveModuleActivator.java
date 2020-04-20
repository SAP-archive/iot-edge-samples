/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Copyright (c) 2020 SAP SE or an affiliate company. All rights reserved.
 * The sample is not intended for production use.  Provided "as is".
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
package com.sap.iot.edgeservices.predictive.sample;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Dictionary;
import java.util.Hashtable;
import java.util.Optional;

import org.apache.commons.lang.StringUtils;
import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceEvent;
import org.osgi.framework.ServiceListener;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventConstants;
import org.osgi.service.event.EventHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sap.iot.edgeservices.configservice.service.IConfigStatusService;
import com.sap.iot.edgeservices.persistenceservice.service.IPersistenceService;
import com.sap.iot.edgeservices.predictive.sample.custom.PredictValues;
import com.sap.iot.edgeservices.predictive.sample.db.PersistenceClient;
import com.sap.iot.edgeservices.predictive.sample.proxies.ConfigurationFields;
import com.sap.iot.edgeservices.predictive.sample.proxies.CustomConfiguration;
import com.sap.iot.edgeservices.predictive.sample.utilities.ConfigurationHandler;

/**
 * This class is the entry point of the OSGi Bundle
 *
 * It also creates the Engine which is on a timer thread. The Engine is responsible for executing the Calculation.
 *
 * The Calculation is an interface, where the implementing class has the actual logic that is executed. In this example,
 * the CalculateAverages class implements Calculation, and is executed by the Engine every 5 seconds.
 *
 * The PersistenceClient provides access to the Persistence Service.
 *
 */
@Component(immediate = true)
public class PredictiveModuleActivator
implements BundleActivator, ServiceListener, EventHandler {

	private static final Logger LOGGER = LoggerFactory.getLogger(PredictiveModuleActivator.class); // logger
	private static final String EVENT_TOPIC = "RGBSERVICE"; // The Event Admin topic to subscribe to for config

	////////////////////
	// class fields
	////////////////////
	private static volatile CustomConfiguration configuration; // Custom configuration object dynamically loaded
	private static IConfigStatusService configStatusService; // Reference for the configuration service
	private static IPersistenceService service; // handle to the Persistence Service which this sample depends on
	private static BundleContext bundleContext; // bundle context of this bundle
	private static Engine engine; // custom class that executes logic on a timer
	private static PersistenceClient persistenceClient; // helper class to access the Persistence Service
	private static volatile String lastSuccessfulFingerprint; // fingerprint of the configuration
	// private IPersistenceService persistenceService; //persistence service ref

	/**
	 * remove persistence reference
	 */
	private static void removePersistenceReference() {
		PredictiveModuleActivator.service = null;
	}

	/**
	 * @param bundleContext
	 *            bundle context
	 */
	private static void setBundleContext(BundleContext bundleContext) {
		PredictiveModuleActivator.bundleContext = bundleContext;
	}

	public static String getLastSuccessfulFingerprint() {
		return lastSuccessfulFingerprint;
	}

	/**
	 * @param lastSuccessfulFingerprint
	 *            last fingerprint
	 */
	private static void setLastSuccessfulFingerprint(String lastSuccessfulFingerprint) {
		PredictiveModuleActivator.lastSuccessfulFingerprint = lastSuccessfulFingerprint;
	}

	public static CustomConfiguration getConfiguration() {
		return configuration;
	}

	/**
	 * @param conf
	 *            currenct active configuration
	 */
	private static void setConfiguration(CustomConfiguration conf) {
		PredictiveModuleActivator.configuration = conf;
	}

	/**
	 * initialize the persistence client
	 */
	private static void initPersistenceService() {
		LOGGER.debug("---- PersistenceSampleActivator.setPersistenceService");
		LOGGER.debug("---- service = {}", PredictiveModuleActivator.service);
		LOGGER.debug("---- context = {}", PredictiveModuleActivator.bundleContext);

		try {
			PredictiveModuleActivator.persistenceClient = new PersistenceClient(PredictiveModuleActivator.service,
				PredictiveModuleActivator.bundleContext);
		} catch (PersistenceException e) {
			LOGGER.error("Could not get token for database. Engine not started due to {}", e.getMessage(), e);
			LOGGER.error("Persistence sample is not running.");
			return;
		}
		PredictValues predictValues = new PredictValues(PredictiveModuleActivator.persistenceClient);
		PredictiveModuleActivator.engine = new Engine(predictValues, configuration.getAnalysisFrequency());
		PredictiveModuleActivator.engine.start();
	}

	/**
	 * initialize the configuration object
	 */
	private static void initConfiguration() {
		LOGGER.debug("Configuration is using topic: {}", EVENT_TOPIC);
		// load configuration from file or use a default configuration
		CustomConfiguration defaultConfig = ConfigurationHandler.loadDefaultConfiguration();
		setConfiguration(ConfigurationHandler.loadConfigurationFromDisk(defaultConfig, EVENT_TOPIC));
		setLastSuccessfulFingerprint(ConfigurationHandler.getLastFingerprint());
		// fallback to default
		if (configuration == null) {
			LOGGER.debug("Starting with default configuration");
			setConfiguration(defaultConfig);
			setLastSuccessfulFingerprint(null);
		}
	}

	////////////////////
	// public methods
	////////////////////
	/*
	 * this function is called by OSGi when the bundle loads and starts
	 */
	@Activate
	public void start(BundleContext bundleContext)
	throws Exception {
		LOGGER.debug("---- PersistenceSampleActivator.start");
		Dictionary<String, Object> properties = new Hashtable<>(); // NOSONAR
		// Register this class to listen over Event Admin for activation requests with the topic EVENT_TOPIC
		properties.put(EventConstants.EVENT_TOPIC, EVENT_TOPIC);
		bundleContext.registerService(EventHandler.class, this, properties);
		PredictiveModuleActivator.setBundleContext(bundleContext);
		// init configuration
		initConfiguration();
		// init persistence
		initPersistenceService();
		LOGGER.info("---- {} initialization success", this.getClass());

	}

	/*
	 * (non-Javadoc)
	 *
	 * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
	 */
	@Deactivate
	public void stop(BundleContext context)
	throws Exception {
		LOGGER.debug("---- PersistenceSampleActivator.stop");
		PredictiveModuleActivator.engine.stopGracefully();
		PredictiveModuleActivator.removePersistenceReference();
		PredictiveModuleActivator.setBundleContext(null);
	}

	/**
	 * If the Persistence Service changes (the underlying bundle swaps out the implementation) then we could reconnect
	 * without change. This is beyond the scope of this sample.
	 */
	@Override
	public void serviceChanged(ServiceEvent arg0) {
		LOGGER.debug("---- PersistenceSample:PersistenceSampleActivator.serviceChanged - no operation performed.");
	}

	/**
	 * @param event
	 *            handle the event to get new configurations
	 */
	@Override
	public void handleEvent(Event event) {
		// Check to see if the event received conforms to a config activation event
		// i.e. the event contains the config file to be activated and its associated fingerprint
		if (event.getProperty(ConfigurationFields.configFile.name()) instanceof File &&
			event.getProperty(ConfigurationFields.configFingerprint.name()) instanceof String) {
			File configFile = (File) event.getProperty(ConfigurationFields.configFile.name());
			String fingerprint = (String) event.getProperty(ConfigurationFields.configFingerprint.name());

			// Return if the sent config file has already been activated
			if (!StringUtils.isEmpty(lastSuccessfulFingerprint) && lastSuccessfulFingerprint.equals(fingerprint)) {
				return;
			}

			getConfigStatusService().ifPresent(cfgStatusService -> {
				try {
					String configFileContents = new String(Files.readAllBytes(configFile.toPath()),
						StandardCharsets.UTF_8);
					LOGGER.info("Config File Contents:\n{}", configFileContents);
					// Set the lastSuccessfulFingerprint to this config file's fingerprint if the config file was
					// successfully activated
					// Call the activationStatus Declarative Service with the activation result (true or false),
					// fingerprint, and a status message
					if (ConfigurationHandler.writeConfigurationToDisk(EVENT_TOPIC, configFileContents,
						fingerprint) != null) {
						setLastSuccessfulFingerprint(fingerprint);
						cfgStatusService.activationStatus(true, fingerprint, "Activation Succeeded");
					} else {
						cfgStatusService.activationStatus(false, fingerprint, "Activation Failed");
					}
				} catch (IOException e) {
					LOGGER.error("Cannot read config file: {}", e.getMessage(), e);
					cfgStatusService.activationStatus(false, fingerprint, "Cannot read config file: " + e.getMessage());
				}
			});
		}
	}

	/*
	 * When the Persistence Service is running and available, OSGi framework will call this function passing in the
	 * handle to the Persistence Service.
	 *
	 * This is considered to be the start of the OSGi bundle since we are only waiting on this service before it can
	 * start functioning.
	 */
	@Reference(service = IPersistenceService.class, cardinality = ReferenceCardinality.MANDATORY, policy = ReferencePolicy.STATIC)
	public synchronized void setPersistenceService(IPersistenceService serviceRef) {
		PredictiveModuleActivator.service = serviceRef;
	}

	/**
	 * If this Persistence Service shuts down, then this function will be called. Then engine will be stopped.
	 *
	 * @param service
	 *            Persistence service instance
	 */
	public synchronized void unsetPersistenceService(IPersistenceService service) {
		LOGGER.debug("---- PersistenceSample:PersistenceSampleActivator.unsetPersistenceService");
		if (PredictiveModuleActivator.service == service) {
			PredictiveModuleActivator.service = null;
			PredictiveModuleActivator.engine.stopGracefully();
		}
	}

	/**
	 * @param arg
	 *            remove the reference for the configuration status object
	 */
	void unsetConfigStatusService(IConfigStatusService arg) {
		if (configStatusService == arg) {
			configStatusService = null; // NOSONAR
		}
	}

	/**
	 * @return configuration status object
	 */
	private Optional<IConfigStatusService> getConfigStatusService() {
		return Optional.ofNullable(configStatusService);
	}

	/**
	 * @param arg
	 *            inject configuration status object
	 */
	@Reference(service = IConfigStatusService.class, cardinality = ReferenceCardinality.MANDATORY, policy = ReferencePolicy.STATIC)
	void setConfigStatusService(IConfigStatusService arg) {
		configStatusService = arg; // NOSONAR
	}
}
