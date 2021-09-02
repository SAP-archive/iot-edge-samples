package com.sap.persistenceservice.refapp.utils;

import java.io.IOException;

import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class HttpRequestUtil {

    private static final Logger logger = LoggerFactory.getLogger(HttpRequestUtil.class);

    private HttpRequestUtil() {

    }

    /**
     * Returns odata measures
     *
     * @param getRequest
     * @param poolingHttpConnectionManager
     * @return
     */
    public static ResponseEntity<String> getData(HttpGet getRequest,
        PoolingHttpClientConnectionManager poolingHttpConnectionManager) {

        try (CloseableHttpResponse response = HttpClients.custom().setConnectionManager(poolingHttpConnectionManager)
            .build()
            .execute(getRequest)) {
            logger.debug("Response code {} and status {}", response.getStatusLine().getStatusCode(),
                response.getStatusLine().getReasonPhrase());

            String responseEntities = EntityUtils.toString(response.getEntity());
            if (logger.isDebugEnabled()) {
                logger.debug("Response returned : {}", responseEntities);
            }
            return new ResponseEntity<>(responseEntities, HttpStatus.OK);
        } catch (IOException ex) {
            logger.error("Error while making call to the persistence service {}", ex.getMessage());
            return new ResponseEntity<>(ex.getMessage(),
                HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns raw response
     * 
     * @param getRequest
     * @param poolingHttpConnectionManager
     * @return
     */
    public static String getRawData(HttpGet getRequest,
        PoolingHttpClientConnectionManager poolingHttpConnectionManager) {

        String responseEntities = null;

        try (CloseableHttpResponse response = HttpClients.custom().setConnectionManager(poolingHttpConnectionManager)
            .build()
            .execute(getRequest)) {
            responseEntities = EntityUtils.toString(response.getEntity());
            logger.debug("Response code {} and status {}", response.getStatusLine().getStatusCode(),
                response.getStatusLine().getReasonPhrase());

            if (logger.isDebugEnabled()) {
                logger.debug("Response returned : {}", responseEntities);
            }

        } catch (IOException ex) {
            logger.error("Error while making call to the service {}", ex.getMessage());
        }
        return responseEntities;
    }

    /**
     * This method deletes the entity
     *
     * @param deleteRequest
     * @param poolingHttpConnectionManager
     * @return
     */
    public static ResponseEntity<String> delete(HttpDelete deleteRequest,
        PoolingHttpClientConnectionManager poolingHttpConnectionManager) {

        try (CloseableHttpResponse response = HttpClients.custom().setConnectionManager(poolingHttpConnectionManager)
            .build()
            .execute(deleteRequest)) {

            logger.debug("Response code {} and status {}", response.getStatusLine().getStatusCode(),
                response.getStatusLine().getReasonPhrase());
            if (response.getStatusLine().getStatusCode() == 204) {
                return new ResponseEntity<>(HttpStatus.valueOf(response.getStatusLine().getStatusCode()));
            }
            return new ResponseEntity<>(EntityUtils.toString(response.getEntity()),
                HttpStatus.valueOf(response.getStatusLine().getStatusCode()));
        } catch (IOException ex) {
            logger.error("Error while making call to the persistence service {}", ex.getMessage());
            return new ResponseEntity<>(ex.getMessage(),
                HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
