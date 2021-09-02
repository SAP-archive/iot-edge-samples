package com.sap.persistenceservice.refapp.service;

import javax.annotation.PostConstruct;
import javax.net.ssl.SSLException;

import org.apache.http.HttpHost;
import org.apache.http.config.RegistryBuilder;
import org.apache.http.conn.routing.HttpRoute;
import org.apache.http.conn.socket.ConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.sap.persistenceservice.refapp.certificate.CertificateConsumer;
import com.sap.persistenceservice.refapp.utils.RefAppEnv;

@Component
public class ConnectionPoolManager {

    public static final Logger log = LoggerFactory.getLogger(ConnectionPoolManager.class);

    private PoolingHttpClientConnectionManager poolingHttpConnectionManager;

    @PostConstruct
    public void init() {

        if (RefAppEnv.LOCAL_TEST) {
            poolingHttpConnectionManager = new PoolingHttpClientConnectionManager();
        } else {
            try {
                SSLConnectionSocketFactory socketFactory = CertificateConsumer.getSslConnectionFactory();
                poolingHttpConnectionManager = new PoolingHttpClientConnectionManager(
                    RegistryBuilder.<ConnectionSocketFactory>create()
                        .register("https", socketFactory).build());
            } catch (SSLException ex) {
                log.error("Error while loading ssl context {}", ex.getMessage());
                poolingHttpConnectionManager = new PoolingHttpClientConnectionManager();
            }
        }

        poolingHttpConnectionManager.setMaxTotal(5);
        poolingHttpConnectionManager.setDefaultMaxPerRoute(5);
        HttpHost host = new HttpHost(RefAppEnv.PERSISTENCE_SERVICE_MEASURE_URL);
        poolingHttpConnectionManager.setMaxPerRoute(new HttpRoute(host), 5);
    }

    public PoolingHttpClientConnectionManager getConnectionPoolManager() {
        return poolingHttpConnectionManager;
    }

}
