/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
  * Copyright (c) 2020 SAP SE or an affiliate company. All rights reserved.
  * The sample is not intended for production use.  Provided "as is".
  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
package com.sap.iot.edgeservices.predictive.sample;

import com.sap.iot.edgeservices.predictive.sample.db.PersistenceClient;

public abstract class Calculation
implements Runnable {

	protected final PersistenceClient persistenceClient; // persistence client used by the bundle
	protected State state = State.NOT_INITIALIZED; // bundle state

	////////////////////
	// constructors
	////////////////////

	public Calculation(PersistenceClient persistenceClient) {
		this.persistenceClient = persistenceClient;
		initialize();
	}

	////////////////////
	// public abstract functions
	////////////////////

	public abstract void stopGracefully();

	////////////////////
	// protected abstract functions
	////////////////////

	protected abstract void initialize();

	public enum State {
		NOT_INITIALIZED,
		RUNNING,
		ERROR
	}

}
