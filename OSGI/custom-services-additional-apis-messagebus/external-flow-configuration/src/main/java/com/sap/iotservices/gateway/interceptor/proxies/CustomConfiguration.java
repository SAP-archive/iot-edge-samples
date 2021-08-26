/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Copyright (c) 2020 SAP SE or an affiliate company. All rights reserved.
 * The sample is not intended for production use.  Provided "as is".
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
package com.sap.iotservices.gateway.interceptor.proxies;

import java.util.List;

public class CustomConfiguration {

	private Float variance;
	private Float pressureScale;
	private Boolean ingestionEnabled;
	private Boolean filterMeasurements;
	private Boolean filterCalculation;
	private List<MessageFilter> filteredObjects;

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
		if (filteredObjects == null || filteredObjects.isEmpty()) {
			filteredObjects = defaultConfiguration.getFilteredObjects();
		}
		if (filterMeasurements == null) {
			filterMeasurements = defaultConfiguration.getFilterMeasurements();
		}
		if (filterCalculation == null) {
			filterCalculation = defaultConfiguration.getFilterCalculation();
		}
		if (variance == null) {
			variance = defaultConfiguration.getVariance();
		}
		if (pressureScale == null) {
			pressureScale = defaultConfiguration.getPressureScale();
		}
		if (ingestionEnabled == null) {
			ingestionEnabled = defaultConfiguration.getIngestionEnabled();
		}
	}

	/**
	 * getters and setters
	 */

	public Boolean getFilterMeasurements() {
		return filterMeasurements;
	}

	public Boolean getFilterCalculation() {
		return filterCalculation;
	}

	public List<MessageFilter> getFilteredObjects() {
		return filteredObjects;
	}

	public Float getVariance() {
		return variance;
	}

	public Float getPressureScale() {
		return pressureScale;
	}

	public Boolean getIngestionEnabled() {
		return ingestionEnabled;
	}
}
