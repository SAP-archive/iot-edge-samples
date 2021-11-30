package com.sap.persistenceservice.refapp.service;

import javax.annotation.PostConstruct;

import org.apache.http.HttpHost;
import org.apache.http.conn.routing.HttpRoute;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.sap.persistenceservice.refapp.utils.RefAppEnv;

@Component
public class ConnectionPoolManager {

    public static final Logger log = LoggerFactory.getLogger(ConnectionPoolManager.class);

    private PoolingHttpClientConnectionManager poolingHttpConnectionManager;

    private PoolingHttpClientConnectionManager iotPoolingHttpConnectionManager;

    @PostConstruct
    public void init() {
        poolingHttpConnectionManager = new PoolingHttpClientConnectionManager();
        poolingHttpConnectionManager.setMaxTotal(5);
        poolingHttpConnectionManager.setDefaultMaxPerRoute(5);
        HttpHost host = new HttpHost(RefAppEnv.PERSISTENCE_SERVICE_MEASURE_URL);
        poolingHttpConnectionManager.setMaxPerRoute(new HttpRoute(host), 5);

        log.info("Preparing iot connection manager");
        iotPoolingHttpConnectionManager = new PoolingHttpClientConnectionManager();
        iotPoolingHttpConnectionManager.setMaxTotal(5);
        iotPoolingHttpConnectionManager.setDefaultMaxPerRoute(5);
        HttpHost host1 = new HttpHost("http://edge-gateway-service.sap-iot-gateway:61660");
        iotPoolingHttpConnectionManager.setMaxPerRoute(new HttpRoute(host1), 5);
    }

    public PoolingHttpClientConnectionManager getConnectionPoolManager() {
        return poolingHttpConnectionManager;
    }

    public PoolingHttpClientConnectionManager getIotConnectionManager() {
        return iotPoolingHttpConnectionManager;
    }
}
