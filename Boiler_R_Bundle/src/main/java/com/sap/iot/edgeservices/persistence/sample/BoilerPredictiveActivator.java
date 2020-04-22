/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
  * Copyright (c) 2017 SAP SE or an affiliate company. All rights reserved.
  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * **/

package com.sap.iot.edgeservices.persistence.sample;

import com.sap.iot.edgeservices.persistence.sample.custom.CalculateFFT;
import com.sap.iot.edgeservices.persistence.sample.db.PersistenceClient;
import com.sap.iot.edgeservices.persistenceservice.service.IPersistenceService;
import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceEvent;
import org.osgi.framework.ServiceListener;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.FileAttribute;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.Dictionary;
import java.util.Hashtable;
import java.util.Properties;
import java.util.Set;
/**
 * This class is the entry point of the OSGi Bundle
 *
 * It also creates the Engine which is on a timer thread.  The Engine is responsible for executing the
 * Calculation.
 *
 * The Calculation is an interface, where the implementing class has the actual logic that is executed.
 * In this example, the CalculateAverages class implements Calculation, and is executed by the Engine
 * every 5 seconds.
 *
 * The PersistenceClient provides access to the Persistence Service.
 *
 * @author David Loop (i826651)
 *
 */
@Component
public class BoilerPredictiveActivator implements BundleActivator, ServiceListener {
    ////////////////////
    // class fields
    ////////////////////
    //private static final Logger logger = LoggerFactory.getLogger(BoilerPredictiveActivator.class);


    private static IPersistenceService service;          // handle to the Persistence Service which this sample depends on
    private static BundleContext bundleContext;          // bundle context of this bundle
    private static Engine engine = null;                 // custom class that executes logic on a timer
    private static CalculateFFT calculateFFT;            // custom logic executed by the engine
    private static PersistenceClient persistenceClient;  // helper class to access the Persistence Service
    private static File baseInstallDir = null;           // default export location
    private static File rDir = null;                     // R model export location
    private static File configProperties = null;
    private static OS_ARCH OSArch = OS_ARCH.NONE;

    //public static String LOG_LEVEL_STRING = "INFO";
    public static String LOG_LEVEL_STRING = "DEBUG";

    ////////////////////
    // public methods
    ////////////////////

    /*
     * Helper function used by the entire application
     * TODO: replace with log4j
     */
    public static void printlnDebug(String str) {
        if ( LOG_LEVEL_STRING.equals("DEBUG") ) {
            System.out.println("BOILER_R: (D)" + str);
        }
    }

    /*
     * Helper function used by the entire application
     * TODO: replace with log4j
     */
    public static void println(String str) {
        System.out.println("BOILER_R: " + str);
    }

    /*
     * this function is called by OSGi when the bundle loads and starts
     */
    public void start(BundleContext bundleContext) throws Exception {
        Dictionary<String, Object> properties = new Hashtable<String, Object>();
        properties.put("osgi.command.scope", "PersistenceService");
        properties.put("osgi.command.function", new String[] {"BP_bundle", "BP_status", "BP_logger"});
        bundleContext.registerService(BPCommands.class.getName(), new BPCommands(this), properties);
        BoilerPredictiveActivator.printlnDebug("---- BoilerPredictiveActivator.start");
        OSArch = OSChecker.getOSArch();
        BoilerPredictiveActivator.bundleContext = bundleContext;
        baseInstallDir = new File(bundleContext.getBundle().getSymbolicName());
        configProperties = new File(baseInstallDir, "config.properties");
        rDir = new File(baseInstallDir, "boiler-R");
        BoilerPredictiveActivator.printlnDebug("---- BoilerPredictiveActivator extracting dependencies to " + rDir.getAbsolutePath());
        extractDependencies(baseInstallDir, bundleContext);
        loadConfigProperties(configProperties);
    }

    /*
     * (non-Javadoc)
     * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
     */
    public void stop(BundleContext context) throws Exception {
        BoilerPredictiveActivator.printlnDebug("---- BoilerPredictiveActivator.stop");
        if (BoilerPredictiveActivator.engine != null) {
            BoilerPredictiveActivator.engine.stopGracefully();
        }
        BoilerPredictiveActivator.service = null;
        BoilerPredictiveActivator.bundleContext = null;
    }

    /*
     * When the Persistence Service is running and available, OSGi framework will call this function
     * passing in the handle to the Persistence Service.
     *
     * This is considered to be the start of the OSGi bundle since we are only waiting on this service
     * before it can start functioning.
     */
    @Reference(service = IPersistenceService.class, cardinality = ReferenceCardinality.MANDATORY, policy = ReferencePolicy.STATIC)
    public synchronized void setPersistenceService(IPersistenceService serviceRef) {
        BoilerPredictiveActivator.printlnDebug("---- BoilerPredictiveActivator.setPersistenceService");
        BoilerPredictiveActivator.printlnDebug("--- service = " + BoilerPredictiveActivator.service);
        BoilerPredictiveActivator.printlnDebug("--- new service = " + serviceRef );

        BoilerPredictiveActivator.printlnDebug("---- context = " + BoilerPredictiveActivator.bundleContext);
        //BoilerPredictiveActivator.printlnDebug("end of this.service");
        BoilerPredictiveActivator.service = serviceRef;

        try {
            BoilerPredictiveActivator.persistenceClient = new PersistenceClient(BoilerPredictiveActivator.service, BoilerPredictiveActivator.bundleContext);
        } catch (PersistenceException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
            BoilerPredictiveActivator.println("ERROR: Could not get token for database. Engine not started.");
            BoilerPredictiveActivator.println("ERROR: Persistence sample is not running.");
            return;
        }
        BoilerPredictiveActivator.calculateFFT = new CalculateFFT(BoilerPredictiveActivator.persistenceClient);
        if (BoilerPredictiveActivator.calculateFFT.initialize(configProperties, rDir)) {
            BoilerPredictiveActivator.println("CalculateFFT initialized successfully");
            BoilerPredictiveActivator.engine = new Engine(BoilerPredictiveActivator.calculateFFT);
            BoilerPredictiveActivator.engine.start();
        }
    }

    /**
     * If this Persistence Service shuts down, then this function will be called.
     * Then engine will be stopped.
     *
     * @param service
     */
    public synchronized void unsetPersistenceService(IPersistenceService service) {
        BoilerPredictiveActivator.printlnDebug("---- PersistenceSample:BoilerPredictiveActivator.unsetPersistenceService");
        if (BoilerPredictiveActivator.service == service) {
            BoilerPredictiveActivator.service = null;
            if (BoilerPredictiveActivator.engine != null) {
                BoilerPredictiveActivator.engine.stopGracefully();
            }
        }
    }

    /**
     * If the Persistence Service changes (the underlying bundle swaps out the implementation)
     * then we could reconnect without change.  This is beyond the scope of this sample.
     */
    @Override
    public void serviceChanged(ServiceEvent arg0) {
        // TODO Auto-generated method stub
        BoilerPredictiveActivator.printlnDebug("---- PersistenceSample:BoilerPredictiveActivator.serviceChanged - no operation performed.");
    }

    private boolean extractFile(BundleContext context, String src_dir, File target_dir, String fileName,
            String permissions, Boolean overwrite) throws IOException {
        boolean rc = false;
        InputStream fileIStream = this.getClass().getClassLoader().getResourceAsStream(src_dir + fileName);

        if (fileIStream == null) {
            BoilerPredictiveActivator.println("Cannot open resource from bundle:" + src_dir + fileName);
            return rc;
        }

        if (!target_dir.exists() && !target_dir.mkdirs()) {
            throw new IOException("Boiler R Model cannot create directory:" + target_dir.getPath());
        }

        File outFile = new File(target_dir, fileName);
        if (outFile.exists() && !overwrite) {
            BoilerPredictiveActivator.println("Not overwriting:" + outFile.getPath());
            return true;
        }

        BoilerPredictiveActivator.printlnDebug("Extracting to: " + outFile.getPath());
        FileOutputStream fos = null;
        try {
            fos = new FileOutputStream(outFile);
            byte[] buf = new byte[2048];
            int r;
            while (-1 != (r = fileIStream.read(buf))) {
                fos.write(buf, 0, r);
            }
            fos.close();
            fos = null;

            if (fileIStream != null) {
                fileIStream.close();
                fileIStream = null;
            }
            rc = true;
        } catch (FileNotFoundException fnfe) {
            BoilerPredictiveActivator.println("extractFile file not found:" + fnfe.getMessage());
        } catch (IOException ioe) {
            BoilerPredictiveActivator.println("extractFile io error:" + ioe.getMessage());
        } finally {
            if (fileIStream != null) {
                fileIStream.close();
                fileIStream = null;
            }
            if (fos != null) {
                fos.close();
                fos = null;
            }
        }

        if (permissions != null && outFile.exists()) {
            try {
                if (OSArch == OS_ARCH.LINUX && permissions != null) {
                    // Now set the permissions based on what
                    // the user has requested
                    Set<PosixFilePermission> perms = PosixFilePermissions.fromString(permissions);
                    Files.setPosixFilePermissions(Paths.get(outFile.getAbsolutePath()), perms);
                }
            } catch (IOException e) {
                BoilerPredictiveActivator.println("Failed to set permissions on " + outFile + ": " + e);
            }
        }

        return rc;
    }

    private boolean extractDependencies(File target_dir, BundleContext context) throws Exception {
        if (!target_dir.exists() && !target_dir.mkdirs()) {
            throw new Exception("Boiler R Model cannot create directory:" + target_dir.getPath());
        }
        BoilerPredictiveActivator.printlnDebug("Extracting dependencies to:" + target_dir.getPath());

        // Permissions are read/write for the owner (root/Administrator). Allow write for upgrades.
        String permissions = "rwxrwxrwx";

        // Allow user to modify deployed value for an environment and do not
        // overwrite it on each start of the bundle
        Boolean overwrite = new Boolean(false);
        String src_dir = "/";
        extractFile(context, src_dir, target_dir, "config.properties", permissions, overwrite);

        // These should be overridden on each start of the bundle, as a new R model may be deployed
        overwrite = new Boolean(true);
        target_dir = new File(target_dir, "boiler-R");
        src_dir = "boiler-R/";
        extractFile(context, src_dir, target_dir, "boilerEfficiency_csv_no_output_file.R", permissions, overwrite);
        extractFile(context, src_dir, target_dir, "boilerModel.rda", permissions, overwrite);
        extractFile(context, src_dir, target_dir, "input.csv", permissions, overwrite);
        extractFile(context, src_dir, target_dir, "runBoilerR.cmd", permissions, overwrite);
        extractFile(context, src_dir, target_dir, "runBoilerR.sh", permissions, overwrite);
        extractFile(context, src_dir, target_dir, "runBoilerR.sh", permissions, overwrite);

        return true;
    }

    private void loadConfigProperties(File configProperties) {
        InputStream input = null;

        try {
            input = new FileInputStream(configProperties);

            Properties props = new Properties();
            props.load(input);
            LOG_LEVEL_STRING = props.getProperty("logLevel", "DEBUG");
            System.out.println("BOILER_R LOG_LEVEL_STRING set to[" + LOG_LEVEL_STRING + "]");
        } catch (IOException ex) {
            BoilerPredictiveActivator.println("loadConfigProperties exception:" + ex.getMessage());
        } finally {
            if (input != null) {
                try {
                    input.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    public enum OS_ARCH {
        LINUX, WINDOWS, ARM, NONE
    }
    
    /**
     * OSChecker - returns OS type information
     */
    public static final class OSChecker {
        private static String OS = null;

        public static String getName() {
            if (OS == null) {
                OS = System.getProperty("os.arch");
            }
            return OS;
        }
        
        public static OS_ARCH getOSArch() {
            String OS = System.getProperty("os.name").toLowerCase();
            if (OS.indexOf("win") >= 0) {
                return OS_ARCH.WINDOWS;
            } else if (getName().startsWith("arm")) {
                return OS_ARCH.ARM;
            } else if (OS.indexOf("nix") >= 0 || OS.indexOf("nux") >= 0 || OS.indexOf("aix") > 0 ){
                return OS_ARCH.LINUX;
            } else {
                System.out.println("Cannot detect OS/Arch");
                return OS_ARCH.NONE;
            }
        }
    }

    public BundleContext getContext() {
        return this.bundleContext;
    }

    public class BPCommands {
        BoilerPredictiveActivator activator;
        public BPCommands(BoilerPredictiveActivator activator) {
            this.activator = activator;
        }
        public void BP_bundle() {
            System.out.println("BP_bundle executing ...");
            System.out.println(
                "Bundle[" + this.activator.getContext().getBundle().getSymbolicName() + "] "
            );
        }
        public void BP_status() {
            System.out.println("BP_status executing ...");
            System.out.println(
                "Bundle[" + this.activator.getContext().getBundle().getSymbolicName() + "] "
            );
        }
        public void BP_logger(String level) {
            System.out.println("BP_logger current value:" + this.activator.LOG_LEVEL_STRING);
            this.activator.LOG_LEVEL_STRING = level;
            System.out.println("BP_logger new value:" + this.activator.LOG_LEVEL_STRING);
        }
    }
}
