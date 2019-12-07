package com.sap.iot.edgeservices.edgeml;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Dictionary;
import java.util.Enumeration;
import java.util.Hashtable;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.apache.commons.io.FilenameUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.BundleException;
import org.osgi.framework.Version;
import org.osgi.service.event.EventConstants;
import org.osgi.service.event.EventHandler;

import com.sap.iot.edgeservices.edgeml.util.SetupUtils;


public class Activator implements BundleActivator {

    private static final Logger LOGGER = LogManager.getLogger(Activator.class);

    // The parent "edgeservices/" directory
    private static final String EDGE_SERVICES_DIRECTORY = Paths.get(Paths.get(System.getProperty("user.dir")).getParent().toString(), "edgeservices").toString();
    private static final String ML_POC_DIRECTORY = Paths.get(EDGE_SERVICES_DIRECTORY, "ml_poc").toString();

    private static final String ML_POC_BIN_DIRECTORY = Paths.get(ML_POC_DIRECTORY, "bin").toString();
    private static final String ML_POC_MODEL_DIRECTORY = Paths.get(ML_POC_DIRECTORY, "model").toString();
    private static final String ML_POC_IMAGE_DIRECTORY = Paths.get(ML_POC_DIRECTORY, "image").toString();
    private static final String ML_POC_LOG_DIRECTORY = Paths.get(ML_POC_DIRECTORY, "logs").toString();

    private static final String ML_POC_SPLIT_DIRECTORY = Paths.get(ML_POC_DIRECTORY, "split").toString();
    private static final String ML_POC_SPLIT_PROCESSED_DIRECTORY = Paths.get(ML_POC_SPLIT_DIRECTORY, "processed").toString();
    private static final String ML_POC_INPUT_DIRECTORY = Paths.get(ML_POC_DIRECTORY, "input").toString();
    private static final String ML_POC_INPUT_PROCESSED_DIRECTORY = Paths.get(ML_POC_INPUT_DIRECTORY, "processed").toString();
    private static final String ML_POC_OUTPUT_DIRECTORY = Paths.get(ML_POC_DIRECTORY, "output").toString();

    private Process edgeDaemonProcess;
    private Process tfServerProcess;

    /*
     * BUNDLE ACTIVATOR METHODS:
     * These methods are used for customizing the starting and stopping of this bundle.
     */
    @Override
    public void start(BundleContext context) throws Exception {
        // Handle bundle upgrade. If another version of this bundle exists that has a lower version number,
        // uninstall and delete it.
        Bundle bundle = context.getBundle();
        String bundleName = bundle.getSymbolicName();
        Version bundleVersion = bundle.getVersion();

        try {

            for (Bundle installedBundle : context.getBundles()) {
                if (bundleName.equals(installedBundle.getSymbolicName()) && installedBundle.getVersion().compareTo(bundleVersion) < 0)  {
                    try {
                        installedBundle.uninstall();
                        String installedBundlePath = installedBundle.getLocation();
                        installedBundlePath = installedBundlePath.replaceFirst("initial@reference:", "");
                        installedBundlePath = installedBundlePath.replaceFirst("file:", "");
                        installedBundlePath = FilenameUtils.separatorsToSystem(installedBundlePath);
                        try {
                            Files.deleteIfExists(Paths.get(installedBundlePath));
                        } catch (IOException | InvalidPathException e) {
                            LOGGER.warn("Cannot delete older version of bundle. Bundle will be deleted on shutdown: {}", e.getMessage());
                            new File(installedBundlePath).deleteOnExit();
                        }
                    } catch (BundleException | IllegalStateException e) {
                        LOGGER.error("Cannot uninstall older version of bundle: {}", e.getMessage());
                    }
                }
            }
        } catch (IllegalStateException e) {
            LOGGER.error("Cannot get bundle: {}", e.getMessage());
        }

        // Register this class to listen over Event Admin for activation requests with the topic "CUSTOM"
        Dictionary<String, Object> properties = new Hashtable<>();
        properties.put(EventConstants.EVENT_TOPIC, ConfigServiceEventHandler.EVENT_TOPIC);
        context.registerService(EventHandler.class, new ConfigServiceEventHandler(), properties);

        // Register the OSGi bundle commands to the namespace "EdgeML" (see class "BundleCommands" defined below)
        properties.put("osgi.command.scope", "EdgeML");
        properties.put("osgi.command.function", new String[] { 
                "startEdgeDaemon", "stopEdgeDaemon", "startTensorFlowServer", "stopTensorFlowServer"
                });
        context.registerService(BundleCommands.class.getName(), new BundleCommands(this), properties);

        // Set up directory structure and extract bundle resources (script, model, etc.)
        LOGGER.info("Setting up directories ...");
        SetupUtils.createDirectories(ML_POC_DIRECTORY, ML_POC_BIN_DIRECTORY, ML_POC_LOG_DIRECTORY, 
                ML_POC_IMAGE_DIRECTORY, ML_POC_SPLIT_DIRECTORY, ML_POC_SPLIT_PROCESSED_DIRECTORY,
                ML_POC_INPUT_DIRECTORY, ML_POC_INPUT_PROCESSED_DIRECTORY, ML_POC_OUTPUT_DIRECTORY);


        LOGGER.info("Extracting bundle resources ...");
        try {
            copyBundleResource(bundle, "bin");
            copyBundleResource(bundle, "model");
        } catch (Exception e) {
            LOGGER.error("Could not extract resource.");
        }

        LOGGER.info("Edge ML PoC started");
    }

    @Override
    public void stop(BundleContext context) throws Exception {
        stopProcess(edgeDaemonProcess, "Edge ML Daemon script");
        stopProcess(tfServerProcess, "TensorFlow Server");

        LOGGER.info("Edge ML PoC stopped");
    }

    private void copyBundleResource(Bundle bundle, String bundleResource) {
        LogManager.getLogger().info("Copying {} bundle resource", bundleResource);
        try {
            Enumeration<URL> e = bundle.findEntries(bundleResource, "*", true);
            while (e.hasMoreElements()) {
                URL resourceURL = e.nextElement();
                if (resourceURL.getFile().endsWith("/")) {
                    Path resourceDirectory = Paths.get(ML_POC_DIRECTORY, resourceURL.getPath());
                    Files.createDirectories(resourceDirectory);
                } else {
                    Path resourceFile = Paths.get(ML_POC_DIRECTORY, resourceURL.getPath());
                    if (Files.notExists(resourceFile)) {
                        Files.createDirectories(resourceFile.getParent());
                        try (InputStream is = resourceURL.openStream()) {
                            Files.copy(is, resourceFile, StandardCopyOption.REPLACE_EXISTING);
                        }
                    }
                }
            }
        } catch (IOException e) {
            LOGGER.error("Unable to copy bundle resource {}. {}", bundleResource, e);
        }
    }

    private void stopProcess(Process p) {
        stopProcess(p, "background process");
    }

    private void stopProcess(Process p, String name) {
        if (p != null && p.isAlive()) {
            LOGGER.info("Stopping {} ...", name);
            p.destroy();
            try {
                p.waitFor(10, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            if (p.isAlive()) {
                LOGGER.warn("{} is still running after termination called. Stopping forcibly ...", name);
                p.destroyForcibly();
            } 
        } else {
            LOGGER.info("{} is not running.", name);
        }
    }

    /*
     * OSGI BUNDLE COMMANDS:
     * This class defines a set of OSGi commands that can be used from the command line.
     */
    public class BundleCommands {
        Activator activator;
        public BundleCommands(Activator activator) {
            this.activator = activator;
        }

        public void startEdgeDaemon() {
            List<String> command = Arrays.asList(
                    "python3",
                    Paths.get(ML_POC_DIRECTORY, "bin", "edge_ml_daemon.py").toString()
                    );
            
            Thread t = new Thread( () -> {
                LOGGER.info("Starting Edge ML Daemon script ...");
                try {
                    ProcessBuilder pb = new ProcessBuilder();
                    pb.command(command);
                    pb.directory(new File(ML_POC_BIN_DIRECTORY));
                    pb.inheritIO();

                    edgeDaemonProcess = pb.start();    
                } catch (IOException ioe) {
                    LOGGER.error("Error occurred while running Edge ML Daemon script. {}", ioe);
                }
            });
            t.start();
        }
        
        public void stopEdgeDaemon() {
            stopProcess(edgeDaemonProcess, "Edge ML Daemon script");
        }

        public void startTensorFlowServer() {
            ProcessBuilder tfpb = new ProcessBuilder();

            // TODO: Move these variables to somewhere where they can be configurable
            String port = "8500";
            String restAPIPort = "8501";
            String modelName = "Volvo01";
            
            List<String> command = Arrays.asList(
                    "tensorflow_model_server",
                    "--port=" + port,
                    "--rest_api_port=" + restAPIPort, 
                    "--model_name=" + modelName, 
                    "--model_base_path=" + Paths.get(ML_POC_MODEL_DIRECTORY, modelName).toString()
                    );

            Thread t = new Thread( () -> {
                LOGGER.info("Starting TensorFlow Serving with model name [{}] on port [{}]. REST API Port [{}]", 
                        modelName, port, restAPIPort);
                try {
                    File f = new File(ML_POC_LOG_DIRECTORY, "tensorflow_server.log");
                    f.createNewFile();

                    tfpb.command(command);
                    tfpb.directory(new File(ML_POC_MODEL_DIRECTORY));
                    tfpb.redirectInput(f);
                    tfpb.redirectOutput(f);
                    tfpb.redirectErrorStream(true);

                    tfServerProcess = tfpb.start();
                } catch (IOException ioe) {
                    LOGGER.error("Error occurred while running TensorFlow Server. {}", ioe);
                }
            });
            t.start();
        }

        public void stopTensorFlowServer() {
            stopProcess(tfServerProcess, "TensorFlow Server");
        }
    }
}
