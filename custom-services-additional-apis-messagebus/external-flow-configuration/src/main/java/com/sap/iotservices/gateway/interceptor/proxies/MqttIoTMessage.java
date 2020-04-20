package com.sap.iotservices.gateway.interceptor.proxies;

import java.util.List;
import java.util.Map;

public class MqttIoTMessage
extends MinimalIoTMessage {

	private List<Map<String, ?>> measures;

	public MqttIoTMessage() {
		super();
	}

	public List<Map<String, ?>> getMeasures() {
		return measures;
	}

	public void setMeasures(List<Map<String, ?>> measures) {
		this.measures = measures;
	}
}
