package com.sap.iot.edgeservices.persistence.sample;

import java.time.Instant;
import java.util.ArrayList;

import com.sap.iot.edgeservices.persistence.sample.db.PersistenceClient;
import com.sap.iot.edgeservices.persistenceservice.model.PSDataObject;
import com.sap.iot.edgeservices.persistenceservice.model.PSStatementObject;

public class ConfigurationProperty {

    private String propertyName;
    private String profileId;
    private String objectId;
    private String lastModified = "1970-01-01 00:00:00.000";
    private String value = "";

    private static final String SELECT_SQL = 
          "SELECT    TOP 1 "  
        + "          CAST(m.MEASURE_VALUE AS  VARCHAR(32)) MEASURE_VALUE,  "
        + "          m.DATE_RECEIVED "
        + "  FROM    EFPS.MEASURE m "
        + " WHERE    m.PROFILE_ID = '%s'"
        + "   AND    m.OBJECT_ID = '%s'"
        + "   AND    m.DATE_RECEIVED > '%s'"
        + " ORDER BY m.DATE_RECEIVED DESC";

    public ConfigurationProperty( String propertyName, String sensorTypeAlternateId, String capabilityAlternateId ) {
        this.propertyName = propertyName;
        this.profileId = sensorTypeAlternateId;
        this.objectId = capabilityAlternateId;
    }

    public ConfigurationProperty( String propertyName, String sensorTypeAlternateId, String capabilityAlternateId, String defaultValue ) {
        this.propertyName = propertyName;
        this.profileId = sensorTypeAlternateId;
        this.objectId = capabilityAlternateId;
        this.value = defaultValue;
    }

    public void update( PersistenceClient persistenceClient ) {
        String sql = String.format( SELECT_SQL, profileId, objectId, lastModified);
        PSStatementObject stmt;
        try {
            BoilerPredictiveActivator.printlnDebug( "updating: " + this.toString() );

            stmt = persistenceClient.executeQuery(sql);
            if ( stmt.hasResultList() && !stmt.getResultList().isEmpty() ) {
                value = persistenceClient.getValue(stmt, 0, 0).toString();
                lastModified = persistenceClient.getValue(stmt,  0,  1).toString();
                BoilerPredictiveActivator.printlnDebug(propertyName + " has new value: " + this.toString() );
            }
        } catch (PersistenceException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }	
    }

    public String getValue() {
        return value;
    }

    public void setDefaultValue( String defaultValue ) {
        value = defaultValue;
    }

    public int getValueAsInt() {
        return getValueAsInt(0);
    }
    public int getValueAsInt( int defaultValue ) {
        int parsedInt = 0;
        try {
            parsedInt = Integer.parseInt(value);
        } catch( NumberFormatException nfe ) {
            BoilerPredictiveActivator.println( "ERROR: could not convert " + this.propertyName + " value=" + value + " to an int.  defaulting to " + defaultValue);
            return defaultValue;
        }
        return parsedInt;
    }

    public String toString() {
        return String.format("[ %s, %s, %s, %s, %s ]", propertyName, profileId, objectId, lastModified, value);
    }
}
