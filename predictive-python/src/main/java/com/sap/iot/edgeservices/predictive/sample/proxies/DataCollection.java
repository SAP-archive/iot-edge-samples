/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Copyright (c) 2020 SAP SE or an affiliate company. All rights reserved.
 * The sample is not intended for production use.  Provided "as is".
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
package com.sap.iot.edgeservices.predictive.sample.proxies;

import java.util.ArrayList;
import java.util.List;

public class DataCollection<T> {
	private List<MultidimensionalValue<T>> measures = new ArrayList<>(); // list of measures

	/**
	 * @param index
	 *            measure number
	 * @param key
	 *            property key
	 * @return value
	 */
	public T getMeasures(int index, String key) {
		if (measures == null || measures.size() < index) {
			return null;
		}
		return measures.get(index).getMeasure(key);
	}

	/**
	 * @param mapValues
	 *            put a new measurement into the list
	 */
	public void add(MultidimensionalValue<T> mapValues) {
		measures.add(mapValues);
	}

	/**
	 * getters and setters
	 */
	public List<MultidimensionalValue<T>> getMeasures() {
		return measures;
	}

	public void setMeasures(List<MultidimensionalValue<T>> measures) {
		this.measures = measures;
	}

}
