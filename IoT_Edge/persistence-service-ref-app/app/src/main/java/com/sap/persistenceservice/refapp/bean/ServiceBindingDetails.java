package com.sap.persistenceservice.refapp.bean;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class ServiceBindingDetails {
	/**
	 * Type of dependent services e.g., REST/MQTT
	 */
	private String type;

	/**
	 * Service instance id of the dependent services
	 */
	private String id;

	/**
	 * This defines what kind of data needs to be sent using URL e.g., MEASURES
	 */
	private String api;

	/**
	 * URL to send data over REST/MQTT
	 */
	private String url;
}
