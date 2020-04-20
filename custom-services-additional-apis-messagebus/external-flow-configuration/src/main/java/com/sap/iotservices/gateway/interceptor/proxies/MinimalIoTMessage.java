package com.sap.iotservices.gateway.interceptor.proxies;

public class MinimalIoTMessage {
	String capabilityAlternateId;
	String sensorAlternateId;
	String sensorTypeAlternateId;

	public MinimalIoTMessage() {
		super();
	}

	public String getCapabilityAlternateId() {
		return capabilityAlternateId;
	}

	public void setCapabilityAlternateId(String capabilityAlternateId) {
		this.capabilityAlternateId = capabilityAlternateId;
	}

	public String getSensorAlternateId() {
		return sensorAlternateId;
	}

	public void setSensorAlternateId(String sensorAlternateId) {
		this.sensorAlternateId = sensorAlternateId;
	}

	public String getSensorTypeAlternateId() {
		return sensorTypeAlternateId;
	}

	public void setSensorTypeAlternateId(String sensorTypeAlternateId) {
		this.sensorTypeAlternateId = sensorTypeAlternateId;
	}
}
