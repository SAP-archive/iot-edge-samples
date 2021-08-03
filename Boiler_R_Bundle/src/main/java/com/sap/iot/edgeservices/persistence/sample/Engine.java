package com.sap.iot.edgeservices.persistence.sample;

/**
 * The Engine will continuously run the calculation 
 * @author I826651
 *
 */
public class Engine extends Thread {
    ////////////////////
    // class fields
    ////////////////////

    private Calculation calculation;	// the parent interface to the calculation class
    private boolean bStop = false;	// flag that determines if the engine should continue

    ////////////////////
    // Constructors
    ////////////////////

    /**
     * Ctor for the engine.  
     * @param calculation
     */
    public Engine( Calculation calculation ) {
        BoilerPredictiveActivator.printlnDebug("Engine:ctor - called");
        this.calculation = calculation;
        initialize();
    }

    ////////////////////
    // Public methods
    ////////////////////

    public void run() {
        BoilerPredictiveActivator.printlnDebug("Engine:run - called");
        try {
            while ( !bStop ) {
                calculation.run();
                BoilerPredictiveActivator.LOG_LEVEL_STRING = calculation.getLogLevel();
                BoilerPredictiveActivator.printlnDebug("Engine:sleeping for:" + calculation.getPollingFreqencyMS());
                Thread.sleep(calculation.getPollingFreqencyMS());
            }
        } catch (Exception e) {
            BoilerPredictiveActivator.println("ERROR: Engine: Problem executing the calculation: ");
            e.printStackTrace();
        }		
    }

    public void stopGracefully() {
        BoilerPredictiveActivator.println("Engine:stopGracefully - called");
        bStop = true;
    }

    ////////////////////
    // private methods
    ////////////////////

    private void initialize() {
        BoilerPredictiveActivator.printlnDebug("Engine:initialize - called");

        // the calculation class will create any tables it needs
        // here is for anything the engine needs (profiling etc)
    }
}
