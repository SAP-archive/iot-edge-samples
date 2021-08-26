package com.sap.iotservices.gateway.interceptor.proxies;

import org.apache.commons.lang.StringUtils;

public class ExtendedCustomConfiguration
extends CustomConfiguration {
	private String externalConfigurationTopic;
	private String configurationFile;

	public ExtendedCustomConfiguration() {
		super();
	}

	public String getExternalConfigurationTopic() {
		return externalConfigurationTopic;
	}

	public String getConfigurationFile() {
		return configurationFile;
	}

	public void mergeMissingValues(ExtendedCustomConfiguration defaultConfiguration) {
		super.mergeMissingValues(defaultConfiguration);

		if (StringUtils.isEmpty(externalConfigurationTopic)) {
			externalConfigurationTopic = defaultConfiguration.getExternalConfigurationTopic();
		}

		if (StringUtils.isEmpty(configurationFile)) {
			configurationFile = defaultConfiguration.getConfigurationFile();
		}
	}
}
