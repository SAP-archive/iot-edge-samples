package com.sap.persistenceservice.refapp.utils;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sap.persistenceservice.refapp.bean.ServiceBinding;
import com.sap.persistenceservice.refapp.bean.ServiceBindingDetails;
import com.sap.persistenceservice.refapp.exception.ServiceBindingException;

public class ServiceBindingsUtils {

    private ServiceBindingsUtils() {

    }

    static List<ServiceBindingDetails> serviceBindingDetails = null;

    static ObjectMapper mapper = new ObjectMapper();

    static Map<String, Object> serviceBindingInfoCache = new HashMap<>();

    public static String getPersistenceServiceRestUrl() throws IOException, ServiceBindingException {
        if (!serviceBindingInfoCache.containsKey(Constants.PERSISTENCE_SERVICES_URL)) {
            ServiceBindingDetails bindingDetails = ServiceBindingsUtils.getPersistenceServiceDetails();
            serviceBindingInfoCache.put(Constants.PERSISTENCE_SERVICES_URL, bindingDetails.getUrl());
        }
        return (String) serviceBindingInfoCache.get(Constants.PERSISTENCE_SERVICES_URL);
    }

    public static List<ServiceBindingDetails> getServiceBindings() throws IOException {
        if (serviceBindingDetails == null) {
            ServiceBinding serviceBinding = mapper.readValue(RefAppEnv.SERVICE_BINDINGS, ServiceBinding.class);
            serviceBindingDetails = serviceBinding.getBindings();
        }
        return serviceBindingDetails;
    }

    public static ServiceBindingDetails getPersistenceServiceDetails() throws IOException, ServiceBindingException {
        if (!serviceBindingInfoCache.containsKey(Constants.PERSISTENCE_REST_SERVICE_BINDINGS)) {
            List<ServiceBindingDetails> serviceBindingDetails = getServiceBindings();

            ServiceBindingDetails persistenceServiceBinding = null;

            for (ServiceBindingDetails bindingDetails : serviceBindingDetails) {
                if (bindingDetails.getType().equalsIgnoreCase(Constants.SERVICE_TYPE_REST)
                    && bindingDetails.getUrl().contains("persistence-service")) {
                    persistenceServiceBinding = bindingDetails;
                    break;
                }
            }

            if (persistenceServiceBinding == null) {
                throw new ServiceBindingException("Could not find service bindings for Persistence Service ");
            }

            if (StringUtils.isBlank(persistenceServiceBinding.getUrl())) {
                throw new ServiceBindingException("Could not find URL for Persistence Service ");
            }
            serviceBindingInfoCache.put(Constants.PERSISTENCE_REST_SERVICE_BINDINGS,
                persistenceServiceBinding);
        }
        return (ServiceBindingDetails) serviceBindingInfoCache.get(Constants.PERSISTENCE_REST_SERVICE_BINDINGS);
    }

    public static ServiceBindingDetails getEdgeServiceDetails() throws ServiceBindingException, IOException {

        if (!serviceBindingInfoCache.containsKey(Constants.EDGE_GATEWAY_REST_SERVICE_BINDINGS)) {
            List<ServiceBindingDetails> serviceBindingDetails = getServiceBindings();

            ServiceBindingDetails edgeGateway = null;

            for (ServiceBindingDetails bindingDetails : serviceBindingDetails) {
                if (bindingDetails.getType().equalsIgnoreCase(Constants.SERVICE_TYPE_REST)
                    && bindingDetails.getUrl().contains("edge-gateway")) {
                    edgeGateway = bindingDetails;
                    break;
                }
            }

            if (edgeGateway == null) {
                throw new ServiceBindingException("Could not find service bindings for edge gateway ");
            }

            if (StringUtils.isBlank(edgeGateway.getUrl())) {
                throw new ServiceBindingException("Could not find URL for Persistence Service ");
            }
            serviceBindingInfoCache.put(Constants.EDGE_GATEWAY_REST_SERVICE_BINDINGS,
                edgeGateway);
        }
        return (ServiceBindingDetails) serviceBindingInfoCache.get(Constants.EDGE_GATEWAY_REST_SERVICE_BINDINGS);
    }
}
