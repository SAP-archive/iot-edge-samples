package com.sap.persistenceservice.refapp.certificate;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLException;

import org.apache.commons.lang3.StringUtils;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.ssl.SSLContexts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sap.persistenceservice.refapp.utils.Constants;
import com.sap.persistenceservice.refapp.utils.RefAppEnv;

/**
 * This class contains implementation to load keystore and truststore p12 files path and their passwords from Kubernetes
 * secrets for server/client
 *
 */
public class CertificateConsumer {

    private static final Logger logger = LoggerFactory.getLogger(CertificateConsumer.class);

    private static String clientKeystore;

    private static String clientKeystorePassword;

    private static String clientTrustStore;

    private static String clientTrustStorePassword;

    private CertificateConsumer() {

    }

    // To get the keystore , truststore paths and their corresponding password
    static {

        try {
            // To load client keystore

            String clientKeyStorePath = StringUtils.join(RefAppEnv.CERTIFICATES_DIRECTORY,
                Constants.FILE_SEPARATOR, Constants.CLIENT_KEYSTORE);
            setClientKeystore(clientKeyStorePath);
            setClientKeystorePassword(readFromFile(Constants.CLIENT_KEYSTORE_PASSWORD));

            // To load client truststore
            String clientTrustStorePath = StringUtils.join(RefAppEnv.CERTIFICATES_DIRECTORY,
                Constants.FILE_SEPARATOR, Constants.CLIENT_TRUSTSTORE);
            setClientTrustStore(clientTrustStorePath);
            setClientTrustStorePassword(readFromFile(Constants.CLIENT_TRUSTSTORE_PASSWORD));

        } catch (IOException e) {
            logger.error(" Exception occured while loading trust material {}", e.getMessage());
        }
    }

    /**
     * to get file content from specified location in string format
     *
     * @param fileName
     * @return
     * @throws IOException
     */
    private static String readFromFile(String fileName) throws IOException {
        Path filePath = Paths
            .get(StringUtils.join(RefAppEnv.CERTIFICATES_DIRECTORY, Constants.FILE_SEPARATOR, fileName));
        if (filePath.toFile().exists()) {
            return new String(Files.readAllBytes(filePath));
        }
        return null;
    }

    /**
     * this method returns ssl context for client by loading client keystore and trustore
     *
     * @return
     * @throws SSLException
     * @throws Exception
     */
    public static SSLContext getClientSSLContext() throws SSLException {
        File clientTrustStore = new File(getClientTrustStore());
        File clientKeyStore = new File(getClientKeystore());
        try {
            return SSLContexts.custom()
                .loadTrustMaterial(clientTrustStore, getClientTrustStorePassword().toCharArray(),
                    (cert, authType) -> true)
                .loadKeyMaterial(clientKeyStore, getClientKeystorePassword().toCharArray(),
                    getClientKeystorePassword().toCharArray())
                .build();
        } catch (Exception e) {
            throw new SSLException("Error while creating ssl context for client with reason " + e);
        }

    }

    /**
     * Returns the ssl connection factory
     *
     * @return
     * @throws SSLException
     */
    public static SSLConnectionSocketFactory getSslConnectionFactory() throws SSLException {

        return new SSLConnectionSocketFactory(
            getClientSSLContext(),
            NoopHostnameVerifier.INSTANCE);

    }

    /**
     *
     * @return clientKeystore
     */
    public static String getClientKeystore() {
        return clientKeystore;
    }

    public static void setClientKeystore(String clientKeystore) {
        CertificateConsumer.clientKeystore = clientKeystore;
    }

    /**
     *
     * @return clientKeystorePassword
     */
    public static String getClientKeystorePassword() {
        return clientKeystorePassword;
    }

    public static void setClientKeystorePassword(String clientKeystorePassword) {
        CertificateConsumer.clientKeystorePassword = clientKeystorePassword;
    }

    /**
     *
     * @return clientTrustStore
     */
    public static String getClientTrustStore() {
        return clientTrustStore;
    }

    public static void setClientTrustStore(String clientTrustStore) {
        CertificateConsumer.clientTrustStore = clientTrustStore;
    }

    /**
     *
     * @return clientTrustStorePassword
     */
    public static String getClientTrustStorePassword() {
        return clientTrustStorePassword;
    }

    public static void setClientTrustStorePassword(String clientTrustStorePassword) {
        CertificateConsumer.clientTrustStorePassword = clientTrustStorePassword;
    }

}
