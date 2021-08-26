/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
  * Copyright (c) 2018 SAP SE or an affiliate company. All rights reserved.
  * The sample is not intended for production use.  Provided "as is".
  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * **/
package com.sap.iot.edgeservices.persistence.sample.db;

import java.util.List;

import org.osgi.framework.BundleContext;

import com.sap.iot.edgeservices.persistence.sample.PersistenceException;
import com.sap.iot.edgeservices.persistence.sample.PersistenceSampleActivator;
import com.sap.iot.edgeservices.persistenceservice.model.PSDataObject;
import com.sap.iot.edgeservices.persistenceservice.model.PSStatementObject;
import com.sap.iot.edgeservices.persistenceservice.service.IPersistenceService;

/**
 * This is a helper class that allows the Calculation classes to connect to the database.
 * 
 */
public class PersistenceClient {
	
	////////////////////
	// fields
	////////////////////
    
	private String password = "G3vpZHTbKbYH^8}";  	// an example password - must be securely stored to authenticate
	private IPersistenceService persistenceService;
	private BundleContext bundleContext;
	private String token = null;
	
	////////////////////
	// Constructors
	////////////////////
	
	public PersistenceClient( IPersistenceService persistenceService, BundleContext bundleContext ) throws PersistenceException {
		this.persistenceService = persistenceService;
		this.bundleContext = bundleContext;

		this.token = this.getPersistenceAccessToken();		 // we attempt the token access here as if this fails, then the engine
															 // should not run
	}

	////////////////////
	// public methods
	////////////////////
	
	/**
	 * This function will get the token from the persistence persistenceService
	 * @return token
	 * @throws PersistenceException if the credentials are invalid, returns type: PersistenceException.CODE_AUTHENTICATION_INVALID_CREDENTIALS
	 */
	public String getPersistenceAccessToken() throws PersistenceException {
		if ( this.token == null ) {
			
			String newToken;
			PersistenceSampleActivator.printlnDebug("(HIDE IN PRODUCTION) bundleCanonicalName = " + getPersistenceUsername());
			PersistenceSampleActivator.printlnDebug("(HIDE IN PRODUCTION) password = " + this.password );
			
	        newToken = persistenceService.RegisterBundleForAccess(getPersistenceUsername(), this.password.toCharArray());
	        if ( newToken == null ) {
	        	throw new PersistenceException(PersistenceException.CODE_AUTHENTICATION_INVALID_CREDENTIALS);
	        }
	        return newToken;
		} else {
			return this.token;		
		}	
	}
	
	/**
	 * Executes DDL against the persistence persistenceService.  
	 *          DDL is data definition language, creates tables, store procedures, functions etc..
	 * @param sql the definition to execute.
	 * @return boolean where true indicates no issues, false indicates an error occurred. 
	 * @throws PersistenceException
	 */
	public boolean executeDDL( String sql ) throws PersistenceException {
        PSStatementObject statementObject = persistenceService.ExecuteSQL(token, sql );
        return !statementObject.hasErrors();
	}
	
	/**
	 * Executes DML against the persistence persistenceService 
	 *          DML is data modeling language, execute queries, updates, delete of data
	 * @param sql the query/update/delete to execute
	 * @return a statement Object of the result set or rows changed.
	 * @throws PersistenceException
	 */
	public PSStatementObject executeQuery( String sql ) throws PersistenceException {
        PSStatementObject statementObject = persistenceService.ExecuteSQL(token, sql );
        return statementObject;
	}
	
	/**
	 * Primarily for queries that will return just a single value, this function will extract that value
	 * @param statementObject a PSStatementObject with a result set
	 * @return the string value of the first column of the first row of the result set
	 * @throws PersistenceException if there is no result set then this will throw PersistenceException.CODE_SINGLETON_NOT_FOUND
	 */
	public String getFirstRowFirstColumn( PSStatementObject statementObject ) throws PersistenceException {
		return getValue(statementObject, 0, 0);
	}
	
	/**
	 * Return a specific column and row value
	 * @param statementObject a PSStatementObject with a result set
	 * @param row 0-based index
	 * @param column 0-based index
	 * @return the string value of the column and row of the result set
	 * @throws PersistenceException if there is no result set then this will throw PersistenceException.CODE_SINGLETON_NOT_FOUND
	 */
	public String getValue( PSStatementObject statementObject, int row, int column ) throws PersistenceException {
		if (statementObject.hasResultList() && !statementObject.getResultList().isEmpty() ) {
            List<List<PSDataObject>> rows =  statementObject.getResultList();
            List<PSDataObject> columns = rows.get(row);
            if ( !columns.isEmpty() ) {
                return columns.get(column).getValue().toString();        	                	
            }
        } 
		throw new PersistenceException(PersistenceException.CODE_SINGLETON_NOT_FOUND);
	}
	
	/**
	 * print the entire PSStatementObject to standard out, or "ResultSet is empty" if there are no rows
	 * @param statementObject
	 */
	public void printResultSet( PSStatementObject statementObject ) {
        PersistenceSampleActivator.printlnDebug("printResultSet start-------------");
        if (statementObject.hasResultList()) {
        	StringBuffer s = new StringBuffer();
            statementObject.getResultList().forEach((row) -> {
            	s.setLength(0);
                row.forEach((column) -> {
                	s.append(column.getValue() + "(" + column.getColumnName() + ":" + column.getMetadata() + "), ");
                });
                PersistenceSampleActivator.printlnDebug(s.toString());
            });
        } else {
            PersistenceSampleActivator.printlnDebug("    ResultSet is empty");
        }
        PersistenceSampleActivator.printlnDebug("printResultSet end---------------");
	}
	

	////////////////////
	// private methods
	////////////////////
	
	private String getPersistenceUsername() {
		PersistenceSampleActivator.printlnDebug(" getPersistenceUsername: bundleContext: " + this.bundleContext );
		// adding a version number so that in development registering can be done 
		// without a new database since currently there is no way to delete or update
		// a bundle/password combo
		return getBundleCanonicalName(this.bundleContext) + ".v1"; 	
	}

	/**
	 * return this bundle's name
	 * @return
	 */
	private String getBundleCanonicalName( BundleContext bundleContext ) {
		PersistenceSampleActivator.printlnDebug("bundleContext = " + bundleContext.toString());
		//String bundleCanonicalName = "test";
		String bundleCanonicalName = bundleContext.toString();
        return bundleCanonicalName;
	}
	
}
