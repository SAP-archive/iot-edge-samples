/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Copyright (c) 2020 SAP SE or an affiliate company. All rights reserved.
 * The sample is not intended for production use.  Provided "as is".
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
package com.sap.iot.edgeservices.predictive.sample;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The Engine will continuously run the calculation
 */
public class Engine
extends Thread {

	private static final Logger LOGGER = LoggerFactory.getLogger(Engine.class); // logger

	////////////////////
	// class fields
	////////////////////

	private final Calculation calculation; // the parent interface to the calculation class
	private final ScheduledExecutorService threadPool = Executors.newScheduledThreadPool(1); // thread scheduler for the
	// calculation
	private ScheduledFuture<?> thread; // current calculation
	private long calculationFrequencyMS; // scheduler frequency

	////////////////////
	// Constructors
	////////////////////

	/**
	 * Ctor for the engine.
	 *
	 * @param calculation
	 *            calculation object
	 * @param calculationFrequencyMS
	 *            thread frequency
	 */
	Engine(Calculation calculation, long calculationFrequencyMS) {
		LOGGER.debug("ctor - called");
		this.calculation = calculation;
		this.calculationFrequencyMS = calculationFrequencyMS;
		initialize();
	}

	////////////////////
	// Public methods
	////////////////////

	@Override
	public void run() {
		LOGGER.info("run - called");
		try {
			thread = threadPool.scheduleAtFixedRate(calculation, 0, calculationFrequencyMS, TimeUnit.MILLISECONDS);
		} catch (Exception e) {
			LOGGER.error("Problem executing the calculation: {}", e.getMessage(), e);
		}

	}

	/**
	 * stop the service
	 */
	void stopGracefully() {
		LOGGER.info("stopGracefully - called");
		calculation.stopGracefully();
		thread.cancel(true);
	}

	////////////////////
	// private methods
	////////////////////

	private void initialize() {
		LOGGER.debug("initialize - called");

		// the calculation class will create any tables it needs
		// here is for anything the engine needs (profiling etc)
	}

}
