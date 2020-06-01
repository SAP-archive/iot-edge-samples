/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Copyright (c) 2020 SAP SE or an affiliate company. All rights reserved.
 * The sample is not intended for production use.  Provided "as is".
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
package com.sap.iot.edgeservices.predictive.sample.proxies;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang.StringUtils;

public class MultidimensionalValue<T> {
	private Map<String, T> measures = new HashMap<>(); // map of property value

	/**
	 * @param key
	 *            property key
	 * @return the value
	 */
	public T getMeasure(String key) {
		if (StringUtils.isEmpty(key)) {
			return null;
		}
		return measures.get(key);
	}

	/**
	 * put a value into the list
	 * 
	 * @param prop
	 *            property
	 * @param f
	 *            value
	 */
	public void put(String prop, T f) {
		measures.put(prop, f);
	}

	// getters and setters
	public Map<String, T> getMeasures() {
		return measures;
	}

	public void setMeasures(Map<String, T> measures) {
		this.measures = measures;
	}

}
