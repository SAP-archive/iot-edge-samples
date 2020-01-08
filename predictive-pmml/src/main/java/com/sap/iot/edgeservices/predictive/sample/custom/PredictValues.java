/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Copyright (c) 2020 SAP SE or an affiliate company. All rights reserved.
 * The sample is not intended for production use.  Provided "as is".
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
package com.sap.iot.edgeservices.predictive.sample.custom;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import org.apache.commons.lang.StringUtils;
import org.dmg.pmml.FieldName;
import org.dmg.pmml.PMML;
import org.jpmml.evaluator.Classification;
import org.jpmml.evaluator.Evaluator;
import org.jpmml.evaluator.EvaluatorUtil;
import org.jpmml.evaluator.FieldValue;
import org.jpmml.evaluator.InputField;
import org.jpmml.evaluator.OutputField;
import org.jpmml.evaluator.TargetField;
import org.jpmml.evaluator.ValueMap;
import org.jpmml.evaluator.nearest_neighbor.NearestNeighborModelEvaluator;
import org.jpmml.model.PMMLUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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

	////////////////////
	// Static fields
	////////////////////
	private static final Logger LOGGER = LoggerFactory.getLogger(PredictValues.class); // logger
	private static final Boolean CLOUD_EDGE_SERVICES = true; // SET TO false for ON-PREMISE

	////////////////////
	// Class fields
	////////////////////
	private String lastConfigurationFingerprint; // fingerprint of last configuration
	private CustomConfiguration configuration; // parameters configuration
	private String sensorTypeAlternateId; // the sensorTypeAltnerateId that the engine will calculate on

	private QueryData queryData; // helper object to make persistence queries
	private String mostRecentQueryTime; // last query timestamp
	private Evaluator evaluator; // pmml evaluator object
	private PMML pmml; // pmml object

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

	/**
	 * Load a PMML model from the file system.
	 *
	 * @param file
	 *            PMML model file
	 * @return PMML object
	 */
	private static PMML loadModel(final InputStream file) {
		PMML pmml = null;

		try (InputStream in = file) {
			pmml = PMMLUtil.unmarshal(in);

		} catch (Exception e) {
			LOGGER.error(e.toString(), e);
		}
		return pmml;
	}

	////////////////////
	// public methods
	////////////////////

	/**
	 * @param pmml
	 *            PMML object
	 * @return the object to evaluate over the PMML model
	 */
	private static Evaluator evaluatorModel(PMML pmml) {
		Evaluator evaluator = new NearestNeighborModelEvaluator(pmml);
		// Perforing the self-check
		evaluator.verify();
		// Printing input (x1, x2, .., xn) fields
		List<? extends InputField> inputFields = evaluator.getInputFields();
		LOGGER.debug("Input fields: {}", inputFields);

		// Printing primary result (y) field(s)
		List<? extends TargetField> targetFields = evaluator.getTargetFields();
		LOGGER.debug("Target field(s): {}", targetFields);

		// Printing secondary result (eg. probability(y), decision(y)) fields
		List<? extends OutputField> outputFields = evaluator.getOutputFields();
		LOGGER.debug("Output fields: {}", outputFields);

		return evaluator;
	}

	/**
	 * @param evaluator
	 *            the model evaluator
	 * @param inputRecord
	 *            the data (input)
	 * @return the predicted value
	 */
	private static Map<String, ?> evaluateModel(Evaluator evaluator, Map<String, ?> inputRecord) {
		// Get the list of required feature set model needs to predict.
		List<? extends InputField> inputFields = evaluator.getInputFields();
		List<? extends OutputField> outputFields = evaluator.getOutputFields();
		List<TargetField> target = evaluator.getTargetFields();

		if (inputRecord == null || target.isEmpty()) {
			return null;
		}

		Map<FieldName, FieldValue> arguments = new LinkedHashMap<>();

		// Mapping the record field-by-field from data source schema to PMML schema
		for (InputField inputField : inputFields) {
			FieldName inputName = inputField.getName();
			// Get the raw value
			Object rawValue = inputRecord.get(inputName.getValue());

			// Transforming an arbitrary user-supplied value to a known-good PMML value
			FieldValue inputValue = inputField.prepare(rawValue);

			arguments.put(inputName, inputValue);
		}
		Map<FieldName, ?> results = null;
		try {
			// Evaluating the model with known-good arguments
			results = evaluator.evaluate(arguments);
		} catch (Exception e) {
			LOGGER.error(e.getMessage(), e);
		}

		if (results == null) {
			LOGGER.warn("No result");
			return null;
		}
		// Decoupling results from the JPMML-Evaluator runtime environment
		Map<String, ?> resultRecord = EvaluatorUtil.decodeAll(results);

		FieldName targetField = target.get(0).getFieldName();
		Classification classified = (Classification) results.get(targetField);
		ValueMap distances = classified.getValues();

		// put the distance instead of the indexes of the neighbors
		Map<String, Object> predictionAndDistance = new HashMap<>(resultRecord);
		for (OutputField outputField : outputFields) {
			FieldName outputName = outputField.getName();
			// get the raw value
			Object rawValue = resultRecord.get(outputName.getValue());
			String i;
			try {
				i = (String) rawValue;
				// replace with the distance
				predictionAndDistance.put(outputName.getValue(), distances.get(i));
			} catch (Exception e) {
				LOGGER.error(e.getMessage(), e);
			}
		}
		return predictionAndDistance;
	}

	@Override
	public void stopGracefully() {
		LOGGER.debug("Invoked service STOP");
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
				Map<String, ?> prediction = evaluateModel(evaluator, rgbmap.getMeasures());
				// build an overall index
				validPrediction = checkPrediction(prediction, validPrediction, evaluator.getOutputFields());

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
	 * @param prediction
	 *            the predicted value
	 * @param validPrediction
	 *            valid prediction index
	 * @param outputFields
	 *            pmml model output fields
	 * @return the updated index
	 */
	private Float checkPrediction(Map<String, ?> prediction, Float validPrediction, List<OutputField> outputFields) {
		AtomicReference<Float> distance = new AtomicReference<>(0f);
		// each output field contribute to the overall index
		outputFields.forEach(field -> {
			// define an unacceptable value
			float unacceptableThreshold = 2 * outputFields.size() * configuration.getPlantColorOutOfRangeLimit();
			float val = unacceptableThreshold;
			try {
				val = Float.parseFloat(String.valueOf(prediction.get(field.getName().getValue())));
				// check distance out of range
			} catch (Exception e) {
				LOGGER.debug("Unable to get predicted value (error: {})", e.getMessage(), e);
				// put an unacceptable value
				distance.updateAndGet(v -> v + unacceptableThreshold);
			}

			if (val > configuration.getPlantColorOutOfRangeLimit()) {
				// apply a malus for the aggregated index
				val *= configuration.getPlantScalingForOutOfRange();
			}
			float finalVal = val;
			// increment the index
			distance.updateAndGet(v -> v + finalVal);
		});
		if (validPrediction == null) {
			// return the average
			return distance.get() / outputFields.size();
		}
		// was not in range
		if ((distance.get() / outputFields.size()) > configuration.getPlantColorOutOfRangeLimit() ||
			validPrediction > configuration.getPlantColorOutOfRangeLimit()) {
			// return the worst value
			return (distance.get() / outputFields.size()) > validPrediction ? (distance.get() / outputFields.size())
				: validPrediction;
		}
		// average of the average
		return ((distance.get() / outputFields.size()) + validPrediction) / 2;
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
		// Load the model
		InputStream defaultInputStream = getClass().getClassLoader().getResourceAsStream("knn-color-model.pmml");
		PMML pmmlUpdate = null;
		// read pmml from configuration, if possible
		String pmmlString = configuration.getPmmlFileContentAsString();
		if (!StringUtils.isEmpty(pmmlString)) {
			LOGGER.info("Converting custom PMML configuration");
			try {
				byte[] stringPmml = configuration.getPmmlFileContentAsString().getBytes(Charset.defaultCharset());
				pmmlUpdate = loadModel(new ByteArrayInputStream(stringPmml));
			} catch (Exception e) {
				LOGGER.error(e.getMessage(), e);
			}
		}
		if (pmmlUpdate == null) {
			LOGGER.info("Fallback to the default PMML configuration");
			try {
				this.pmml = loadModel(defaultInputStream);
			} catch (Exception e) {
				LOGGER.error(e.getMessage(), e);
			}
		} else {
			this.pmml = pmmlUpdate;
		}
		// load evaluator
		this.evaluator = evaluatorModel(pmml);
		LOGGER.debug("PredictValues:initialize - called");
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
		}
	}

}
