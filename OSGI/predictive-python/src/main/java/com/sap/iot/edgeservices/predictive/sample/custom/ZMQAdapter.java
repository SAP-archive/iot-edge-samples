package com.sap.iot.edgeservices.predictive.sample.custom;

import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.zeromq.SocketType;
import org.zeromq.ZContext;
import org.zeromq.ZMQ;

public class ZMQAdapter {
	private static final Logger LOGGER = LoggerFactory.getLogger(ZMQAdapter.class); // logger
	private static final String SERVER_HELLO_MESSAGE = "hello"; // server hello
	private ZContext context; // zmq context
	private ZMQ.Socket socket; // zmq socket
	private String addressAndPort; // details for tcp connection
	private Process pair; // external process reference

	// Constructor
	ZMQAdapter(String addressAndPort) {
		this.addressAndPort = addressAndPort;
		try {
			// Socket to talk to clients
			context = new ZContext();
			initSocket();
		} catch (Exception e) {
			LOGGER.error("Unable to initialize correctly messagebus connection due to {}", e.getMessage(), e);
		}
	}

	/**
	 * Init socket
	 */
	private void initSocket() {
		if (context != null) {
			socket = context.createSocket(SocketType.REQ);
			socket.setReceiveTimeOut(10000);
			socket.connect("tcp://" + addressAndPort);
		} else {
			LOGGER.error("No context for the socket");
		}
	}

	/**
	 * Close entirely connection and server
	 */
	void closeZmqContext() {
		// close existing socket
		closeSocket();
		// close external process
		if (pair != null) {
			pair.destroyForcibly();
		}
	}

	/**
	 * Close the socket connection
	 */
	void closeSocket() {
		if (socket != null) {
			socket.disconnect("tcp://" + addressAndPort);
			socket.close();
			socket = null;
		}
	}

	/**
	 * @return received message from the socket
	 */
	String receive() {
		String message = null;
		if (socket != null) {
			byte[] reply = socket.recv(0);
			message = new String(reply, ZMQ.CHARSET);
			LOGGER.debug("Received: [{}]", message);
		} else {
			LOGGER.error("Socket not initialized");
		}
		return message;
	}

	/**
	 * @param measurement
	 *            parameter to be sent to the server
	 */
	void send(String measurement) {
		if (!StringUtils.isEmpty(measurement) && socket != null) {
			socket.send(measurement.getBytes(ZMQ.CHARSET), 0);
			LOGGER.debug("Sent: [{}]", measurement);
		} else {
			LOGGER.error("Socket not initialized");
		}
	}

	/**
	 * Ping the process is responding in the messagebus or start an external process
	 * 
	 * @param process
	 *            command to be sent to start the process (platform dependent)
	 * @param args
	 *            arguments to start the process
	 * @return process started
	 */
	boolean runPair(String process, String args) {
		boolean started = false;
		try {
			started = checkHello();
		} catch (Exception e) {
			LOGGER.debug("Server not responding: {}", e.getMessage(), e);
			try {
				pair = new ProcessBuilder(process, args).start();
				// wait process started
				if (pair.isAlive()) {
					Thread.sleep(10000);
				}
				started = checkHello();
			} catch (Exception ex) {
				LOGGER.error("Unable to start external process: {}", ex.getMessage(), ex);
			}
		}
		return started;
	}

	/**
	 * @return the response for the hello server
	 */
	private boolean checkHello() {
		send(SERVER_HELLO_MESSAGE);
		String msg = receive();
		if (msg.isEmpty() || !msg.contentEquals(SERVER_HELLO_MESSAGE)) {
			return false;
		}
		LOGGER.debug("Server response: {}", msg);
		return true;
	}
}
