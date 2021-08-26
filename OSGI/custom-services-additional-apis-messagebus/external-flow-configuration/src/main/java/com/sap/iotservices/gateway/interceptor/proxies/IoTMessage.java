package com.sap.iotservices.gateway.interceptor.proxies;

import java.util.Map;

public class IoTMessage
extends BaseIoTMessage {
	private Map<String, ?> measures;
	private Long time;

	public IoTMessage() {
		super();
	}

	public Long getTime() {
		return time;
	}

	public void setTime(Long time) {
		this.time = time;
	}

	public Map<String, ?> getMeasures() {
		return measures;
	}

	public void setMeasures(Map<String, ?> measures) {
		this.measures = measures;
	}

	@Override
	public String toString() {
		final StringBuilder s = new StringBuilder();
		measures.forEach((k, v) -> s.append("\n\"").append(k).append("\":\"").append(v).append("\","));
		return "{" + "\n\"deviceAlternateId\":\"" + deviceAlternateId + "\"," + "\n\"capabilityAlternateId\":\"" +
			capabilityAlternateId + "\"," + "\n\"sensorAlternateId\":\"" + sensorAlternateId + "\"," +
			"\n\"sensorTypeAlternateId\":\"" + sensorAlternateId + "\"," + "\n\"time\":" + time + "," +
			"\n\"measures\":{" + s.substring(0, s.length() - 1) + "}\n}";
	}
}
