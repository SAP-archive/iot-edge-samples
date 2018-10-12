/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
  * Copyright (c) 2018 SAP SE or an affiliate company. All rights reserved.
  * The sample is not intended for production use.  Provided "as is".
  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * **/
package com.sap.iot.edgeservices.persistence.sample.custom;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Date;

import com.sap.iot.edgeservices.persistence.sample.Calculation;
import com.sap.iot.edgeservices.persistence.sample.PersistenceException;
import com.sap.iot.edgeservices.persistence.sample.PersistenceSampleActivator;
import com.sap.iot.edgeservices.persistence.sample.db.PersistenceClient;
import com.sap.iot.edgeservices.persistence.sample.db.Table;
import com.sap.iot.edgeservices.persistenceservice.model.PSStatementObject;

public class CalculateMaxTemperature extends Calculation {

	////////////////////
	// Static fields
	////////////////////

	// this needs to be static since the Engine will be asking for this before it has instantiated it
	private static String logLevel = "INFO";

	private static Boolean CLOUD_EDGE_SERVICES = true;  //SET TO false for ON-PREMISE
	
	private static String IOTS_MEASURES_URL = "http://localhost:8699/measures/";	// destination to send calculated values
	private static String TRANSFORMED_SENSOR_TYPE_ALTERNATE_ID = "1002";			// sensorTypeAlternateId to send calculated values
	private static String TRANSFORMED_CAPABILITY_ALTERNATE_ID = "PSMTResult";		// capabilityAlternateId to send calculated values
	private static String TRANSFORMED_SENSOR_ALTERNATE_ID = "SensorPSMT";			// sensorAlternateId to send calculated values
	
	////////////////////
	// Class fields
	////////////////////
	
	private int calculationFrequencyMS;	// frequency that the engine will calculate
	private String sensorTypeAlternateId;	// the sensorTypeAltnerateId  that the engine will calculate on 
	private String capabilityAlternateId;	// the capabilityAlternateId that the engine will calculate on
	
	SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");	
	private String mostRecentQueryTime = null;
	
	////////////////////
	// constructors
	////////////////////
	
	public CalculateMaxTemperature( PersistenceClient persistenceClient ) {
		super(persistenceClient);
		
		PersistenceSampleActivator.printlnDebug("CalculateMaxTemperature:ctor - called");
		
		// properties that control how the Calculation will be done
		// the user can stream into IOTS the appropriate sensorTypeAlternateid, capabilityAlternateId and value, and this sample
		// will pick up those values to change the way the transformation is done
		// the last value in the constructor will be used if no values are provided a runtime
		calculationFrequencyMS = 10000;	// 10 seconds

		if (CLOUD_EDGE_SERVICES) {
			// cloud edition
			sensorTypeAlternateId = "0"; 	// only for this sensorType
			capabilityAlternateId = "1"; 	// only for this capability
		} else {
	        // on-premise edition
			sensorTypeAlternateId = "Temperature"; 	// only for this Sensor Profile
			capabilityAlternateId = "Temperature"; 	// only for this Sensor Profile
		}
		
		resetQueryTime(); 
	}	
	
	////////////////////
	// public methods
	////////////////////
	
	public void run() {
		PersistenceSampleActivator.printlnDebug("CalculateMaxTemperature:run - called");
		
		// ensure we have initialized and in a good state
		if ( state != State.RUNNING ) {
			PersistenceSampleActivator.println("Warning: NOT RUNNING: CalculateMaxTemperature.state = " + state );
			return;
		}

		// determine if any configuration changes have been sent
		updateConfigurations();
		
		// get the data and create a primitive array
		HashMap<String,ArrayList<Double>> valuesByDevice = getSampleData();
				
		// for each device that sent in a value, send out the max
		valuesByDevice.forEach((device, values) -> {
			Date currentTime = new Date();

			Double maxTemp = this.calculateMaxTemperature(values);
			PersistenceSampleActivator.println( "========================" );
			PersistenceSampleActivator.println( currentTime + " " + device + " input values      = " + convertToString(values) );
			PersistenceSampleActivator.println( currentTime + " " + device + " has maxTemp value = " + maxTemp );
		
			if (CLOUD_EDGE_SERVICES) {
				// send the results back into IOT Service engine as a different capability
				// FOR ON-PREMISE EDGE SERVICES, comment out this line
				streamResults( IOTS_MEASURES_URL, 
						device, 
						TRANSFORMED_SENSOR_TYPE_ALTERNATE_ID,
						TRANSFORMED_CAPABILITY_ALTERNATE_ID,
						TRANSFORMED_SENSOR_ALTERNATE_ID,
						maxTemp.toString());
			}
		});
	}
	
	// this is made available to the engine
	@Override
	public int getPollingFreqencyMS() {
		// return the calculation delay or 5000 if the value is not an int
		return calculationFrequencyMS;
	}
		
	@Override
	public String getLogLevel() {
		return logLevel;
	}
		
	////////////////////
	// private methods
	////////////////////
	
	// this is called by the super class, Calculation
	protected void initialize() {
		PersistenceSampleActivator.printlnDebug("CalculateMaxTemperature:initialize - called");
		// if you want to store the result to a custom table, create a table to store them.
		createMaxTemperatureTable();
		this.state = State.RUNNING;
	}	

    private void resetQueryTime() {
 		// reset the query time for the next query
		try {
			mostRecentQueryTime = persistenceClient.getFirstRowFirstColumn( persistenceClient.executeQuery("SELECT NOW()") );
			PersistenceSampleActivator.printlnDebug("new date is: " + mostRecentQueryTime );
		} catch (PersistenceException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
	}
	
	// selects the sample data from the persistence database which is constantly being updated
	// the key string is the device
	// we calculate the max per device
	private HashMap<String,ArrayList<Double>> getSampleData() {
		
		PSStatementObject stmt;
		String sql = getSqlForMeasureValues( sensorTypeAlternateId, 
				                             capabilityAlternateId,
				                             mostRecentQueryTime );
		
		resetQueryTime();

		HashMap<String, ArrayList<Double>> valuesByDevice = new HashMap<String, ArrayList<Double>>();
		//ArrayList<Double> values = new ArrayList<Double>();
		try {
			stmt = persistenceClient.executeQuery(sql);
			valuesByDevice = getValuesAsDoublesByDevice(stmt);
		} catch (PersistenceException pe) {
			// TODO Auto-generated catch block
			pe.printStackTrace();
		} catch ( Exception e ) {
			e.printStackTrace();
		}
		return valuesByDevice;
	}
	
	// helper 
	private String convertToString( ArrayList<Double> temperatures ) {
		StringBuffer sb = new StringBuffer("[");
		String separator = "";
		for ( Double d : temperatures) {
			sb.append( separator + d  );
			separator = ", ";
		}
		sb.append("]");
		return sb.toString();
	}
	
	// go to the database and see if any of the configurations have changed
	private void updateConfigurations() {
		// TODO, if properties like polling frequency, logLevel etc are dynamic through configuration files,
		//       we could check for new versions here
	}
	
	// convert the result set into an array of Doubles
	private HashMap<String,ArrayList<Double>> getValuesAsDoublesByDevice( PSStatementObject statementObject ) {
		//ArrayList<Double> values = new ArrayList<>();
		HashMap<String, ArrayList<Double>> valuesByDevice = new HashMap<String, ArrayList<Double>>();

        PersistenceSampleActivator.printlnDebug("getValuesAsDoublesByDevice start-------------");
        if (statementObject.hasResultList()) {
            statementObject.getResultList().forEach((row) -> {
            	String device = row.get(0).getValue().toString();
            	PersistenceSampleActivator.printlnDebug("device = " + device);
            	ArrayList<Double> valueMap = valuesByDevice.get(device);
            	if ( valueMap == null ) {
            		valueMap = new ArrayList<Double>();
            		valuesByDevice.put(device, valueMap);
            	}
            	String value = row.get(1).getValue().toString();   
            	PersistenceSampleActivator.printlnDebug("value = " + value);
                PersistenceSampleActivator.printlnDebug(device + ":" + value);
                
                String date = row.get(2).getValue().toString();
                PersistenceSampleActivator.printlnDebug("date = " + date);
                
                try {
                    Double d = Double.valueOf(value);
                    valueMap.add(d);
                	PersistenceSampleActivator.printlnDebug("value added");
                    
                } catch (NumberFormatException nfe) {
                	StringBuffer errMsg = new StringBuffer("Error: not a number: ");
                	row.forEach((column) -> {
                    	errMsg.append(column.getValue() + "(" + column.getColumnName() + ":" + column.getMetadata() + "), ");
                    });
                	PersistenceSampleActivator.printlnDebug(valueMap.toString());
                }
            });
        } else {
            PersistenceSampleActivator.printlnDebug(" ResultSet is empty");
        }
        
        PersistenceSampleActivator.printlnDebug("getValuesAsDoublesByDevice end---------------");
        return valuesByDevice;
	}
	
	// SQL used to select the data
	private String getSqlForMeasureValues( String profileId, String objectId, String sinceDate ) {
		
		// NOTE: only top 1000 records are returned.  If more data is expected, then 
		// query should be changed to use database aggregation instead of Java

		String sql = "SELECT top 1000 m.DEVICE_ADDRESS, " 
				+ "          CAST(m.MEASURE_VALUE AS VARCHAR(32)) MEASURE_VALUE,  "
				+ "          m.DATE_RECEIVED "
				+ "     FROM EFPS.MEASURE m "
				+ "    WHERE m.OBJECT_ID = '" + objectId + "'"
				+ "      AND m.PROFILE_ID = '" + profileId + "'"
				+ "      AND m.DATE_RECEIVED > '" + sinceDate + "'"
				+ " ORDER BY m.DATE_RECEIVED DESC";
		
		PersistenceSampleActivator.printlnDebug("getSqlForMeasureValues: ============");
		PersistenceSampleActivator.printlnDebug(sql);
		
		return sql;
	}

	// create a table to store the results (if you want... ) not implemented in this sample
	private void createMaxTemperatureTable() {
		PersistenceSampleActivator.printlnDebug("CalculateMaxTemperature:createMaxTemperatureTable - called");

		String sql = "CREATE TABLE MaxTemperature ( " 
				+ "              id INT PRIMARY KEY DEFAULT AUTOINCREMENT, "
				+ "          device VARCHAR(32), "
				+ "         maxTemp FLOAT NOT NULL, "
				+ "        windowMS INTEGER NOT NULL, "
				+ "        calcTime DATE DEFAULT CURRENT UTC TIMESTAMP); ";
		Table table = new Table(persistenceClient);
		try {
			// if table already exists, it will not modify it
			table.createIfNeeded(sql, "MaxTemperature");
			PersistenceSampleActivator.println("CalculateMaxTemperature:createMaxTemperatureTable - success");
		} catch (PersistenceException e) {
			// TODO Auto-generated catch block
			PersistenceSampleActivator.println("ERROR: CalculateMaxTemperature:createMaxTemperatureTable - failed");
			state = State.ERROR;
			e.printStackTrace();
		}		
	}
	
	// the actual PSMT transform function
	private Double calculateMaxTemperature(ArrayList<Double> temperatures) 
	{   
		Double maxTemperature = null;
		for ( Double temp : temperatures ) {
			if ( maxTemperature == null || temp > maxTemperature ) {
				maxTemperature = temp;
			}
		}
	    return maxTemperature;
	}
	
	// send the results back into IOTS using a different sensorType/capability for processing again
	private void streamResults(String measuresUrl, String device, String sensorTypeAlternateId, String capabilityAlternateId, String sensorAlternateId, String doubles) {
		PersistenceSampleActivator.println("Sending data to streaming..." + measuresUrl  +device );
		
		// format the payload
		String jsonPayload = String.format("{\"sensorTypeAlternateId\":\"%s\",\"capabilityAlternateId\":\"%s\",\"sensorAlternateId\":\"%s\",\"measures\":[[\"%s\"]]}",
				sensorTypeAlternateId, 
				capabilityAlternateId, 
				sensorAlternateId, 
				doubles);
		
		PersistenceSampleActivator.println("Sending data: " + jsonPayload );
		byte[] byteArrayPayload =  jsonPayload.getBytes(StandardCharsets.UTF_8);
		int payloadLength = byteArrayPayload.length;
		
		try {
			// create a connection to IOTS
			URL url = new URL( measuresUrl + device);
			URLConnection con = url.openConnection();
			HttpURLConnection http = (HttpURLConnection)con;

			// set the properties of the post
			http.setRequestMethod("POST"); // PUT is another valid option
			http.setDoOutput(true);
			http.setFixedLengthStreamingMode(payloadLength);
			http.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
			
			// connect and send data
			http.connect();
			try(OutputStream os = http.getOutputStream()) {
			    os.write(byteArrayPayload);
			}
			// Do something with http.getInputStream()?			
		} catch (Exception e) {
			PersistenceSampleActivator.println("ERROR: Could not stream transformed results back to streaming: " + e.getMessage() );
		}
	}
	
}
