package com.sap.persistenceservice.refapp.bean;

import com.fasterxml.jackson.annotation.JsonProperty;

public class SchemaConfigBean {
	@JsonProperty("host")
	private String host;

	@JsonProperty("port")
	private int port;

	@JsonProperty("database")
	private String database;

	@JsonProperty("user")
	private String user;

	@JsonProperty("password")
	private String password;

	@JsonProperty("uri")
	private String uri;

	public String getHost() {
		return host;
	}

	public int getPort() {
		return port;
	}

	public String getDatabase() {
		return database;
	}

	public String getUser() {
		return user;
	}

	public String getPassword() {
		return password;
	}

	public String getUri() {
		return uri;
	}
}
