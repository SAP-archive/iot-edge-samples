package com.sap.persistenceservice.refapp.task;

import org.apache.http.client.methods.HttpDelete;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sap.persistenceservice.refapp.service.ConnectionPoolManager;
import com.sap.persistenceservice.refapp.utils.HttpRequestUtil;
import com.sap.persistenceservice.refapp.utils.MessageUtil;
import com.sap.persistenceservice.refapp.utils.RefAppEnv;

public class RetentionTriggerTask implements Runnable {

    private static final Logger log = LoggerFactory.getLogger(RetentionTriggerTask.class);

    private int deleteCall;
    private ConnectionPoolManager connectionPoolManager;

    public RetentionTriggerTask(int deleteCall, ConnectionPoolManager connectionPoolManager) {
        this.deleteCall = deleteCall;
        this.connectionPoolManager = connectionPoolManager;
    }

    @Override
    public void run() {

        while (true) {
            if (MessageUtil.getInstance().getMessageCounter() >= deleteCall) {
                log.info("Retention task triggered after sending {} messages",
                    MessageUtil.getInstance().getMessageCounter());
                String url = RefAppEnv.PERSISTENCE_SERVICE_MEASURE_URL + "retention/cleanUp";
                HttpRequestUtil.delete(new HttpDelete(url), connectionPoolManager.getConnectionPoolManager());
                break;
            }
        }
    }

}
