/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
  * Copyright (c) 2018 SAP SE or an affiliate company. All rights reserved.
  * The sample is not intended for production use.  Provided "as is".
  * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * **/

package com.sap.iot.edgeservices.persistence.sample.db;

import com.sap.iot.edgeservices.persistence.sample.PersistenceSampleActivator;
import com.sap.iot.edgeservices.persistence.sample.PersistenceException;
import com.sap.iot.edgeservices.persistenceservice.model.PSStatementObject;

public class Table {
	
	////////////////////
	// class fields
	////////////////////
	
	private PersistenceClient client;
	
	////////////////////
	// Constructors
	////////////////////
	
	public Table( PersistenceClient client ) {
		this.client = client;
	}
	
	////////////////////
	// public methods
	////////////////////
	
	public boolean createIfNeeded( String sql, String tableName ) throws PersistenceException {
		return create( sql, tableName, false );
	}
	
	public boolean create( String sql, String tableName, boolean bDeleteExisting ) throws PersistenceException {
		if ( ! exists(tableName) ) {
			if ( ! bDeleteExisting ) {
				PersistenceSampleActivator.println("Table ["+tableName+"] already exists.  Skipping CREATE Table");
				return true;
			}
			delete(tableName);
		}
		return client.executeDDL( sql );
	}
	
	////////////////////
	// private methods
	////////////////////
	
	private boolean exists( String tableName ) throws PersistenceException {
		String query = String.format(
				"SELECT 1 " +
                "  FROM sys.sysTable st KEY JOIN sys.sysuserperms sup " + 
                "  WHERE st.Table_name = '%s' ", 
                "    AND sup.user_name = user_name()", tableName);
		
		PSStatementObject resultSet = client.executeQuery(query);
		
		// if there is a result set, then the Table exists
		return !resultSet.getResultList().isEmpty();
	}
	
	private boolean delete( String tableName ) throws PersistenceException {
		String dropStatement = String.format("DROP Table IF EXISTS \"%s\"", tableName );
		return client.executeDDL(dropStatement);
	}

}
