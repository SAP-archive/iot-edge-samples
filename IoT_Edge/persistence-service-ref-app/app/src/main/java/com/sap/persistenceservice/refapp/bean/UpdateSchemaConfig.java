package com.sap.persistenceservice.refapp.bean;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class UpdateSchemaConfig {

    @JsonProperty("resetPassword")
    private String resetPassword;

    public UpdateSchemaConfig() {
        this.resetPassword = "true";
    }

    public UpdateSchemaConfig(String resetPassword) {
        this.resetPassword = resetPassword;
    }

    public String getResetPassword() {
        return resetPassword;
    }

}
