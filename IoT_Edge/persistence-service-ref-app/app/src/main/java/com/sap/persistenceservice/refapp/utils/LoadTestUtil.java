package com.sap.persistenceservice.refapp.utils;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import org.springframework.util.StringUtils;

import com.sap.persistenceservice.refapp.bean.RetentionLoadTestConfig;
import com.sap.persistenceservice.refapp.entity.LoadTestConfig;
import com.sap.persistenceservice.refapp.exception.PayloadValidationException;
import com.sap.persistenceservice.refapp.iot.model.Capability;
import com.sap.persistenceservice.refapp.iot.model.Device;
import com.sap.persistenceservice.refapp.iot.model.DeviceMessagePojo;
import com.sap.persistenceservice.refapp.iot.model.Property;

public class LoadTestUtil {

    private static final Random random = new Random();

    private LoadTestUtil() {

    }

    public static void validateConfig(LoadTestConfig request) throws PayloadValidationException {

        if (request == null) {
            throw new PayloadValidationException("Invalid request");
        }

        request.setTestName(request.getTestName());

        if (StringUtils.isEmpty(request.getConnectionUrl())) {
            throw new PayloadValidationException("Invalid request. Connection url is mandatory");
        }

        if (request.getDuration() < 1) {
            throw new PayloadValidationException("Invalid request. Duration (in seconds) should be >= 1");
        }

        if (request.getFrequency() < 1) {
            throw new PayloadValidationException("Invalid request. Frequency (msg/second) should be >= 1");
        }

        if (request.getNoOfThreads() < 1) {
            throw new PayloadValidationException("Invalid request. No of Threads >= 1");
        }

        if (request instanceof RetentionLoadTestConfig) {
            if (((RetentionLoadTestConfig) request).getRetentionAfter() <= 0) {
                throw new PayloadValidationException("Invalid request. No of retentionAfter should be >= 1");
            }
        }
    }

    public static DeviceMessagePojo generateMessageForLocalTest(LoadTestConfig request) {
        Capability capability = new Capability();
        capability.setAlternateId(request.getDeviceAlternateId());
        capability.setName(request.getDeviceAlternateId());
        List<Property> propertyList = new ArrayList<>();

        Property property = new Property();
        property.setDataType("string");
        property.setName("test");
        propertyList.add(property);

        capability.setProperties(propertyList);

        return new DeviceMessagePojo(request.getDeviceAlternateId(), request.getDeviceAlternateId(), capability);

    }

    public static LoadTestConfig getTestConfig(RetentionLoadTestConfig retentionConfig) {
        LoadTestConfig config = new LoadTestConfig();
        config.setConnectionUrl(retentionConfig.getConnectionUrl());
        config.setDeviceAlternateId(retentionConfig.getDeviceAlternateId());
        config.setDuration(retentionConfig.getDuration());
        config.setFrequency(retentionConfig.getFrequency());
        config.setTestName(retentionConfig.getTestName());
        return config;
    }

    public static Device getDevice(String deviceAlternateId, List<Device> devices) {
        for (Device device : devices) {
            if (device.getAlternateId().equals(deviceAlternateId)) {
                return device;
            }
        }

        return null;
    }

    // Function select an element base on index
    // and return an element
    public static DeviceMessagePojo getRandomElement(List<DeviceMessagePojo> list) {
        return list.get(random.nextInt(list.size()));
    }

}
