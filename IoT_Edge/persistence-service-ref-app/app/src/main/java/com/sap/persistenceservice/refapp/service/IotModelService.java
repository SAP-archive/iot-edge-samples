package com.sap.persistenceservice.refapp.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
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

        if (RefAppEnv.LOCAL_TEST) {
            return;
        }

        try {
            String baseUrl = ServiceBindingsUtils.getEdgeServiceDetails().getUrl() + "/iot/edge/api/v1/devices";
            HttpGet deviceRequest = new HttpGet(baseUrl);
            String deviceResponse = HttpRequestUtil.getRawData(deviceRequest,
                connectionPoolManager.getConnectionPoolManager());
            devices = Arrays.asList(objectMapper.readValue(deviceResponse, Device[].class));
        } catch (IOException | ServiceBindingException ex) {
            log.error("Error while retrieving devices ", ex);
        }

        try {
            String baseUrl = ServiceBindingsUtils.getEdgeServiceDetails().getUrl() + "/iot/edge/api/v1/sensors";
            HttpGet sensorRequest = new HttpGet(baseUrl);
            String sensorResponse = HttpRequestUtil.getRawData(sensorRequest,
                connectionPoolManager.getConnectionPoolManager());
            sensors = Arrays.asList(objectMapper.readValue(sensorResponse, Sensor[].class));
        } catch (IOException | ServiceBindingException ex) {
            log.error("Error while retrieving sensors ", ex);
        }

        try {
            String baseUrl = ServiceBindingsUtils.getEdgeServiceDetails().getUrl() + "/iot/edge/api/v1/sensorTypes";
            HttpGet sensorTypeRequest = new HttpGet(baseUrl);
            String sensorTypeResponse = HttpRequestUtil.getRawData(sensorTypeRequest,
                connectionPoolManager.getConnectionPoolManager());
            sensorTypes = Arrays.asList(objectMapper.readValue(sensorTypeResponse, SensorType[].class));
        } catch (IOException | ServiceBindingException ex) {
            log.error("Error while retrieving sensor types ", ex);
        }

        try {
            String baseUrl = ServiceBindingsUtils.getEdgeServiceDetails().getUrl() + "/iot/edge/api/v1/capabilities";
            HttpGet capabilityRequest = new HttpGet(baseUrl);
            String capabilityResponse = HttpRequestUtil.getRawData(capabilityRequest,
                connectionPoolManager.getConnectionPoolManager());
            capabilities = Arrays.asList(objectMapper.readValue(capabilityResponse, Capability[].class));
        } catch (IOException | ServiceBindingException ex) {
            log.error("Error while retrieving capabilities ", ex);
        }

    }

    public List<DeviceMessagePojo> getDeviceMessages(String deviceAlternateId) throws PayloadValidationException {
        Device loadTestDevice = getDevice(deviceAlternateId);
        List<DeviceMessagePojo> deviceMessagePojo = new ArrayList<>();
        List<Sensor> sensors = loadTestDevice.getSensors();
        for (Sensor sensor : sensors) {
            String sensorAlternateId = sensor.getAlternateId();
            String sensorTypeAlternateId = sensor.getSensorTypeAlternateId();

            List<SensorType> sensorTypes = getSensorTypes();

            for (SensorType sensorType : sensorTypes) {
                if (sensorType.getAlternateId().equals(sensorTypeAlternateId)) {
                    List<CapabilityAssignment> capabilityAssignments = sensorType.getCapabilities();
                    for (CapabilityAssignment assignment : capabilityAssignments) {

                        List<Capability> capabilities = getCapabilities();
                        for (Capability capability : capabilities) {
                            if (assignment.getId().equals(capability.getId())) {
                                DeviceMessagePojo message = new DeviceMessagePojo(loadTestDevice.getAlternateId(),
                                    sensorAlternateId,
                                    capability);
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

    public List<Device> getDevices() {
        return devices;
    }

    public List<Sensor> getSensors() {
        return sensors;
    }

    public List<SensorType> getSensorTypes() {
        return sensorTypes;
    }

    public List<Capability> getCapabilities() {
        return capabilities;
    }

    private Device getDevice(String deviceAlternateId) throws PayloadValidationException {
        Device loadTestDevice = LoadTestUtil.getDevice(deviceAlternateId, getAllDevices(false));
        if (loadTestDevice == null) {
            // Call the reload method on device before failing
            loadTestDevice = LoadTestUtil.getDevice(deviceAlternateId, getAllDevices(true));
            if (loadTestDevice == null) {
                throw new PayloadValidationException("Invalid device :" + deviceAlternateId);
            }
        }
        return loadTestDevice;

    }

    /**
     * This method returns the devices based on the reload
     * 
     * @param reload
     * @return
     */
    private List<Device> getAllDevices(boolean reload) {
        if (reload) {
            init();
        }

        return getDevices();
    }
}
