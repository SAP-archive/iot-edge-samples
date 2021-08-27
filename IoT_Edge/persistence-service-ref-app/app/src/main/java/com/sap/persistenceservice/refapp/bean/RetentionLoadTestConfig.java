package com.sap.persistenceservice.refapp.bean;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sap.persistenceservice.refapp.entity.LoadTestConfig;

public class RetentionLoadTestConfig extends LoadTestConfig {

    /**
     * 
     */
    private static final long serialVersionUID = 1L;

    @JsonProperty("retentionAfter")
    private int retentionAfter;

    public int getRetentionAfter() {
        return retentionAfter;
    }

    public void setRetentionAfter(int retentionAfter) {
        this.retentionAfter = retentionAfter;
    }

}
