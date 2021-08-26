package com.sap.iotservices.gateway.interceptor;

import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Dictionary;
import java.util.Hashtable;
import java.util.concurrent.atomic.AtomicReference;

import org.apache.commons.lang.StringUtils;
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
import com.sap.iotservices.gateway.interceptor.managers.ConfigurationHandler;
import com.sap.iotservices.gateway.interceptor.proxies.ConfigurationFields;
import com.sap.iotservices.gateway.interceptor.proxies.CustomConfiguration;
import com.sap.iotservices.gateway.interceptor.proxies.ExtendedCustomConfiguration;
import com.sap.iotservices.gateway.interceptor.proxies.MqttInterop;
import com.sap.iotservices.hooks.gateway.IGatewayInterceptor;
import com.sap.iotservices.hooks.gateway.IGatewayInterceptorService;
import com.sap.iotservices.utils.DSUtils;

/**
 * This class starts the actual implementation for the Interceptor
 */
@Component(immediate = true)
public class ExternalFlowActivator
implements ServiceListener, EventHandler {

	private static final Logger log = LoggerFactory.getLogger(ExternalFlowActivator.class);
	private static final String EVENT_TOPIC = "EXTERNALFLOW"; // The Event Admin topic to subscribe to for config
	private static CustomConfiguration configuration;
	private static boolean initialized = false;
	private static String lastSuccessfulFingerprint;
	private static AtomicReference<IConfigStatusService> configStatusService = new AtomicReference<>();
	private static final Object lock = new Object();
	private static volatile boolean ingestionEnabled = true;
	/**
	 * Interceptor Manager
	 */
	private static AtomicReference<IGatewayInterceptorService> interceptorMngr = new AtomicReference<>();
	private boolean registered = false;
	private IGatewayInterceptor interceptor;

	public static boolean isInitialized() {
		return initialized;
	}

	public static void setInitialized(boolean initialized) {
		com.sap.iotservices.gateway.interceptor.ExternalFlowActivator.initialized = initialized;
	}

	public static IConfigStatusService getConfigStatusService() {
		return DSUtils.get(log, configStatusService, DSUtils.WAIT_FOR_VALID_REFERENCE);
	}

	@Reference(service = IConfigStatusService.class, cardinality = ReferenceCardinality.MANDATORY, policy = ReferencePolicy.STATIC)
	void setConfigStatusService(IConfigStatusService arg) {
		DSUtils.setRef(log, configStatusService, arg, IConfigStatusService.class, this.getClass());
	}

	public static String getLastSuccessfulFingerprint() {
		return lastSuccessfulFingerprint;
	}

	/**
	 * @param lastSuccessfulFingerprint
	 *            last fingerprint
	 */
	private static void setLastSuccessfulFingerprint(String lastSuccessfulFingerprint) {
		com.sap.iotservices.gateway.interceptor.ExternalFlowActivator.lastSuccessfulFingerprint = lastSuccessfulFingerprint;
	}

	public static CustomConfiguration getConfiguration() {
		return configuration;
	}

	/**
	 * @param conf
	 *            currenct active configuration
	 */
	private static void setConfiguration(CustomConfiguration conf) {
		com.sap.iotservices.gateway.interceptor.ExternalFlowActivator.configuration = conf;
		Boolean enabled = conf.getIngestionEnabled();
		if (enabled == null) {
			setIngestionEnabled(true);
		} else {
			setIngestionEnabled(enabled);
		}
	}

	public static boolean isIngestionEnabled() {
		return ingestionEnabled;
	}

	public static void setIngestionEnabled(boolean ingestionEnabled) {
		ExternalFlowActivator.ingestionEnabled = ingestionEnabled;
	}

	/**
	 * initialize the configuration object
	 */
	private static void initConfiguration() {
		log.debug("Configuration is using topic: {}", EVENT_TOPIC);
		// load configuration from file or use a default configuration
		CustomConfiguration defaultConfig = ConfigurationHandler.loadDefaultConfiguration();
		setConfiguration(ConfigurationHandler.loadConfigurationFromDisk(defaultConfig, EVENT_TOPIC));
		setLastSuccessfulFingerprint(ConfigurationHandler.getLastFingerprint());
		// fallback to default
		if (configuration == null && defaultConfig != null) {
			log.debug("Starting with default configuration");
			setConfiguration(defaultConfig);
			setLastSuccessfulFingerprint(null);
		}
	}

	public static void reInitMqtt() {
		try {
			closeOldMqtt();
		} catch (Exception e) {
			log.error("Unable to close MQTT: {}", e.getMessage(), e);
		}
		try {
			startNewMqtt();
		} catch (Exception e) {
			log.error("Unable to initialize MQTT: {}", e.getMessage(), e);
		}
	}

	static void closeOldMqtt() {
		MqttInterop.unsubscribeTopics(MqttInterop.getInTopic());
		MqttInterop.disconnect();
	}

	static void startNewMqtt() {
		MqttInterop.init();
		MqttInterop.subscribeTopics(MqttInterop.getInTopic());
	}

	public static IGatewayInterceptorService getInterceptorManager() {
		return DSUtils.get(log, interceptorMngr, DSUtils.WAIT_FOR_VALID_REFERENCE);
	}

	@Reference(cardinality = ReferenceCardinality.AT_LEAST_ONE, policy = ReferencePolicy.DYNAMIC)
	void setInterceptorManager(IGatewayInterceptorService arg) {
		DSUtils.setRef(log, interceptorMngr, arg, IGatewayInterceptorService.class, this.getClass());
	}

	@Activate
	public void start(BundleContext bundleContext) {
		log.info("Starting Gateway Interceptor...");
		Dictionary<String, Object> properties = new Hashtable<>(); // NOSONAR
		// Register this class to listen over Event Admin for activation requests with the topic EVENT_TOPIC
		properties.put(EventConstants.EVENT_TOPIC, EVENT_TOPIC);
		bundleContext.registerService(EventHandler.class, this, properties);
		com.sap.iotservices.gateway.interceptor.ExternalFlowActivator.initConfiguration();
		startNewMqtt();
		this.interceptor = new InterceptorImpl();

		new Thread(() -> {
			IGatewayInterceptorService interceptorMng = getInterceptorManager();

			synchronized (lock) {
				if ((interceptorMng != null) && (!registered)) {
					log.info("Registering implementation of the flow interceptor");
					registered = interceptorMng.addInterceptor(interceptor);
				}
			}
		}).start();

	}

	@Deactivate
	public void stop(BundleContext bundleContext) {
		log.info("Stopping External Flow...");
		if (registered){
			IGatewayInterceptorService interceptorMng = getInterceptorManager();

			synchronized (lock) {
				if ((interceptorMng != null) && (!registered)) {
					log.info("Unregistering implementation of the flow interceptor");
					interceptorMng.removeInterceptor(interceptor);
				}
			}
		}
	}

	void unsetConfigStatusService(IConfigStatusService arg) {
		DSUtils.removeRef(log, configStatusService, arg, IConfigStatusService.class, this.getClass());
	}

	/**
	 * @param event
	 *            handle the event to get new configurations
	 */
	@Override
	public void handleEvent(Event event) {
		log.info("RECEIVED CONFIGURATION");
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

			IConfigStatusService configStatus = getConfigStatusService();
			if (configStatus != null) {
				try {
					String configFileContents = new String(Files.readAllBytes(configFile.toPath()),
							Charset.defaultCharset());
					log.info("Config File Contents:\n{}", configFileContents);
					ExtendedCustomConfiguration customConfiguration = ConfigurationHandler
						.writeConfigurationToDisk(EVENT_TOPIC, configFileContents, fingerprint);
					// Set the lastSuccessfulFingerprint to this config file's fingerprint if the config file was
					// successfully activated
					// Call the activationStatus Declarative Service with the activation result (true or false),
					// fingerprint, and a status message
					if (customConfiguration != null) {
						setConfiguration(customConfiguration);
						setLastSuccessfulFingerprint(fingerprint);
						configStatus.activationStatus(true, fingerprint, "Activation Succeeded");
						String topic = customConfiguration.getExternalConfigurationTopic();
						if (StringUtils.isEmpty(topic)) {
							topic = EVENT_TOPIC;
						}
						String msg = "{\"file\":\"" + customConfiguration.getConfigurationFile() + "\"}";
						MqttInterop.sendMessage(topic, msg);
					} else {
						configStatus.activationStatus(false, fingerprint, "Activation Failed");
					}
				} catch (IOException e) {
					log.error("Cannot read config file: {}", e.getMessage(), e);
					configStatus.activationStatus(false, fingerprint, "Cannot read config file: " + e.getMessage());
				}
			}
		}
	}

	@Override
	public void serviceChanged(ServiceEvent arg0) {
		log.debug("---- serviceChanged - no operation performed.");
	}

	void unsetInterceptorManager(IGatewayInterceptorService arg) {
		DSUtils.removeRef(log, interceptorMngr, arg, IGatewayInterceptorService.class, this.getClass());
	}
}