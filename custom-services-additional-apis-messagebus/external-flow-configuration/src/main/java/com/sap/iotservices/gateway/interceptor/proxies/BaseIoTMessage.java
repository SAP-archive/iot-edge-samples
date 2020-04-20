package com.sap.iotservices.gateway.interceptor.proxies;

public class BaseIoTMessage
extends MinimalIoTMessage {

	String deviceAlternateId;

	public BaseIoTMessage() {
		super();
	}

	public String getDeviceAlternateId() {
		return deviceAlternateId;
	}

	public void setDeviceAlternateId(String deviceAlternateId) {
		this.deviceAlternateId = deviceAlternateId;
	}

}
