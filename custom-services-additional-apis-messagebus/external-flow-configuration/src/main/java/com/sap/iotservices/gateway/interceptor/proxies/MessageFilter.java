package com.sap.iotservices.gateway.interceptor.proxies;

public class MessageFilter
extends BaseIoTMessage {
	private String filterType;
	private String condition;

	public MessageFilter() {
		super();
	}

	public String getFilterType() {
		return filterType;
	}

	public void setFilterType(String filterType) {
		this.filterType = filterType;
	}

	public String getCondition() {
		return condition;
	}

	public void setCondition(String condition) {
		this.condition = condition;
	}
}
