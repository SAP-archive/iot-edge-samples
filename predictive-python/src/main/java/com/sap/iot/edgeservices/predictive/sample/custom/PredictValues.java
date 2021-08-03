/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Copyright (c) 2020 SAP SE or an affiliate company. All rights reserved.
 * The sample is not intended for production use.  Provided "as is".
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
package com.sap.iot.edgeservices.predictive.sample.custom;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.iot.edgeservices.persistenceservice.model.PSStatementObject;
import com.sap.iot.edgeservices.persistenceservice.model.QueryInputList;
import com.sap.iot.edgeservices.predictive.sample.Calculation;
import com.sap.iot.edgeservices.predictive.sample.PredictiveModuleActivator;
import com.sap.iot.edgeservices.predictive.sample.db.PersistenceClient;
import com.sap.iot.edgeservices.predictive.sample.proxies.CustomConfiguration;
import com.sap.iot.edgeservices.predictive.sample.proxies.DataCollection;
import com.sap.iot.edgeservices.predictive.sample.proxies.MultidimensionalValue;
import com.sap.iot.edgeservices.predictive.sample.utilities.DataStreamer;

public class PredictValues
extends Calculation {
	private static final String PYTHON_CMD = "python";
	private static final String PYTHON_SCRIPT_PATH = "mypythonmodule.py";

	////////////////////
	// Static fields
	////////////////////
	private static final Logger LOGGER = LoggerFactory.getLogger(PredictValues.class); // logger
	private static final Boolean CLOUD_EDGE_SERVICES = true; // SET TO false for ON-PREMISE
	private static final ObjectMapper objectMapper = new ObjectMapper(); // Json mapper

	////////////////////
	// Class fields
	////////////////////
	private String lastConfigurationFingerprint; // fingerprint of last configuration
	private CustomConfiguration configuration; // parameters configuration
	private String sensorTypeAlternateId; // the sensorTypeAltnerateId that the engine will calculate on

	private QueryData queryData; // helper object to make persistence queries
	private ZMQAdapter zmq; // message bus
	private String mostRecentQueryTime; // last query timestamp

	////////////////////
	// constructors
	////////////////////

	public PredictValues(PersistenceClient persistenceClient) {
		super(persistenceClient);

		LOGGER.debug("PredictValues:ctor - called");
		// propagate teh parameter
		QueryData.setCloudEdgeServices(CLOUD_EDGE_SERVICES);

		// properties that control how the Calculation will be done
		if (CLOUD_EDGE_SERVICES) {
			// cloud edition
			sensorTypeAlternateId = "*"; // only for this sensorType
		} else {
			// on-premise edition
			sensorTypeAlternateId = "color"; // only for this Sensor Profile
		}

		mostRecentQueryTime = queryData.resetQueryTime();
	}

	////////////////////
	// public methods
	////////////////////

	@Override
	public void stopGracefully() {
		LOGGER.debug("Invoked service STOP");
		// close communication
		zmq.closeZmqContext();
	}

	/**
	 * automatically invoked each thread run
	 */
	@Override
	public void run() {
		LOGGER.debug("Invoked PredictValues thread");

		// ensure we have initialized and in a good state
		if (state != State.RUNNING) {
			LOGGER.error("NOT RUNNING: PredictValues.state = {}", state);
			return;
		}

		// determine if any configuration changes have been sent
		updateConfigurations();

		// get the data and create a primitive array
		Map<String, DataCollection<Float>> valuesByDevice = getSampleData();

		// for each device that sent in a value, send out the max
		valuesByDevice.forEach((device, values) -> {
			LOGGER.debug("======================== Calculating prediction");

			Float validPrediction = null;
			// evaluate each measure
			for (MultidimensionalValue<Float> rgbmap : values.getMeasures()) {
				String measurement = null;
				try {
					measurement = objectMapper.writeValueAsString(rgbmap);
					LOGGER.debug("json = {}", measurement);
				} catch (JsonProcessingException e) {
					LOGGER.error("Unable to parse json string due to {}", e.getMessage(), e);
				}
				// Send measurement
				zmq.send(measurement);
				String reply = zmq.receive();
				Map<String, ?> prediction = convertPrediction(reply);
				validPrediction = checkPrediction(prediction, validPrediction,
					configuration.getPredictionOutputFields());

				// send the results back into IOT Service engine as a different capability
				DataStreamer.streamResults(CLOUD_EDGE_SERVICES, configuration.getEdgePlatformRestEndpoint(), device,
					configuration.getPredictionSensorTypeAlternateId(),
					configuration.getPredictionCapabilityAlternateId(), configuration.getPredictionSensorAlternateId(),
					prediction);
			}

			// send the final result back into IOT Service engine as a different capability
			DataStreamer.streamResult(CLOUD_EDGE_SERVICES, configuration.getEdgePlatformRestEndpoint(), device,
				configuration.getPredictionSensorTypeAlternateId(),
				configuration.getPredictionIndexCapabilityAlternateId(), configuration.getPredictionSensorAlternateId(),
				validPrediction);
		});
	}

	/**
	 * @param reply
	 *            prediction from server
	 * @return converted prediction or null
	 */
	private Map<String, ?> convertPrediction(String reply) {
		Map<String, ?> prediction = null;
		TypeReference<Map<String, ?>> typeRef = new TypeReference<Map<String, ?>>() {
		};

		if (StringUtils.isEmpty(reply)) {
			LOGGER.error("No reply from the server");
		} else {
			try {
				prediction = objectMapper.readValue(reply, typeRef);
			} catch (IOException e) {
				LOGGER.error("Unable to parse json string due to {}", e.getMessage(), e);
				LOGGER.warn("The original response was:\n{}", reply);
			}
		}
		return prediction;
	}

	/**
	 * @param prediction
	 *            the predicted value
	 * @param validPrediction
	 *            valid prediction index
	 * @param outputFields
	 *            pmml model output fields
	 * @return the updated index
	 */
	private Float checkPrediction(Map<String, ?> prediction, Float validPrediction, List<String> outputFields) {
		Float actualPrediction = null;
		AtomicReference<Float> distance = new AtomicReference<>(0f);
		if (prediction != null) {
			// each output field contribute to the overall index
			outputFields.forEach(field -> {
				LOGGER.debug("Field: {}", field);
				// define an unacceptable value
				float unacceptableThreshold = 2 * outputFields.size() * configuration.getPlantColorOutOfRangeLimit();
				float val = unacceptableThreshold;
				try {
					val = Float.parseFloat(String.valueOf(prediction.get(field)));
					// check distance out of range
				} catch (Exception e) {
					LOGGER.warn("Unable to get predicted value (error: {})", e.getMessage(), e);
					// put an unacceptable value
					distance.updateAndGet(v -> v + unacceptableThreshold);
				}

				if (val > configuration.getPlantColorOutOfRangeLimit()) {
					// apply a malus for the aggregated index
					LOGGER.warn("value {} is out of range {}", val, configuration.getPlantColorOutOfRangeLimit());
					val *= configuration.getPlantScalingForOutOfRange();
					LOGGER.debug("value now is {}", val);
				}
				float finalVal = val;
				// increment the index
				distance.updateAndGet(v -> v + finalVal);
			});
			if (validPrediction == null) {
				// return the average
				actualPrediction = distance.get() / outputFields.size();
			}
			// was not in range
			else if ((distance.get() / outputFields.size()) > configuration.getPlantColorOutOfRangeLimit() ||
				validPrediction > configuration.getPlantColorOutOfRangeLimit()) {
				// return the worst value
				LOGGER.info("value {} is out of range {}, valid value was {}", distance.get() / outputFields.size(),
					configuration.getPlantColorOutOfRangeLimit(), validPrediction);
				actualPrediction = (distance.get() / outputFields.size()) > validPrediction
					? (distance.get() / outputFields.size()) : validPrediction;
			} else {
				// average of the average
				actualPrediction = ((distance.get() / outputFields.size()) + validPrediction) / 2;
			}
		}
		return actualPrediction;
	}

	////////////////////
	// private methods
	////////////////////

	// this is called by the super class, Calculation
	protected void initialize() {
		// init auxiliary classes
		queryData = new QueryData(persistenceClient);
		// first update of the configuration
		updateConfigurations();
		// create broker connection
		zmq = new ZMQAdapter(configuration.getBrokerConnectionAddressPort());
		boolean started = zmq.runPair(PYTHON_CMD, PYTHON_SCRIPT_PATH);

		LOGGER.debug("PredictValues:initialize - called, socket status {}", started);
		// if you want to store the result to a custom table, create a table to store them.
		this.state = State.RUNNING;
	}

	/**
	 * selects the sample data from the persistence database which is constantly being updated
	 *
	 * @return data collection per each device
	 */
	private Map<String, DataCollection<Float>> getSampleData() {
		PSStatementObject stmt;
		// build sql expression to get data
		String sql = queryData.getSqlForMeasureValues();
		QueryInputList args = queryData.getSqlArgsForMeasureValues(sensorTypeAlternateId,
			configuration.getCapabilityAlternateId(), mostRecentQueryTime);
		// update the timestamp for the next run
		mostRecentQueryTime = queryData.resetQueryTime();

		Map<String, DataCollection<Float>> valuesByDevice = new HashMap<>();
		try {
			// convert measure to a structured object
			stmt = persistenceClient.executeQuery(sql, args);
			valuesByDevice = queryData.getValuesAsFloatMapsByDevice(stmt, sensorTypeAlternateId,
				configuration.getCapabilityAlternateId());
		} catch (Exception e) {
			LOGGER.error(e.getMessage(), e);
		}
		return valuesByDevice;
	}

	// get the update of the configuration
	private void updateConfigurations() {
		String fingerprint = PredictiveModuleActivator.getLastSuccessfulFingerprint();
		if (configuration == null || (lastConfigurationFingerprint != null && fingerprint != null &&
			!fingerprint.contentEquals(lastConfigurationFingerprint))) {
			configuration = PredictiveModuleActivator.getConfiguration();
			lastConfigurationFingerprint = fingerprint;
			// update zmq if required
			if (zmq != null) {
				zmq.closeSocket();
				zmq = new ZMQAdapter(configuration.getBrokerConnectionAddressPort());
			}
		}
	}

}
