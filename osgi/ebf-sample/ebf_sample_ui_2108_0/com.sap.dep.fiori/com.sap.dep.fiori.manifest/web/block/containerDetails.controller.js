jQuery.sap.require("dep.fiori.lib.controller.DetailBlockControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");

(function(DetailBlockControllerBase, Utilities, DataAccess) {
    DetailBlockControllerBase.extend("dep.fiori.manifest.block.containerDetails", {
        onInit: function() {
            this.setKey("MANIFEST_ID");
            this.setBlockId("containerDetails");

            this.mDetails = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mDetails, "details");

            this.mAttributes = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mAttributes, "attributes");

            this.mStatusList = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mStatusList, "statusList");
            
            this.mEditDetails = new sap.ui.model.json.JSONModel({
                editable: false
            });
            this.getView().setModel(this.mEditDetails, "editDetails");
            this.oPageLayout = this.getView().byId("content");
        },

        loadData: function(sManifestId) {
            this.loadDetails(sManifestId);
            this.loadStatusList();
        },

        loadDetails: function(sManifestId) {
            this.mDetails.setData({});
            var self = this;
            return Utilities.showBusyIndicator($.ajax("/ws_restful_data_controller/manifest_details?MANIFEST_ID=" + sManifestId).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                self.mDetails.setData(oResponseData);
                self.loadAttributes(oResponseData.CONTAINER_ID);
            }));
        },

        loadAttributes: function(sContainerId) {
            this.mAttributes.setData({});
            var self = this;
            return Utilities.showBusyIndicator($.ajax("/ws_restful_data_controller/container_details?CONTAINER_ID=" + sContainerId).done(function(oResponseData) {
                self.mAttributes.setData(oResponseData);
            }));
        },

        loadStatusList: function() {
            this.mStatusList.setData([]);
            var self = this;
            return Utilities.showBusyIndicator($.ajax("/ws_restful_data_controller/container_status_list").done(function(oResponseData) {
                self.mStatusList.setData(oResponseData);
            }));
        },

        refreshList: function(oEvent) {
            this.mAttributes.setData([]);
            var containerId = this.mDetails.getProperty("/CONTAINER_ID");
            Utilities.showBusyIndicator(this.loadAttributes(containerId));
        },

        onEdit: function(oEvent) {
            this.acquireLock();
        },

        onCancel: function(oEvent) {
            this.releaseLock();
        },

        onSave: function(oEvent) {
            var self = this;
            return Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/manifest_details",
                method: "PUT",
                data: this.mDetails.getJSON()
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                } else {
                    self.releaseLock();
                    self.loadDetails(self.mDetails.getProperty("/MANIFEST_ID"));
                }
            }));
        },

        acquireLock: function(oEvent) {
            var sQuery = Utilities.getQueryString({
                OBJ_KEY: this.mDetails.getProperty("/MANIFEST_ID")
            });
            var self = this;
            var oPromise = Utilities.showBusyIndicator($.Deferred());
            $.ajax({
                url: "/ws_restful_lock_controller/manifestdetails" + sQuery,
                method: "POST"
            }).done(function(oResponseData) {
                oResponseData = oResponseData[0];

                if (oResponseData.LOCK_MESSAGE === "OK") {
                    oPromise.resolve();
                } else {
                    jQuery.sap.require("sap.m.MessageBox");
                    sap.m.MessageBox.show(self.getText("ToastMessage.Locked", [ oResponseData.LOCKED_BY_USER ]), {
                        title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.warning"),
                        icon: sap.m.MessageBox.Icon.WARNING,
                        actions: [
                            self.getText("Lock.override"),
                            sap.m.MessageBox.Action.OK
                        ],
                        onClose: function(sAction) {
                            if (sAction === self.getText("Lock.override")) {
                                $.ajax({
                                    url: "/ws_restful_lock_controller/manifestdetails" + sQuery,
                                    method: "PUT"
                                }).done(function() {
                                    oPromise.resolve();
                                }).fail(function() {
                                    sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                                    oPromise.reject();
                                });
                            } else {
                                oPromise.reject();
                            }
                        }
                    });
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                oPromise.reject();
            });
            return oPromise.done(function() {
                self.mEditDetails.setProperty("/editable", true);
                //self.getView().getModel("lock").setProperty("/hasLock", true);
            });
        },

        releaseLock: function(oEvent) {
            var sQuery = Utilities.getQueryString({
                OBJ_KEY: this.mDetails.getProperty("/MANIFEST_ID")
            });
            var self = this;
            return Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_lock_controller/manifestdetails"+ sQuery,
                method: "DELETE"
            }).done(function(oResponseData) {
                self.mEditDetails.setProperty("/editable", false);
            }));
        },

        onExit: function(){
            this.releaseLock();
        }
    });
}(dep.fiori.lib.controller.DetailBlockControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess));