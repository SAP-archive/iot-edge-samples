package com.sap.iot.edgeservices.persistence.sample.db;

import com.sap.iot.edgeservices.persistence.sample.BoilerPredictiveActivator;
import com.sap.iot.edgeservices.persistence.sample.PersistenceException;
import com.sap.iot.edgeservices.persistenceservice.model.PSStatementObject;

public class StoredProcedure {
	
	////////////////////
	// class fields
	////////////////////
	
	private PersistenceClient client;
	
	////////////////////
	// Constructors
	////////////////////
	
	public StoredProcedure( PersistenceClient client ) {
		this.client = client;
	}
	
	////////////////////
	// public methods
	////////////////////
	
	public boolean createIfNeeded( String sql, String storedProcedureName) throws PersistenceException {
		return create( sql, storedProcedureName, false );
	}
	
	public boolean create( String sql, String storedProcedureName, boolean bDeleteExisting ) throws PersistenceException {
		if ( ! exists(storedProcedureName) ) {
			if ( ! bDeleteExisting ) {
				BoilerPredictiveActivator.println("StoredProcedure ["+storedProcedureName+"] already exists.  Skipping CREATE PROCEDURE");
				return true;
			}
			delete(storedProcedureName);
		}
		
		return client.executeDDL( sql );
	}
	
	////////////////////
	// private methods
	////////////////////
	
	
	private boolean exists( String storedProcedureName ) throws PersistenceException {
		String query = String.format(
				"SELECT 1 " +
                "  FROM sys.sysprocedure sp KEY JOIN sys.sysuserperms sup " + 
                " WHERE st.proc_name = '%s' ", 
                "   AND sup.user_name = user_name()", storedProcedureName);
		
		PSStatementObject resultSet = client.executeQuery(query);
		
		// if there is a result set, then the StoredProcedure exists
		return resultSet.hasResultList();
	}
	
	private boolean delete( String storedProcedureName ) throws PersistenceException {
		String dropStatement = String.format("DROP PROCEDURE IF EXISTS \"%s\"", storedProcedureName );
		return client.executeDDL(dropStatement);
	}

}
