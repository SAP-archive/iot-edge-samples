package com.sap.iotservices.gateway.extension.impl;

import java.lang.management.ManagementFactory;
import java.util.Date;
import java.util.Random;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sap.iotservices.gateway.extension.IEdgeApiExtension;

import oshi.SystemInfo;

@Component(immediate = true, service = IEdgeApiExtension.class)
public class EdgeApiExtension
implements IEdgeApiExtension {

	private static final Logger LOGGER = LoggerFactory.getLogger(EdgeApiExtension.class);
	Random r = new java.util.Random();

	@Activate
	public void startService() {
		LOGGER.info("Starting Edge API Extension service");
	}

	@Deactivate
	public void stopService() {
		LOGGER.info("Stopping Edge API Extension service");
	}

	@Override
	public long getUptime() {
		Date now = new Date();
		return (now.getTime() - ManagementFactory.getRuntimeMXBean().getStartTime()) / 1000;
	}

	@Override
	public long getDowntime() {
		long uptime = getUptime();
		return new SystemInfo().getOperatingSystem().getSystemUptime() - (uptime / 1000);
	}

	@Override public float getNoisePower(float signal, float variance) {
		double noise = r.nextGaussian() * Math.sqrt(variance) + signal;
		return (float) noise;
	}
}
