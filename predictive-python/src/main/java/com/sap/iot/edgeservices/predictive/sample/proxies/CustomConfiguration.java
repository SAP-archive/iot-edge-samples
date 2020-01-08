/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Copyright (c) 2020 SAP SE or an affiliate company. All rights reserved.
 * The sample is not intended for production use.  Provided "as is".
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
package com.sap.iot.edgeservices.predictive.sample.proxies;

import java.util.List;

import org.apache.commons.lang.StringUtils;

public class CustomConfiguration {
	private String predictionSensorTypeAlternateId; // target sensortype alternate id
	private String capabilityAlternateId; // received capability alternate id
	private String predictionSensorAlternateId; // target sensortype alternate id
	private String predictionCapabilityAlternateId; // target capability alternate id
	private String predictionIndexCapabilityAlternateId; // target index capability alternate id
	private String edgePlatformRestEndpoint; // endpoint of the edge platform rest to ingest data
	private Float plantColorOutOfRangeLimit; // maximum allowed distance, after you will have an outlayer
	private Float plantScalingForOutOfRange; // weight for the outlayers used in the computation of the indexes
	private Long analysisFrequency; // frequency to invoke the persistence client to fetch measures
	private List<String> predictionOutputFields; // pmml model file converted to an escaped string
	private String brokerConnectionAddressPort; // pmml model file converted to an escaped string
	private String pythonRuntimeExecutionCommand; // pmml model file converted to an escaped string
	private String pythonScriptPath; // pmml model file converted to an escaped string

	// default constructor
	public CustomConfiguration() {
		super();
	}

	/**
	 * Populate the missing objects
	 * 
	 * @param defaultConfiguration
	 *            default configuration object (no null inside)
	 */
	public void mergeMissingValues(CustomConfiguration defaultConfiguration) {
		if (StringUtils.isEmpty(predictionSensorTypeAlternateId)) {
			predictionSensorTypeAlternateId = defaultConfiguration.getPredictionSensorTypeAlternateId();
		}
		if (StringUtils.isEmpty(capabilityAlternateId)) {
			capabilityAlternateId = defaultConfiguration.getCapabilityAlternateId();
		}
		if (StringUtils.isEmpty(predictionSensorAlternateId)) {
			predictionSensorAlternateId = defaultConfiguration.getPredictionSensorAlternateId();
		}
		if (StringUtils.isEmpty(predictionCapabilityAlternateId)) {
			predictionCapabilityAlternateId = defaultConfiguration.getPredictionCapabilityAlternateId();
		}
		if (StringUtils.isEmpty(predictionIndexCapabilityAlternateId)) {
			predictionIndexCapabilityAlternateId = defaultConfiguration.getPredictionIndexCapabilityAlternateId();
		}
		if (StringUtils.isEmpty(edgePlatformRestEndpoint)) {
			edgePlatformRestEndpoint = defaultConfiguration.getEdgePlatformRestEndpoint();
		}
		if (plantColorOutOfRangeLimit == null) {
			plantColorOutOfRangeLimit = defaultConfiguration.getPlantColorOutOfRangeLimit();
		}
		if (plantScalingForOutOfRange == null) {
			plantScalingForOutOfRange = defaultConfiguration.getPlantScalingForOutOfRange();
		}
		if (analysisFrequency == null) {
			analysisFrequency = defaultConfiguration.getAnalysisFrequency();
		}
		if (predictionOutputFields == null || predictionOutputFields.isEmpty()) {
			predictionOutputFields = defaultConfiguration.getPredictionOutputFields();
		}
		if (StringUtils.isEmpty(brokerConnectionAddressPort)) {
			brokerConnectionAddressPort = defaultConfiguration.getBrokerConnectionAddressPort();
		}
		if (StringUtils.isEmpty(pythonRuntimeExecutionCommand)) {
			pythonRuntimeExecutionCommand = defaultConfiguration.getPythonRuntimeExecutionCommand();
		}
		if (StringUtils.isEmpty(pythonScriptPath)) {
			pythonScriptPath = defaultConfiguration.getPythonScriptPath();
		}
	}

	/**
	 * getters and setters
	 */

	public Long getAnalysisFrequency() {
		return analysisFrequency;
	}

	public String getPredictionSensorTypeAlternateId() {
		return predictionSensorTypeAlternateId;
	}

	public String getCapabilityAlternateId() {
		return capabilityAlternateId;
	}

	public String getPredictionSensorAlternateId() {
		return predictionSensorAlternateId;
	}

	public String getPredictionCapabilityAlternateId() {
		return predictionCapabilityAlternateId;
	}

	public String getPredictionIndexCapabilityAlternateId() {
		return predictionIndexCapabilityAlternateId;
	}

	public String getEdgePlatformRestEndpoint() {
		return edgePlatformRestEndpoint;
	}

	public Float getPlantColorOutOfRangeLimit() {
		return plantColorOutOfRangeLimit;
	}

	public Float getPlantScalingForOutOfRange() {
		return plantScalingForOutOfRange;
	}

	public List<String> getPredictionOutputFields() {
		return predictionOutputFields;
	}

	public String getBrokerConnectionAddressPort() {
		return brokerConnectionAddressPort;
	}

	public String getPythonRuntimeExecutionCommand() {
		return pythonRuntimeExecutionCommand;
	}

	public String getPythonScriptPath() {
		return pythonScriptPath;
	}
}
