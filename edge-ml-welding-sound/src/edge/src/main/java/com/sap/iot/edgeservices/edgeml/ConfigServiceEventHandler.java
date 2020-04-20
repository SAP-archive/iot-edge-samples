package com.sap.iot.edgeservices.edgeml;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.Properties;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.osgi.service.component.annotations.ReferencePolicyOption;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.iot.edgeservices.configservice.service.IConfigStatusService;
import com.sap.iot.edgeservices.edgeml.config.EdgeMLConfiguration;
import com.sap.iot.edgeservices.edgeml.config.IoTServiceInformation;
import com.sap.iot.edgeservices.edgeml.config.LoggingInformation;
import com.sap.iot.edgeservices.edgeml.config.TensorFlowServerInformation;

// Instantiate this component immediately so it can start listening for config activation request events right away
@Component(immediate = true)
public final class ConfigServiceEventHandler implements EventHandler {

    private static final Logger LOGGER = LogManager.getLogger(ConfigServiceEventHandler.class);

    private static final String EDGE_SERVICES_DIRECTORY = Paths.get(Paths.get(System.getProperty("user.dir")).getParent().toString(), "edgeservices").toString();
    private static final String ML_POC_DIRECTORY = Paths.get(EDGE_SERVICES_DIRECTORY, "ml_poc").toString();

    private static final String CONFIG_FILE_PROPERTY_NAME = "configFile";
    private static final String CONFIG_FINGERPRINT_PROPERTY_NAME = "configFingerprint";

    // Keeps track of the last successful fingerprint for the config file that was activated
    private static String lastSuccessfulFingerprint = "";

    private static IConfigStatusService configStatusService;

    // The Event Admin topic to subscribe to for config activation requests
    public static final String EVENT_TOPIC = "MLPOC";


    /*
     * EVENT HANDLER METHOD:
     * This method is used to handle activation requests sent by the ConfigService bundle through Event Admin.
     */
    @Override
    public synchronized void handleEvent(Event event) {
        // Check to see if the event received conforms to a config activation event
        //  i.e. the event contains the config file to be activated and its associated fingerprint
        if (event.getProperty(CONFIG_FILE_PROPERTY_NAME) instanceof File 
                && event.getProperty(CONFIG_FINGERPRINT_PROPERTY_NAME) instanceof String) {
            File configFile = (File) event.getProperty(CONFIG_FILE_PROPERTY_NAME);
            String fingerprint = (String) event.getProperty(CONFIG_FINGERPRINT_PROPERTY_NAME);

            // Return if the sent config file has already been activated
            if (lastSuccessfulFingerprint.equals(fingerprint)) {
                return;
            }

            getConfigStatusService().ifPresent(configStatusService -> {
                try {
                    String configFileContents = new String(Files.readAllBytes(configFile.toPath()), StandardCharsets.UTF_8);
                    LOGGER.debug("Config File Contents:\n{}", configFileContents);

                    // Set the lastSuccessfulFingerprint to this config file's fingerprint if the config file was successfully activated
                    // Call the activationStatus Declarative Service with the activation result (true or false), fingerprint, and a status message
                    if ( processConfiguration(configFile) ) {
                        lastSuccessfulFingerprint = fingerprint;
                        configStatusService.activationStatus(true, fingerprint, "Activation Succeeded");
                    } else {
                        configStatusService.activationStatus(false, fingerprint, "Activation Failed");
                    }
                } catch (IOException e) {
                    configStatusService.activationStatus(false, fingerprint, "Cannot read config file: " + e.getMessage());
                }
            });
        }
    }

    private Boolean processConfiguration(File configFile) {
        final ObjectMapper om = new ObjectMapper();

        try (OutputStream out = new FileOutputStream(Paths.get(ML_POC_DIRECTORY, "config.properties").toFile())) {
            EdgeMLConfiguration config = om.readValue(configFile, EdgeMLConfiguration.class);

            Properties props = new Properties();

            // Set the IoT Service information
            IoTServiceInformation iotInfo = config.getOutputIoTService();
            if (iotInfo != null) {
                LOGGER.trace("Found IoT Service information");

                props.setProperty("iotservice.deviceId", iotInfo.getDeviceId());
                props.setProperty("iotservice.sensorId", iotInfo.getSensorId());
                props.setProperty("iotservice.sensorTypeAlternateId", iotInfo.getSensorTypeAlternateId());
                props.setProperty("iotservice.capabilityAlternateId", iotInfo.getCapabilityAlternateId());
                props.setProperty("iotservice.send", Boolean.toString(iotInfo.getSendToIoTService()));
            }

            // Set the TensorFlow Server information
            TensorFlowServerInformation tfInfo = config.getTfServerInformation();
            if (tfInfo != null) {
                LOGGER.trace("Found TensorFlow Server information");

                props.setProperty("tf.port", tfInfo.getPort());
                props.setProperty("tf.restAPIPort", tfInfo.getRestAPIPort());
                props.setProperty("tf.modelName", tfInfo.getModelName());
            }

            LoggingInformation logInfo = config.getLogging();
            if (logInfo != null) {
                LOGGER.trace("Found Logging information");

                props.setProperty("log.bundle", logInfo.getBundleLogLevel());
                props.setProperty("log.daemon", logInfo.getDaemonLogLevel());
            }

            if (config.getClassifications() != null) {
                props.setProperty("classifications", config.getClassifications().toString());
            }

            props.setProperty("modelDownloadInterval", Float.toString(config.getModelDownloadInterval()));

            props.store(out, null);

        } catch (IOException ioe) {
            LOGGER.error("Failed to process configuration.");
            return false;
        }

        LOGGER.info("Configuration file processed successfully.");
        return true;
    }

    /*
     * DECLARATIVE SERVICES METHODS:
     * These methods are used by Declarative Services to set, unset, and get an IConfigStatusService instance.
     */
    @Reference(cardinality = ReferenceCardinality.OPTIONAL, policy = ReferencePolicy.DYNAMIC, policyOption = ReferencePolicyOption.GREEDY)
    void setConfigStatusService(IConfigStatusService arg) {
        configStatusService = arg;
    }

    void unsetConfigStatusService(IConfigStatusService arg) {
        if (configStatusService == arg) {
            configStatusService = null;
        }
    }

    private Optional<IConfigStatusService> getConfigStatusService() {
        return Optional.ofNullable(configStatusService);
    }

}
