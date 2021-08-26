/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
  * Copyright (c) 2018 SAP SE or an affiliate company. All rights reserved.
  * The sample is not intended for production use.  Provided "as is".
  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * **/

package com.sap.iot.edgeservices.persistence.sample;

import com.sap.iot.edgeservices.persistence.sample.custom.CalculateMaxTemperature;
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
 */
@Component
public class PersistenceSampleActivator implements BundleActivator, ServiceListener {
	
	////////////////////
	// class fields
	////////////////////
	
    private static IPersistenceService service;		// handle to the Persistence Service which this sample depends on
    private static BundleContext bundleContext;				// bundle context of this bundle
    
    private static Engine engine;								// custom class that executes logic on a timer
    private static CalculateMaxTemperature calculateMaxTemperature;		// custom logic executed by the engine
    private static PersistenceClient persistenceClient;		// helper class to access the Persistence Service
    
    public static String LOG_LEVEL_STRING = "INFO";

	////////////////////
	// public methods
	////////////////////
    
    /*
     * Helper function used by the entire application 
     * TODO: replace with log4j
     */
    public static void printlnDebug(String str ) {
    	if ( PersistenceSampleActivator.LOG_LEVEL_STRING == "DEBUG" ) {
    		System.out.println("PERS_SAMP: (D)" + str);
    	}
    }   
    
    /*
     * Helper function used by the entire application 
     * TODO: replace with log4j
     */
    public static void println(String str) {
  		System.out.println("PERS_SAMP: " + str);
    }    
    
    /*
     * this function is called by OSGi when the bundle loads and starts
     */
    public void start(BundleContext bundleContext) throws Exception {
        PersistenceSampleActivator.printlnDebug("---- PersistenceSampleActivator.start");      
        PersistenceSampleActivator.bundleContext = bundleContext;
    }

    /*
     * (non-Javadoc)
     * @see org.osgi.framework.BundleActivator#stop(org.osgi.framework.BundleContext)
     */
    public void stop(BundleContext context) throws Exception {
        PersistenceSampleActivator.printlnDebug("---- PersistenceSampleActivator.stop");   
        PersistenceSampleActivator.engine.stopGracefully();
        PersistenceSampleActivator.service = null;
        PersistenceSampleActivator.bundleContext = null;
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
        PersistenceSampleActivator.printlnDebug("---- PersistenceSampleActivator.setPersistenceService");
        PersistenceSampleActivator.printlnDebug("--- service = " + PersistenceSampleActivator.service);
        PersistenceSampleActivator.printlnDebug("--- new service = " + serviceRef );
        
        PersistenceSampleActivator.printlnDebug("---- context = " + PersistenceSampleActivator.bundleContext);      
        PersistenceSampleActivator.service = serviceRef;

        try {
        	PersistenceSampleActivator.persistenceClient = new PersistenceClient(PersistenceSampleActivator.service, PersistenceSampleActivator.bundleContext);
		} catch (PersistenceException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			PersistenceSampleActivator.println("ERROR: Could not get token for database. Engine not started.");
			PersistenceSampleActivator.println("ERROR: Persistence sample is not running.");
			return;
		}
        PersistenceSampleActivator.calculateMaxTemperature = new CalculateMaxTemperature(PersistenceSampleActivator.persistenceClient);
        PersistenceSampleActivator.engine = new Engine(PersistenceSampleActivator.calculateMaxTemperature);
        PersistenceSampleActivator.engine.start();
    }

    /**
     * If this Persistence Service shuts down, then this function will be called.  
     * Then engine will be stopped.
     * 
     * @param service
     */
    public synchronized void unsetPersistenceService(IPersistenceService service) {
        PersistenceSampleActivator.printlnDebug("---- PersistenceSample:PersistenceSampleActivator.unsetPersistenceService");
        if (PersistenceSampleActivator.service == service) {
        	PersistenceSampleActivator.service = null;
            PersistenceSampleActivator.engine.stopGracefully();
        }
    }

    /**
     * If the Persistence Service changes (the underlying bundle swaps out the implementation)
     * then we could reconnect without change.  This is beyond the scope of this sample.
     */
    @Override
    public void serviceChanged(ServiceEvent arg0) {
        // TODO Auto-generated method stub
        PersistenceSampleActivator.printlnDebug("---- PersistenceSample:PersistenceSampleActivator.serviceChanged - no operation performed.");
    }
    
}
