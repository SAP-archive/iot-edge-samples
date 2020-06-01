/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Copyright (c) 2020 SAP SE or an affiliate company. All rights reserved.
 * The sample is not intended for production use.  Provided "as is".
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
package com.sap.iot.edgeservices.predictive.sample.db;

import java.util.List;

import org.osgi.framework.BundleContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sap.iot.edgeservices.persistenceservice.model.PSDataObject;
import com.sap.iot.edgeservices.persistenceservice.model.PSStatementObject;
import com.sap.iot.edgeservices.persistenceservice.model.QueryInputList;
import com.sap.iot.edgeservices.persistenceservice.service.IPersistenceService;
import com.sap.iot.edgeservices.predictive.sample.PersistenceException;

/**
 * This is a helper class that allows the Calculation classes to connect to the database.
 *
 */
public class PersistenceClient {

	private static final Logger LOGGER = LoggerFactory.getLogger(PersistenceClient.class); // logger
	////////////////////
	// fields
	////////////////////

	private static final String AUTH_CREDENTIALS = "G3vpZHTbKbYH^8}"; // an example password - must be securely stored
																		// to
	// authenticate
	private final IPersistenceService persistenceService;
	private final BundleContext bundleContext;
	private final String token;

	////////////////////
	// Constructors
	////////////////////

	public PersistenceClient(IPersistenceService persistenceService, BundleContext bundleContext)
	throws PersistenceException {
		this.persistenceService = persistenceService;
		this.bundleContext = bundleContext;
		// we attempt the token access here as if this fails, then the engine should not run
		this.token = this.getPersistenceAccessToken();
	}

	////////////////////
	// public methods
	////////////////////

	/**
	 * This function will get the token from the persistence persistenceService
	 *
	 * @return token
	 * @throws PersistenceException
	 *             if the credentials are invalid, returns type:
	 *             PersistenceException.CODE_AUTHENTICATION_INVALID_CREDENTIALS
	 */
	private String getPersistenceAccessToken()
	throws PersistenceException {
		if (this.token == null) {

			String newToken;
			LOGGER.debug("(HIDE IN PRODUCTION) bundleCanonicalName = {}", getPersistenceUsername());
			LOGGER.debug("(HIDE IN PRODUCTION) password = {}", AUTH_CREDENTIALS);

			newToken = persistenceService.RegisterBundleForAccess(getPersistenceUsername(),
				AUTH_CREDENTIALS.toCharArray());
			if (newToken == null) {
				throw new PersistenceException(PersistenceException.CODE_AUTHENTICATION_INVALID_CREDENTIALS);
			}
			return newToken;
		} else {
			return this.token;
		}
	}

	/**
	 * Executes DML against the persistence persistenceService DML is data modeling language, execute queries, updates,
	 * delete of data
	 *
	 * @param sql
	 *            the query/update/delete to execute
	 * @param parameters
	 *            the parameters for the query
	 * @return a statement Object of the result set or rows changed.
	 */
	public PSStatementObject executeQuery(String sql, QueryInputList parameters) {
		return persistenceService.executeSQL(token, sql, parameters);
	}

	/**
	 * Executes DML against the persistence persistenceService DML is data modeling language, execute queries, updates,
	 * delete of data. No variable parameters are allowed.
	 *
	 * @param sql
	 *            the query/update/delete to execute
	 * @return a statement Object of the result set or rows changed.
	 */
	public PSStatementObject executeQuery(String sql) {
		return persistenceService.ExecuteSQL(token, sql);
	}

	/**
	 * Primarily for queries that will return just a single value, this function will extract that value
	 *
	 * @param statementObject
	 *            a PSStatementObject with a result set
	 * @return the string value of the first column of the first row of the result set
	 * @throws PersistenceException
	 *             if there is no result set then this will throw PersistenceException.CODE_SINGLETON_NOT_FOUND
	 */
	public String getFirstRowFirstColumn(PSStatementObject statementObject)
	throws PersistenceException {
		return getValue(statementObject, 0, 0);
	}

	/**
	 * Return a specific column and row value
	 *
	 * @param statementObject
	 *            a PSStatementObject with a result set
	 * @param row
	 *            0-based index
	 * @param column
	 *            0-based index
	 * @return the string value of the column and row of the result set
	 * @throws PersistenceException
	 *             if there is no result set then this will throw PersistenceException.CODE_SINGLETON_NOT_FOUND
	 */
	private String getValue(PSStatementObject statementObject, int row, int column)
	throws PersistenceException {
		if (statementObject.hasResultList() && !statementObject.getResultList().isEmpty()) {
			List<List<PSDataObject>> rows = statementObject.getResultList();
			List<PSDataObject> columns = rows.get(row);
			if (!columns.isEmpty()) {
				return columns.get(column).getValue().toString();
			}
		}
		throw new PersistenceException(PersistenceException.CODE_SINGLETON_NOT_FOUND);
	}

	////////////////////
	// private methods
	////////////////////

	private String getPersistenceUsername() {
		LOGGER.debug(" getPersistenceUsername: bundleContext: {}", this.bundleContext);
		// adding a version number so that in development registering can be done
		// without a new database since currently there is no way to delete or update
		// a bundle/password combo
		return getBundleCanonicalName(this.bundleContext) + ".v1";
	}

	/**
	 * return this bundle's name
	 *
	 * @return a string that represent the name of the bundle
	 */
	private String getBundleCanonicalName(BundleContext bundleContext) {
		String bundleCanonicalName = bundleContext.getBundle().getSymbolicName();
		LOGGER.info("Bundle started with name: {}", bundleCanonicalName);
		return bundleCanonicalName;
	}

}
