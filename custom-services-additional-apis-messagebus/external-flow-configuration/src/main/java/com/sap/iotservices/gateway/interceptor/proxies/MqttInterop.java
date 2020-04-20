package com.sap.iotservices.gateway.interceptor.proxies;

import java.nio.charset.Charset;
import java.util.Arrays;
import java.util.UUID;
import java.util.stream.Collectors;

import org.eclipse.paho.client.mqttv3.IMqttToken;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

public class MqttInterop {
	private static final Logger LOGGER = LoggerFactory.getLogger(MqttInterop.class);
	private static MqttClient msgBusMqttClient;
	private static String broker = "tcp://127.0.0.1:61618";
	private static String clientId = UUID.randomUUID().toString();
	private static String inTopic = "inTopic";
	private static String outTopic = "outTopic";
	private static ObjectMapper mapper = new ObjectMapper();
	private static int qos = 2;
	private static MqttConsumer messageConsumer = new MqttConsumer();
	private static boolean status = false;

	private MqttInterop() {
		super();
	}

	public static boolean isStatus() {
		return status;
	}

	public static void setStatus(boolean status) {
		MqttInterop.status = status;
	}

	public static String getBroker() {
		return broker;
	}

	public static void setBroker(String broker) {
		MqttInterop.broker = broker;
	}

	public static String getClientId() {
		return clientId;
	}

	public static void setClientId(String clientId) {
		MqttInterop.clientId = clientId;
	}

	public static String getInTopic() {
		return inTopic;
	}

	public static void setInTopic(String inTopic) {
		MqttInterop.inTopic = inTopic;
	}

	public static String getOutTopic() {
		return outTopic;
	}

	public static void setOutTopic(String outTopic) {
		MqttInterop.outTopic = outTopic;
	}

	public static int getQos() {
		return qos;
	}

	public static void setQos(int qos) {
		MqttInterop.qos = qos;
	}

	public static void init() {
		MqttConnectOptions connOpts = new MqttConnectOptions();
		connOpts.setCleanSession(true);
		try (MemoryPersistence persistence = new MemoryPersistence()) {
			msgBusMqttClient = new MqttClient(broker, clientId, persistence);
			LOGGER.debug("Connecting client {} to broker: {}", clientId, broker);
			msgBusMqttClient.connect(connOpts);
			LOGGER.info("Connected client {}", clientId);
		} catch (MqttException me) {
			LOGGER.error("Not connected due to: {}", me.getMessage(), me);
			status = false;
			throw new IllegalStateException(me);
		}
		status = true;
	}

	public static void sendMessage(String content) {
		sendMessage(outTopic, content);
	}

	public static void sendMessage(String topic, String content) {
		MqttMessage message = null;
		try {
			message = new MqttMessage(mapper.writeValueAsString(content).getBytes(Charset.defaultCharset()));
		} catch (JsonProcessingException e) {
			LOGGER.error("Unable to send a message due to: {}", e.getMessage(), e);
			message = new MqttMessage(content.getBytes(Charset.defaultCharset()));
		}
		message.setQos(qos);
		try {
			LOGGER.debug("Publishing message: {}", content);
			msgBusMqttClient.publish(topic, message);
		} catch (MqttException e) {
			LOGGER.error("Unable to send a message due to: {}", e.getMessage(), e);
			status = false;
			throw new IllegalStateException(e);
		}
		LOGGER.debug("Message published");
	}

	public static void disconnect() {
		try {
			msgBusMqttClient.disconnect();
		} catch (MqttException e) {
			LOGGER.error("Unable to disconnect due to: {}", e.getMessage(), e);
		}
		status = false;
		LOGGER.debug("Disconnected");
	}

	public static IMqttToken subscribeTopics(String... topic) {
		IMqttToken token = null;
		try {
			token = msgBusMqttClient.subscribeWithResponse(topic, new MqttConsumer[] { messageConsumer });
		} catch (MqttException e) {
			LOGGER.error("Unable to subscribe to {} due to: {}",
				Arrays.stream(topic).collect(Collectors.joining(", ", "[", "]")), e.getMessage(), e);
		}
		return token;
	}

	public static void unsubscribeTopics(String... topic) {
		try {
			msgBusMqttClient.unsubscribe(topic);
		} catch (MqttException e) {
			LOGGER.error("Unable to unsubscribe to {} due to: {}",
				Arrays.stream(topic).collect(Collectors.joining(", ", "[", "]")), e.getMessage(), e);
		}
	}

}
