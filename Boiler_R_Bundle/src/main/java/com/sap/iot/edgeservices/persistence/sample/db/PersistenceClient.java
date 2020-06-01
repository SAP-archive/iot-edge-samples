package com.sap.iot.edgeservices.persistence.sample.db;

import com.sap.iot.edgeservices.persistence.sample.BoilerPredictiveActivator;
import com.sap.iot.edgeservices.persistence.sample.PersistenceException;
import com.sap.iot.edgeservices.persistenceservice.model.PSDataObject;
import com.sap.iot.edgeservices.persistenceservice.model.PSStatementObject;
import com.sap.iot.edgeservices.persistenceservice.service.IPersistenceService;

import java.util.List;

import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;

/**
 * This is a helper class that allows the Calculation classes to connect to the database.
 *
 * @author David Loop (i826651)
 *
 */
public class PersistenceClient {

    ////////////////////
    // inner class
    ////////////////////

    //    private class RowLine {
    //        String output;
    //
    //        RowLine(String txt) {
    //            this.output = txt;
    //        }
    //
    //        public String appendOutput(String txt) {
    //            this.output += txt;
    //            return this.output;
    //        }
    //
    //        public String getOutput() {
    //            return this.output;
    //        }
    //    }

    ////////////////////
    // fields
    ////////////////////

    private String password = "G3vpZHTbKbYH^8}";    // an example password
    private IPersistenceService service;
    private BundleContext fContext;
    private String token = null;

    ////////////////////
    // Constructors
    ////////////////////

    public PersistenceClient( IPersistenceService service, BundleContext fContext ) throws PersistenceException {
        this.service = service;
        this.fContext = fContext;

        // we attempt the token access here as if this fails, then the engine
        // should not run
        this.getPersistenceAccessToken();
    }

    ////////////////////
    // public methods
    ////////////////////

    /**
     * This function will get the token from the persistence service
     * @return token
     * @throws PersistenceException if the credentials are invalid, returns type: PersistenceException.CODE_AUTHENTICATION_INVALID_CREDENTIALS
     */
    public String getPersistenceAccessToken() throws PersistenceException {
        if ( token == null ) {
            BoilerPredictiveActivator.printlnDebug("bundleCanonicalName = " + getPersistenceUsername());
            BoilerPredictiveActivator.printlnDebug("password = " + this.password );
            token = service.RegisterBundleForAccess(getPersistenceUsername(), this.password.toCharArray());
            if ( token == null ) {
                throw new PersistenceException(PersistenceException.CODE_AUTHENTICATION_INVALID_CREDENTIALS);
            } else {
                BoilerPredictiveActivator.printlnDebug("Returned PS token = " + token);
            }
        }
        return token;
    }

    /**
     * Executes DDL against the persistence service.  (DDL is data definition language, creates tables, store procedures, functions etc..)
     * @param sql the definition to execute.
     * @return boolean where true indicates no issues, false indicates an error occurred.
     * @throws PersistenceException
     */
    public boolean executeDDL( String sql ) throws PersistenceException {
        if (token == null) {
            token = getPersistenceAccessToken();
        }
        PSStatementObject statementObject = service.ExecuteSQL(token, sql );
        return !statementObject.hasErrors();
    }

    /**
     * Executes DML against the persistence service (DML is data modeling language, execute queries, updates, delete of data)
     * @param sql the query/update/delete to execute
     * @return a statement Object of the result set or rows changed.
     * @throws PersistenceException
     */
    public PSStatementObject executeQuery( String sql ) throws PersistenceException {
        if (token == null) {
            token = getPersistenceAccessToken();
        }
        PSStatementObject statementObject = service.ExecuteSQL(token, sql );
        return statementObject;
    }

    /**
     * WHen the query will return just a single value, this function will extract that value
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
        BoilerPredictiveActivator.printlnDebug("printResultSet start-------------");
        int rowIndex = 0;
        if (statementObject.hasResultList()) {
            StringBuffer s = new StringBuffer();
            statementObject.getResultList().forEach((row) -> {
                //RowLine rowFormated = new RowLine("        " + rowIndex + " : ");
                s.setLength(0);
                row.forEach((column) -> {
                    //rowFormated.appendOutput(column.getValue() + "(" + column.getColumnName() + ":" + column.getMetadata() + "), ");
                    s.append(column.getValue() + "(" + column.getColumnName() + ":" + column.getMetadata() + "), ");
                });
                //BoilerPredictiveActivator.printlnDebug(rowFormated.getOutput());
                BoilerPredictiveActivator.printlnDebug(s.toString());
            });
        } else {
            BoilerPredictiveActivator.printlnDebug("    ResultSet is empty");
        }
        BoilerPredictiveActivator.printlnDebug("printResultSet end---------------");
    }


    ////////////////////
    // private methods
    ////////////////////

    /**
     * return this bundle's name
     * @return
     */
    private String getBundleCanonicalName( BundleContext bundleContext ) {
        BoilerPredictiveActivator.printlnDebug("bundleContext = " + bundleContext.toString());
        String bundleCanonicalName = "test";
        //      try {
        //          Bundle bundle = bundleContext.getBundle();
        //          bundleCanonicalName = bundle.getSymbolicName();
        //      } catch (NullPointerException npe) {
        //          System.out.println("caught npe");
        //      }
        return bundleCanonicalName;
    }

    private String getPersistenceUsername() {
        BoilerPredictiveActivator.printlnDebug(" getPersistenceUsername: fContext: " + this.fContext);
        return getBundleCanonicalName(this.fContext) + ".v1"; // adding a version number so that in development registering can be done
        // without a new database since currently there is no way to delete or update
        // a bundle/password combo

    }
}
