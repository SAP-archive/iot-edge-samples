package com.sap.iot.edgeservices.persistence.sample;

import com.sap.iot.edgeservices.persistence.sample.db.PersistenceClient;

import java.io.File;

public abstract class Calculation extends Thread {
    protected State state = State.NOT_INITIALIZED;

    public enum State {
        NOT_INITIALIZED,
        BUSY,
        RUNNING,
        ERROR
    }

    ////////////////////
    // class fields
    ////////////////////

    protected PersistenceClient persistenceClient;

    ////////////////////
    // constructors
    ////////////////////

    public Calculation( PersistenceClient persistenceClient ) {
        this.persistenceClient = persistenceClient;
    }	

    ////////////////////
    // public abstract functions
    ////////////////////

    public abstract int getPollingFreqencyMS();

    public abstract void run();

    public abstract String getLogLevel();

    ////////////////////
    // protected abstract functions
    ////////////////////

    public abstract boolean initialize(File configFile, File rDir);
}
