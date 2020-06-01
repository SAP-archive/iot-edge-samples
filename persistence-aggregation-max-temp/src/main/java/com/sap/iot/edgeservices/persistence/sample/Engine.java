/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
  * Copyright (c) 2018 SAP SE or an affiliate company. All rights reserved.
  * The sample is not intended for production use.  Provided "as is".
  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * **/
package com.sap.iot.edgeservices.persistence.sample;

/**
 * The Engine will continuously run the calculation 
 */
public class Engine extends Thread {
	
	////////////////////
	// class fields
	////////////////////
	
	private Calculation calculation;						// the parent interface to the calculation class
	private boolean bStop = false;							// flag that determines if the engine should continue
	
	////////////////////
	// Constructors
	////////////////////
	
	/**
	 * Ctor for the engine.  
	 * @param calculation
	 */
	public Engine( Calculation calculation ) {
		PersistenceSampleActivator.printlnDebug("Engine:ctor - called");
		this.calculation = calculation;
		initialize();
	}
	
	////////////////////
	// Public methods
	////////////////////
	
	public void run() {
		PersistenceSampleActivator.printlnDebug("Engine:run - called");
        try {

            while ( !bStop ) {
                calculation.run();
                
                // TODO: the calculation instance should periodically check for new configuration data, so it
                //       should hold the log level as well as the polling frequency
                PersistenceSampleActivator.LOG_LEVEL_STRING = calculation.getLogLevel();
                Thread.sleep(calculation.getPollingFreqencyMS());
            }

        } catch (Exception e) {
            PersistenceSampleActivator.println("ERROR: Engine: Problem executing the calculation: ");
            e.printStackTrace();
        }		
		
	}
	
	
	public void stopGracefully() {
		PersistenceSampleActivator.println("Engine:stopGracefully - called");
		bStop = true;
	}
	
	////////////////////
	// private methods
	////////////////////
	
	private void initialize() {
		PersistenceSampleActivator.printlnDebug("Engine:initialize - called");

		// the calculation class will create any tables it needs
		// here is for anything the engine needs (profiling etc)
	}

}
