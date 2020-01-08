/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Copyright (c) 2020 SAP SE or an affiliate company. All rights reserved.
 * The sample is not intended for production use.  Provided "as is".
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
package com.sap.iot.edgeservices.predictive.sample.utilities;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DataStreamer {

	private static final Logger LOGGER = LoggerFactory.getLogger(DataStreamer.class); // logger
	// packet format for IOTService
	private static final String IOTS_PACKET_FORMAT = "{\"sensorTypeAlternateId\":\"%s\",\"capabilityAlternateId\":\"%s\",\"sensorAlternateId\":\"%s\",\"measures\":[%s]}";

	// constructor
	private DataStreamer() {
		super();
	}

	// send the results back into IOTS using a different sensorType/capability for processing again
	public static void streamResults(boolean isCloudEdge, String measuresUrl, String device,
		String sensorTypeAlternateId, String capabilityAlternateId, String sensorAlternateId, Map<String, ?> val) {
		if (!isCloudEdge) {
			LOGGER.debug("On-premise version is not sending data to SAP Cloud Platform Internet of Things");
			return;
		}
		if (val == null || val.size() == 0) {
			LOGGER.error("No value to send");
		} else {
			LOGGER.info("Sending data to streaming... {}{}", measuresUrl, device);
			// obtain a json string
			String jsonVal = mapToJsonString(val);
			// format the payload
			String jsonPayload = String.format(IOTS_PACKET_FORMAT, sensorTypeAlternateId, capabilityAlternateId,
				sensorAlternateId, jsonVal);

			LOGGER.info("Sending data: {}", jsonPayload);
			byte[] byteArrayPayload = jsonPayload.getBytes(StandardCharsets.UTF_8);
			int payloadLength = byteArrayPayload.length;

			try {
				// create a connection to IOTS
				URL url = new URL(measuresUrl + device);
				URLConnection con = url.openConnection();
				HttpURLConnection http = (HttpURLConnection) con;

				// set the properties of the post
				http.setRequestMethod("POST"); // PUT is another valid option
				http.setDoOutput(true);
				http.setFixedLengthStreamingMode(payloadLength);
				http.setRequestProperty("Content-Type", "application/json; charset=UTF-8");

				// connect and send data
				http.connect();
				try (OutputStream os = http.getOutputStream()) {
					os.write(byteArrayPayload);
				}
			} catch (Exception e) {
				LOGGER.error("Could not stream transformed results back to streaming: {}", e.getMessage(), e);
			}
		}
	}

	// send the results back into IOTS using a different sensorType/capability for processing again
	public static void streamResult(boolean isCloudEdge, String measuresUrl, String device,
		String sensorTypeAlternateId, String capabilityAlternateId, String sensorAlternateId, Float val) {
		if (!isCloudEdge) {
			LOGGER.debug("On-premise version is not sending data to SAP Cloud Platform Internet of Things");
			return;
		}
		if (val == null) {
			LOGGER.error("No value to send");
		} else {
			LOGGER.info("Sending data to streaming... {}{}", measuresUrl, device);

			// format the payload
			String jsonPayload = String.format(IOTS_PACKET_FORMAT, sensorTypeAlternateId, capabilityAlternateId,
				sensorAlternateId, "[" + val + "]");

			LOGGER.info("Sending data: {}", jsonPayload);
			byte[] byteArrayPayload = jsonPayload.getBytes(StandardCharsets.UTF_8);
			int payloadLength = byteArrayPayload.length;

			try {
				// create a connection to IOTS
				URL url = new URL(measuresUrl + device);
				URLConnection con = url.openConnection();
				HttpURLConnection http = (HttpURLConnection) con;

				// set the properties of the post
				http.setRequestMethod("POST"); // PUT is another valid option
				http.setDoOutput(true);
				http.setFixedLengthStreamingMode(payloadLength);
				http.setRequestProperty("Content-Type", "application/json; charset=UTF-8");

				// connect and send data
				http.connect();
				try (OutputStream os = http.getOutputStream()) {
					os.write(byteArrayPayload);
				}
			} catch (Exception e) {
				LOGGER.error("Could not stream transformed results back to streaming: {}", e.getMessage(), e);
			}
		}
	}

	private static String mapToJsonString(Map<String, ?> doubles) {
		String json = "{";
		List<String> tmpJson = new ArrayList<>(doubles.size());
		// Convert single string
		for (Map.Entry<String, ?> val : doubles.entrySet()) {
			String jsonEntry = "\"";
			// escape the invalid characters and remove the unsupported chars
			jsonEntry += val.getKey().replaceAll("\"", "\\\"").replaceAll("[(]", "").replaceAll("[)]", "");
			jsonEntry += "\":\"";
			jsonEntry += doubles.get(val.getKey());
			jsonEntry += "\"";
			tmpJson.add(jsonEntry);
		}
		json += String.join(",", tmpJson);
		json += "}";
		return json;
	}
}
