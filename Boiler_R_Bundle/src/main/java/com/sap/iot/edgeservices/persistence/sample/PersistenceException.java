package com.sap.iot.edgeservices.persistence.sample;

public class PersistenceException extends Exception {
	private static final long serialVersionUID = -1230356990632230194L;

	public static final String CODE_AUTHENTICATION_INVALID_CREDENTIALS = "CODE_AUTHENTICATION_INVALID_CREDENTIALS";
	public static final String CODE_DDL_FAILED = "CODE_DDL_FAILED";
	public static final String CODE_SINGLETON_NOT_FOUND = "CODE_SINGLETON_NOT_FOUND";
	public static final String CODE_INSERT_AVERAGES_TABLE_FAILED = "CODE_INSERT_AVERAGES_TABLE_FAILED";
	
	private final String code;

	public PersistenceException(String code) {
		super();
		this.code = code;
	}

	public PersistenceException(String message, Throwable cause, String code) {
		super(message, cause);
		this.code = code;
	}

	public PersistenceException(String message, String code) {
		super(message);
		this.code = code;
	}

	public PersistenceException(Throwable cause, String code) {
		super(cause);
		this.code = code;
	}
	
	public String getCode() {
		return this.code;
	}
}
