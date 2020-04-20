/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Copyright (c) 2020 SAP SE or an affiliate company. All rights reserved.
 * The sample is not intended for production use.  Provided "as is".
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
package com.sap.iot.edgeservices.predictive.sample.custom;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sap.iot.edgeservices.persistenceservice.enums.QueryInputType;
import com.sap.iot.edgeservices.persistenceservice.model.PSStatementObject;
import com.sap.iot.edgeservices.persistenceservice.model.QueryInputItem;
import com.sap.iot.edgeservices.persistenceservice.model.QueryInputList;
import com.sap.iot.edgeservices.predictive.sample.PersistenceException;
import com.sap.iot.edgeservices.predictive.sample.db.PersistenceClient;
import com.sap.iot.edgeservices.predictive.sample.proxies.DataCollection;
import com.sap.iot.edgeservices.predictive.sample.proxies.MultidimensionalValue;

public class QueryData {
	private static final Logger LOGGER = LoggerFactory.getLogger(QueryData.class); // logger
	private static Boolean cloudEdgeServices; // flag on premise edition
	private final PersistenceClient persistenceClient; // current persistence reference

	// constructor
	QueryData(PersistenceClient persistenceClient) {
		this.persistenceClient = persistenceClient;
	}

	// setter
	static void setCloudEdgeServices(Boolean cloudEdgeServices) {
		QueryData.cloudEdgeServices = cloudEdgeServices;
	}

	// reset the query time for the next query
	String resetQueryTime() {
		String mostRecentQueryTime = null;
		try {
			mostRecentQueryTime = persistenceClient
				.getFirstRowFirstColumn(persistenceClient.executeQuery("SELECT NOW()"));
			LOGGER.debug("new date is: {}", mostRecentQueryTime);
		} catch (PersistenceException e1) {
			LOGGER.error("Unable to update the time: {}", e1.getMessage(), e1);
		}
		return mostRecentQueryTime;
	}

	/**
	 * @return the sql expression
	 */
	private String getSqlForMetadata() {
		// NOTE: only top 1000 records are returned. If more data is expected, then
		// query should be changed to use database aggregation instead of Java
		String sql = "SELECT top 1000 m.PROP_ID, m.PROP_SEQ, m.TYPE_ID FROM EFPS.MEASURE_TYPE_PROPERTY m " +
			"    WHERE m.OBJECT_ID = ?";
		// Add PROFILE_ID only in case of OP Edition
		if (!cloudEdgeServices) {
			sql += "      AND m.PROFILE_ID = ?";
		}
		sql += " ORDER BY m.PROP_SEQ ASC";

		LOGGER.debug("getSqlForMetadata: ============");
		LOGGER.debug(sql);

		return sql;
	}

	/**
	 * @param profileId
	 *            use a particular profile for the on-premise
	 * @param objectId
	 *            capabilityAlternateId
	 * @return the parameters for the query
	 */
	private QueryInputList getSqlArgsForMetadata(String profileId, String objectId) {
		// create list of parameters
		List<QueryInputItem> items = new ArrayList<>();
		items.add(new QueryInputItem(objectId, QueryInputType.String));
		if (!cloudEdgeServices) {
			items.add(new QueryInputItem(profileId, QueryInputType.String));
		}
		return new QueryInputList(items);
	}

	/**
	 * @return the sql expression
	 */
	String getSqlForMeasureValues() {
		// NOTE: only top 1000 records are returned. If more data is expected, then
		// query should be changed to use database aggregation instead of Java
		String sql = "SELECT top 1000 m.DEVICE_ADDRESS, CAST(m.MEASURE_VALUE AS VARCHAR(32)) MEASURE_VALUE,  " +
			"          m.DATE_RECEIVED FROM EFPS.MEASURE m WHERE m.OBJECT_ID = ? AND m.DATE_RECEIVED > ?";
		// Add PROFILE_ID only in case of OP Edition
		if (!cloudEdgeServices) {
			sql += "      AND m.PROFILE_ID = ?";
		}
		sql += " ORDER BY m.DATE_RECEIVED DESC";

		LOGGER.debug("getSqlForMeasureValues: ============");
		LOGGER.debug(sql);

		return sql;
	}

	/**
	 * @param profileId
	 *            use a particular profile for the on-premise
	 * @param objectId
	 *            capabilityAlternateId
	 * @param sinceDate
	 *            date parameter for the query
	 * @return the parameters for the query
	 */
	QueryInputList getSqlArgsForMeasureValues(String profileId, String objectId, String sinceDate) {
		// create list of parameters
		List<QueryInputItem> items = new ArrayList<>();
		items.add(new QueryInputItem(objectId, QueryInputType.String));
		items.add(new QueryInputItem(sinceDate, QueryInputType.String));
		if (!cloudEdgeServices) {
			items.add(new QueryInputItem(profileId, QueryInputType.String));
		}
		return new QueryInputList(items);
	}

	/**
	 * @param statementObject
	 *            the resultset
	 * @param sensorTypeAlternateId
	 *            the sensor type alternate id
	 * @param capabilityAlternateId
	 *            the capability type alternate id
	 * @return a collection with all the measurements around all the devices
	 */
	Map<String, DataCollection<Float>> getValuesAsFloatMapsByDevice(PSStatementObject statementObject,
		String sensorTypeAlternateId, String capabilityAlternateId) {
		List<String> properties = this.getMetadata(sensorTypeAlternateId, capabilityAlternateId);
		Map<String, DataCollection<Float>> valuesByDevice = new HashMap<>();

		LOGGER.debug("getValuesAsDoublesByDevice start-------------");
		if (!statementObject.hasResultList()) {
			// no values
			LOGGER.debug("ResultSet is empty");
			return valuesByDevice;
		}
		// for each result convert to data
		statementObject.getResultList().forEach(row -> {
			// result zero is the device
			String device = row.get(0).getValue().toString();
			LOGGER.debug("device = {}", device);
			DataCollection<Float> valueMap = valuesByDevice.get(device);
			// create aan entry in the map for each device
			if (valueMap == null) {
				valueMap = new DataCollection<>();
				valuesByDevice.put(device, valueMap);
			}
			// result one is the value
			String values = row.get(1).getValue().toString();
			LOGGER.debug("value = {}", values);
			LOGGER.debug("{}:{}", device, values);

			// result two is the timestamp
			String date = row.get(2).getValue().toString();
			LOGGER.debug("date = {}", date);

			MultidimensionalValue<Float> mapValues = extractFloatProperties(values, properties);
			// add al the properties in the measurement collection object
			valueMap.add(mapValues);
			LOGGER.debug("value added");
		});

		LOGGER.debug("getValuesAsDoublesByDevice end---------------");
		return valuesByDevice;
	}

	/**
	 * @param values
	 *            value to be parsed
	 * @param properties
	 *            properties names
	 * @return the collection of properties / values
	 */
	private MultidimensionalValue<Float> extractFloatProperties(String values, List<String> properties) {
		MultidimensionalValue<Float> mapValues = new MultidimensionalValue<>();
		// Split into properties
		if (StringUtils.isEmpty(values)) {
			LOGGER.debug("Empty values");
			return mapValues;
		}
		String[] valuesArray = values.split(" ");
		for (int i = 0; i < valuesArray.length; i++) {
			String prop = properties.get(i);
			// extract as float
			try {
				Float f = Float.valueOf(valuesArray[i]);
				mapValues.put(prop, f);
			} catch (NumberFormatException nfe) {
				LOGGER.debug("Unable to parse the value: {} due to {}", values, nfe.getMessage(), nfe);
			}
		}
		return mapValues;
	}

	/**
	 * @param statementObject
	 *            the resultset
	 * @return a list of string that are the metadata
	 */
	private List<String> getMetadataFromResultset(PSStatementObject statementObject) {
		List<String> metadata = new ArrayList<>();
		LOGGER.debug("getMetadataFromResultset start-------------");
		if (statementObject.hasResultList()) {
			statementObject.getResultList().forEach(row -> {
				// value zero contains metadata
				String type = row.get(0).getValue().toString();
				metadata.add(type);
				LOGGER.debug("type = {}", type);
			});
		} else {
			LOGGER.debug(" ResultSet is empty");
		}

		LOGGER.debug("getMetadataFromResultset end---------------");
		return metadata;
	}

	/**
	 * @param sensorTypeAlternateId
	 *            the sensor type alternate id
	 * @param capabilityAlternateId
	 *            the capability type alternate id
	 * @return a list of string that are the metadata
	 */
	private List<String> getMetadata(String sensorTypeAlternateId, String capabilityAlternateId) {
		PSStatementObject stmt;
		// build sql to get metadata
		String sql = getSqlForMetadata();
		QueryInputList args = getSqlArgsForMetadata(sensorTypeAlternateId, capabilityAlternateId);

		List<String> types = new ArrayList<>();
		try {
			stmt = persistenceClient.executeQuery(sql, args);
			// convert raw data
			types = getMetadataFromResultset(stmt);
		} catch (Exception e) {
			LOGGER.error("Unable to get metadata due to: {}", e.getMessage(), e);
		}
		return types;
	}
}
