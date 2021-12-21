package com.sap.persistenceservice.refapp.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import javax.annotation.PostConstruct;

import org.apache.http.client.methods.HttpGet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.persistenceservice.refapp.exception.PayloadValidationException;
import com.sap.persistenceservice.refapp.exception.ServiceBindingException;
import com.sap.persistenceservice.refapp.iot.model.Capability;
import com.sap.persistenceservice.refapp.iot.model.CapabilityAssignment;
import com.sap.persistenceservice.refapp.iot.model.Device;
import com.sap.persistenceservice.refapp.iot.model.DeviceMessagePojo;
import com.sap.persistenceservice.refapp.iot.model.Sensor;
import com.sap.persistenceservice.refapp.iot.model.SensorType;
import com.sap.persistenceservice.refapp.utils.HttpRequestUtil;
import com.sap.persistenceservice.refapp.utils.JwtTokenUtil;
import com.sap.persistenceservice.refapp.utils.LoadTestUtil;
import com.sap.persistenceservice.refapp.utils.RefAppEnv;
import com.sap.persistenceservice.refapp.utils.ServiceBindingsUtils;

@Component
public class IotModelService {

    @Autowired
    private ConnectionPoolManager connectionPoolManager;

    @Autowired
    private ObjectMapper objectMapper;

    private List<Device> devices;

    private List<Sensor> sensors;

    private List<SensorType> sensorTypes;

    private List<Capability> capabilities;

    private static final Logger log = LoggerFactory.getLogger(IotModelService.class);

    @PostConstruct
    public void init() {
        getDevices();
        getSensorTypes();
        getCapabilities();
    }

    public List<Device> getDevices() {
        return getDevices(false);
    }

    public List<Device> getDevices(boolean reload) {
        if (devices == null || reload) {
            devices = fetchEntityList("devices", Device[].class);
        }
        return devices;
    }

    public List<Sensor> getSensors() {
        return getSensors(false);
    }

    public List<Sensor> getSensors(boolean reload) {
        if (sensors == null || reload) {
            sensors = fetchEntityList("sensors", Sensor[].class);
        }
        return sensors;
    }

    public List<SensorType> getSensorTypes() {
        return getSensorTypes(false);
    }

    public List<SensorType> getSensorTypes(boolean reload) {
        if (sensorTypes == null || reload) {
            sensorTypes = fetchEntityList("sensorTypes", SensorType[].class);
        }
        return sensorTypes;
    }

    public List<Capability> getCapabilities() {
        return getCapabilities(false);
    }

    public List<Capability> getCapabilities(boolean reload) {
        if (capabilities == null || reload) {
            capabilities = fetchEntityList("capabilities", Capability[].class);
        }
        return capabilities;
    }

    private <T> List<T> fetchEntityList(String entity, Class<T[]> clazz) {
        if (RefAppEnv.LOCAL_TEST) {
            return Collections.emptyList();
        }
        try {
            String url = ServiceBindingsUtils.getEdgeServiceDetails().getUrl() + "/iot/edge/api/v1/" + entity;
            HttpGet httpGet = new HttpGet(url);
            if (RefAppEnv.IS_CUSTOM_EXTENSION) {
                log.info("Setting header for custom extension");
                httpGet.setHeader("Authorization", "Bearer " + JwtTokenUtil.readJwtToken());
            }
            String response = HttpRequestUtil.getRawData(httpGet, connectionPoolManager.getIotConnectionManager());
            return Arrays.asList(objectMapper.readValue(response, clazz));
        } catch (IOException | ServiceBindingException e) {
            log.error("Error while retrieving {}: {} ", entity, e.getMessage());
        }

        return Collections.emptyList();
    }

    public List<DeviceMessagePojo> getDeviceMessages(String deviceAlternateId) throws PayloadValidationException {
        Device loadTestDevice = getDevice(deviceAlternateId);
        List<DeviceMessagePojo> deviceMessagePojo = new ArrayList<>();
        for (Sensor sensor : loadTestDevice.getSensors()) {
            String sensorAlternateId = sensor.getAlternateId();
            String sensorTypeAlternateId = sensor.getSensorTypeAlternateId();

            for (SensorType sensorType : getSensorTypes()) {
                if (sensorType.getAlternateId().equals(sensorTypeAlternateId)) {
                    List<CapabilityAssignment> capabilityAssignments = sensorType.getCapabilities();
                    for (CapabilityAssignment assignment : capabilityAssignments) {

                        for (Capability capability : getCapabilities()) {
                            if (assignment.getId().equals(capability.getId())) {
                                DeviceMessagePojo message = new DeviceMessagePojo(loadTestDevice.getAlternateId(),
                                    sensorAlternateId, capability);
                                deviceMessagePojo.add(message);
                                break;
                            }
                        }

                    }
                }
            }

        }
        return deviceMessagePojo;
    }

    private Device getDevice(String deviceAlternateId) throws PayloadValidationException {
        Device loadTestDevice = LoadTestUtil.getDevice(deviceAlternateId, getDevices());
        if (loadTestDevice == null) {
            // Call the reload method on device before failing
            loadTestDevice = LoadTestUtil.getDevice(deviceAlternateId, getDevices(true));
            if (loadTestDevice == null) {
                throw new PayloadValidationException("Invalid device :" + deviceAlternateId);
            }
        }
        return loadTestDevice;

    }
}
