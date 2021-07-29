jQuery.sap.require("sap.m.MessageBox");

sap.ui.controller("dep.fiori.syncoptions.app.change", {

    onInit: function() {
        this.aOptionTypes = ["SYNC_OPTION", "SYNC_USER_OPTION"];

        this.mNewSyncOption = new sap.ui.model.json.JSONModel();
        this.getView().byId("sync-option-new-entry").setModel(this.mNewSyncOption);
        this.mNewSyncOption.setProperty("/OPTION_TYPE", 0);

        this.mSyncOptionList = new sap.ui.model.json.JSONModel();
        this.getView().byId("sync-option-edit-table").setModel(this.mSyncOptionList);

        this.reloadList();
    },

    reloadList: function() {
        var self = this;
        var optionType = this.aOptionTypes[this.mNewSyncOption.getProperty("/OPTION_TYPE")]; 
        jQuery.ajax({
            method: "GET",
            url: "/ws_restful_data_controller/" + optionType,
            success: function(oResponseData) {
                self.mSyncOptionList.setData(oResponseData);
                self.setOldValues();
            }
        });
    },

    setOldValues: function() {
        // used to check if an option has changed values
        var self = this;
        this.mSyncOptionList.getData().forEach(function(currentValue,index) {
            self.mSyncOptionList.getData()[index].OLD_OPTION_VALUE = currentValue.OPTION_VALUE;
        });
    },

    onTypeChange: function(){
        this.reloadList();
    },

    saveNewSyncOption: function(){
        var self = this;

        var syncOption = this.mNewSyncOption.getData();
        var optionType = this.aOptionTypes[this.mNewSyncOption.getProperty("/OPTION_TYPE")];
        jQuery.ajax({
            method: "POST",
            url: "/ws_restful_data_controller/" + optionType,
            headers: {
                OPTION_NAME: syncOption.OPTION_NAME
            },
            dataType: "application/json",
            data: syncOption.OPTION_VALUE,
            complete: function(oResponseData) {
                if (oResponseData.status == "200"){
                    sap.m.MessageBox.success(optionType + " updated successfully", {
                        title: "SUCCESS"
                    });
                    self.reloadList();
                } else {
                    sap.m.MessageBox.error(optionType + " not updated", {
                        title: "ERROR"
                    });
                }
            }
        });
    },

    saveSyncOptions: function() {
        var self = this;
        var aModifiedOptions = [];
        this.mSyncOptionList.getData().forEach(function(currentValue,index) {
            if (currentValue.OPTION_VALUE !== currentValue.OLD_OPTION_VALUE) {
                aModifiedOptions.push(currentValue);
            }
        });
        this.totalModifiedOptions = aModifiedOptions.length;
        this.finishedOptions = 0;
        this.failedOptions = 0;
        this.finishedOptionsResult = "";

        if (this.totalModifiedOptions) {
            aModifiedOptions.forEach(function(currentValue,index) {
                self.sendSyncOption(currentValue);
            });
        } else {
            sap.m.MessageBox.success("No changes to save.");
        }
    },

    sendSyncOption: function(syncOption) {
        var self = this;
        var optionType = this.aOptionTypes[this.mNewSyncOption.getProperty("/OPTION_TYPE")];
        jQuery.ajax({
            method: "POST",
            url: "/dep/odata/" + optionType,
            headers: {
                OPTION_NAME: syncOption.OPTION_NAME
            },
            dataType: "application/json",
            data: syncOption.OPTION_VALUE,
            complete: function(oResponseData) {
                self.updateComplete(syncOption.OPTION_NAME, oResponseData);
            }
        });
    },

    updateComplete : function(optionName, oResponseData) {
        // try to present all of the results in one pop-up
        this.finishedOptions++;

        var response = jQuery.parseJSON(oResponseData.responseText);

        if (response[0].STATUS !== "200") {
            this.failedOptions++;
            this.finishedOptionsResult += optionName + ": " + response[0].ErrorMsg + "\n";
        }

        if (this.finishedOptions === this.totalModifiedOptions) {
            if (this.failedOptions === 0) {
                sap.m.MessageBox.success("All options updated successfully", {
                    title: "SUCCESS"
                });
                this.reloadList();
            }
            else {
                sap.m.MessageBox.error(this.finishedOptionsResult, {
                    title: "ERROR"
                });
            }
        }
    }
});