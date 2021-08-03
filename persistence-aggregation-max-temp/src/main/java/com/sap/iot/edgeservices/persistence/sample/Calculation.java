/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
  * Copyright (c) 2018 SAP SE or an affiliate company. All rights reserved.
  * The sample is not intended for production use.  Provided "as is".
  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * **/
package com.sap.iot.edgeservices.persistence.sample;

import com.sap.iot.edgeservices.persistence.sample.db.PersistenceClient;

public abstract class Calculation extends Thread {
	
	protected State state = State.NOT_INITIALIZED;

	public enum State {
		NOT_INITIALIZED,
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
		initialize();
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
	
	protected abstract void initialize();

}
