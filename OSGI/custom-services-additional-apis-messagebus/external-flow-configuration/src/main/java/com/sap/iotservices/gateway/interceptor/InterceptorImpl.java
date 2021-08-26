package com.sap.iotservices.gateway.interceptor;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sap.iotservices.hooks.gateway.IGatewayInterceptor;
import com.sap.iotservices.hooks.gateway.IoTServicesPointcut;
import com.sap.iotservices.network.node.data.Value;
import com.sap.iotservices.network.node.data.WSNParsedMeasure;

public class InterceptorImpl
implements IGatewayInterceptor {

	private static final Logger log = LoggerFactory.getLogger(InterceptorImpl.class);

	@Override
	public void processObject(String pointcutName, Object... args) {
		try {
			IoTServicesPointcut pointcut = IoTServicesPointcut.valueOf(pointcutName);
			switch (pointcut) {
			case GATEWAY_PARSED_DATA_DISPATCH:
				// triggered upon dispatch of parsed sensor data
				if (!ExternalFlowActivator.isIngestionEnabled()) {
					manageIncomingMeasures(args);
				}
				break;
			case GATEWAY_GENERIC_COMMAND:
				break;
			default:
				break;
			}
		} catch (Exception e) {
			log.error(e.getMessage(), e);
		}
	}

	@Override
	public List<String> getBranchPoints() {
		List<String> list = new ArrayList<>();
		list.add(IoTServicesPointcut.GATEWAY_PARSED_DATA_DISPATCH.name());
		list.add(IoTServicesPointcut.GATEWAY_GENERIC_COMMAND.name());
		return list;
	}

	@Override
	public void onError(Object event, String pointcut, Exception e) {
		log.info("OnError triggered; pointcut is {}", pointcut);
	}

	// Go through measure list
	private void manageIncomingMeasures(Object... args) {
		@SuppressWarnings("unchecked")
		List<WSNParsedMeasure> measures = (List<WSNParsedMeasure>) args[0];
		// list of measures that are going to be dropped
		List<WSNParsedMeasure> toBeRemoved = new ArrayList<>();

		if (measures != null) {
			for (WSNParsedMeasure wsnParsedMeasure : measures) {
				List<Value<?>> valueList = wsnParsedMeasure.getValues();
				for (int i = 0; i < valueList.size(); i++) {
					toBeRemoved.add(wsnParsedMeasure);
				}
			}

			// final filtering of list when measures are dropped
			for (WSNParsedMeasure wsnParsedMeasure : toBeRemoved) {
				measures.remove(wsnParsedMeasure);
				log.info("Measure for Capability {}, Device {} and Sensor {} will be dropped",
					wsnParsedMeasure.getCapabilityAlternateId(), wsnParsedMeasure.getDeviceAlternateId(),
					wsnParsedMeasure.getSensorAlternateId());
			}
		}
	}
}
