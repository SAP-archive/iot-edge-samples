package com.sap.iot.edgeservices.customhttpserver.http;

import com.fasterxml.jackson.databind.JsonNode;
import com.sap.iot.edgeservices.customhttpserver.helper.RestControllerHelper;
import com.sap.iot.edgeservices.customhttpserver.utils.Configuration;
import org.apache.http.client.HttpClient;
import org.apache.http.conn.ssl.TrustAllStrategy;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.ssl.SSLContextBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.util.ResourceUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import javax.net.ssl.SSLContext;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.util.Base64;

public class RestClient {
    private final RestTemplateBuilder restTemplateBuilder = new RestTemplateBuilder();
    private static final String JKS_FILE = "./{deviceAlternateId}.jks";
    private static final String JKS_PASS_FILE = "./{deviceAlternateId}_pass.txt";
    private static final String DEVICE_ALTERNATE_ID = "{deviceAlternateId}";
    private static final Logger LOG = LoggerFactory.getLogger(RestClient.class);

    @Autowired
    private Configuration configuration;

    @Autowired
    private RestControllerHelper apis;

    public RestClient() {
        super();
    }


    public void init() {
        init("router");
    }

    public void init(String deviceAlternateId) {
        if (!new File(JKS_FILE.replace(DEVICE_ALTERNATE_ID, deviceAlternateId)).exists() ||
                !new File(JKS_PASS_FILE.replace(DEVICE_ALTERNATE_ID, deviceAlternateId)).exists()) {
            String deviceId = apis.getDeviceId(deviceAlternateId);
            if (deviceId == null) {
                LOG.error("Device not found \"{}\"", deviceAlternateId);
            }

            JsonNode certificate = apis.getDeviceCertificate(deviceId);
            if (certificate == null) {
                LOG.error("Certificate not found for device not found \"{}\"", deviceAlternateId);
            }
            try {
                assert certificate != null;
                KeyStore keystore = loadP12ToJKS(certificate.findValues("p12").get(0).asText(),
                        certificate.findValues("secret").get(0).asText().toCharArray(),
                        deviceAlternateId);
                if (keystore == null) {
                    LOG.error("Keystore not initialized correctly");
                }
            } catch (Exception e) {
                LOG.error("Unable to store JKS {} certificate", deviceAlternateId, e);
            }
            LOG.info("Certificates initialized");
        } else {
            LOG.info("Certificates device already initialized");
        }
    }

    public ResponseEntity<String> invokePost(File file, String deviceAlternateId) {
        String url = configuration.getDeviceConnectivityUrlUnproxed() + "/iot/files/" + deviceAlternateId + "/" + file.getName();
        ResponseEntity<String> responseEntityStr = null;
        //TODO reenable once router certificates are working = only one resttemplate instance
        //if (restTemplate == null) {
        RestTemplate restTemplate = restTemplate(restTemplateBuilder, deviceAlternateId);
        //}

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        try {
            HttpEntity<byte[]> request = new HttpEntity<>(Files.readAllBytes(Paths.get(file.getAbsolutePath())), headers);

            responseEntityStr = restTemplate.
                    postForEntity(url, request, String.class);
            LOG.info("Response: {}", responseEntityStr);
            LOG.info("Response body: {}", responseEntityStr.getBody());
        } catch (Exception e) {
            LOG.error("Unable to send request", e);
            responseEntityStr = ResponseEntity.badRequest().body(e.getMessage());
        }
        return responseEntityStr;
    }

    public RestTemplate restTemplate(RestTemplateBuilder builder, String deviceAlternateId) {
        //TODO reenable once router certificates are working invoke init()
        init(deviceAlternateId);
        try {
            char[] password = new String(Files.readAllBytes(Paths.get(JKS_PASS_FILE.replace(DEVICE_ALTERNATE_ID, deviceAlternateId)))).toCharArray();
            SSLContext sslContext = SSLContextBuilder
                    .create()
                    .loadKeyMaterial(ResourceUtils.getFile(JKS_FILE.replace(DEVICE_ALTERNATE_ID, deviceAlternateId)), password, password)
                    .loadTrustMaterial(TrustAllStrategy.INSTANCE)
                    .build();
            HttpClient client = HttpClients.custom().setSSLContext(sslContext).build();
            return builder
                    .requestFactory(() -> new HttpComponentsClientHttpRequestFactory(client))
                    .build();
        } catch (Exception e) {
            return null;
        }
    }

    public KeyStore loadP12ToJKS(String p12, char[] password, String deviceAlternateId) throws KeyStoreException, IOException, CertificateException, NoSuchAlgorithmException {
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        InputStream is = new ByteArrayInputStream(Base64.getDecoder().decode(p12));
        keyStore.load(is, password);
        // Write out the keystore
        FileOutputStream keyStoreOutputStream =
                new FileOutputStream(JKS_FILE.replace(DEVICE_ALTERNATE_ID, deviceAlternateId));
        keyStore.store(keyStoreOutputStream, password);
        keyStoreOutputStream.close();

        Files.write(Paths.get(JKS_PASS_FILE.replace(DEVICE_ALTERNATE_ID, deviceAlternateId)), new String(password).getBytes());
        return keyStore;
    }
}
