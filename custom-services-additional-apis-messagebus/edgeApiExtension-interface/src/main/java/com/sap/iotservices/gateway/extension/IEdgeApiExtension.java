package com.sap.iotservices.gateway.extension;

public interface IEdgeApiExtension {

	long getUptime();

	long getDowntime();

	float getNoisePower(float signal, float variance);

}
