jQuery.sap.require("dep.fiori.lib.controller.DetailBlockControllerBase");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailBlockControllerBase, Utilities, DataAccess) {
    DetailBlockControllerBase.extend("dep.fiori.workorder.block.operations", {
        onInit: function() {
            this.setKey("AUFNR");
            this.setBlockId("operations");
            
            this.mOperations = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mOperations, "operations");

            this.mNewOperation = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mNewOperation, "operation");

            this.mState = new sap.ui.model.json.JSONModel({
                creatingOperation: false
            });
            this.getView().setModel(this.mState, "state");

            this.mAllowOperationDelete = new sap.ui.model.json.JSONModel();
            this.mAllowOperationDelete.setData("N");
            this.getView().setModel(this.mAllowOperationDelete, "allowDelete");

            var self = this;
            $.ajax("/saapconfig/WOAllowOperationDelete").done(function(sAllowDelete) {
                self.mAllowOperationDelete.setData(sAllowDelete);
            }).fail(function() {
                self.mAllowOperationDelete.setData("Y");
            });

            DataAccess.getLookupModel({
                workcenter: "workcenter",
                controlkey: "workorder_operations",
                defaults: "default_values?for_object=workorder"
            }).done(function(mLookup) {
                self.getView().setModel(mLookup, "lookup");
                self.onResetNewOperation();
            });
        },

        loadData: function(sAUFNR) {
            this.mOperations.setData([]);
            Utilities.showBusyIndicator(this.loadOperations(sAUFNR));
            this.onResetNewOperation();
        },

        refresh: function(oEvent) {
            this.mOperations.setData([]);
            Utilities.showBusyIndicator(this.loadOperations(this.getKeyValue()));
        },

        loadOperations: function(sAUFNR) {
            var sURL = "/ws_restful_data_controller/workorder_operations?AUFNR=" + sAUFNR;
            var self = this;
            return $.ajax(sURL).done(function(oResponseData) {
                self.mOperations.setData(oResponseData);
            });
        },

        onNewOperation: function(oEvent) {
            this.mState.setProperty("/creatingOperation", true);
        },

        onCreateOperation: function(oEvent) {
            var oOperation = this.mNewOperation.getData();
            var self = this;

            var promise = Utilities.showBusyIndicator($.Deferred());

            return $.ajax({
                url: "/ws_restful_data_controller/workorder_operations",
                method: "POST",
                data: JSON.stringify([ oOperation ])
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                    promise.reject();
                } else {
                    self.onResetNewOperation(oEvent);
                    self.loadOperations(oOperation.AUFNR).always(function() {
                        promise.resolve();
                    });
                    sap.m.MessageToast.show(self.getText("ToastMessage.CreateOperationSuccess"));
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
                promise.reject();
            });

            return promise;
        },

        onResetNewOperation: function(oEvent) {
            var mLookup = this.getView().getModel("lookup");
            var oDefaults = mLookup ? mLookup.getProperty("/defaults") : {};
            this.mNewOperation.setData({
                AUFNR: this.getKeyValue(),
                LTXA1: "",
                ARBPL: "",
                STEUS: oDefaults.STEUS,
                ISMNW: 0,
                ARBEI: oDefaults.ARBEI,
                DAUNO: 0,
                PREIS: 0,
                WAERS: " ",
                WO_OPNOTE_LTXT: ""
            });
            this.mState.setProperty("/creatingOperation", false);
        },

        onEditOperation: function(oEvent) {
            var oContext = oEvent.getParameter("listItem").getBindingContext("operations");
            var oOperation = oContext.getModel().getProperty(oContext.getPath());
            this.getView().getModel("router").getData().navTo("operation", {
                AUFNR: oOperation.AUFNR,
                VORNR: oOperation.VORNR
            });
        },

        onDeleteOperation: function(oEvent) {
            var oContext = oEvent.getParameter("listItem").getBindingContext("operations");
            var oOperation = oContext.getModel().getProperty(oContext.getPath());

            var self = this;
            jQuery.sap.require("sap.m.MessageBox");
            sap.m.MessageBox.show(this.getText("Operations.confirmDelete", [ oOperation.VORNR ]), {
                title: dep.fiori.lib.util.Utilities.geti18nGlobal("General.warning"),
                icon: sap.m.MessageBox.Icon.WARNING,
                actions: [
                    sap.m.MessageBox.Action.OK,
                    sap.m.MessageBox.Action.CANCEL
                ],
                onClose: function(sAction) {
                    if (sAction === "OK") {
                        self.deleteOperation(oOperation.AUFNR, oOperation.VORNR);
                    }
                }
            });
        },

        deleteOperation: function(sAUFNR, sVORNR) {
            var sQuery = Utilities.getQueryString({
                AUFNR: sAUFNR,
                VORNR: sVORNR
            });

            var self = this;
            return $.ajax({
                url: "/ws_restful_data_controller/workorder_operations" + sQuery,
                method: "DELETE"
            }).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("ToastMessage.OtherError", [ oResponseData.ErrorMsg ]));
                } else {
                    self.loadOperations(sAUFNR);
                    sap.m.MessageToast.show(self.getText("ToastMessage.DeleteOperationSuccess"));
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("ToastMessage.CommunicationError"));
            });
        }
    });
}(dep.fiori.lib.controller.DetailBlockControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.DataAccess));