package com.sap.iotservices.gateway.interceptor.proxies;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang.StringUtils;
import org.eclipse.paho.client.mqttv3.IMqttMessageListener;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.iotservices.gateway.interceptor.ExternalFlowActivator;

public class MqttConsumer
implements IMqttMessageListener {
	private static final Logger LOGGER = LoggerFactory.getLogger(MqttConsumer.class);
	private static final ObjectMapper mapper = new ObjectMapper()
		.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
		.configure(DeserializationFeature.FAIL_ON_MISSING_CREATOR_PROPERTIES, false); // json object mapper

	@Override
	public void messageArrived(String s, MqttMessage mqttMessage)
	throws Exception {
		LOGGER.debug("Received message in the topic {}: {}", s, mqttMessage);
		if (!MqttInterop.isStatus()) {
			ExternalFlowActivator.reInitMqtt();
		}
		MqttIoTMessage message = mapper.readValue(mqttMessage.toString(), MqttIoTMessage.class);
		TypeReference<HashMap<String, Object>> typeRef = new TypeReference<HashMap<String, Object>>() {
		};
		Map<String, Object> originalMassageMap = mapper.readValue(mqttMessage.toString(), typeRef);
		Object device = originalMassageMap.get("deviceAlternateId");
		String jsonMessage = mapper.writeValueAsString(message);
		if (device instanceof String && !StringUtils.isEmpty((String) device) && !StringUtils.isEmpty(jsonMessage)) {
			MqttInterop.sendMessage("measures/" + device, jsonMessage);
		} else {
			LOGGER.error("Malformed json message: {}", mqttMessage);
		}
	}
}
