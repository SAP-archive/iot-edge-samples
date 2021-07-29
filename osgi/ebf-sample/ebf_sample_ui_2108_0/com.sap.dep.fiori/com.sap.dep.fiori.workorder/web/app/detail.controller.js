jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities, ErrorPopover) {
    DetailControllerBase.extend("dep.fiori.workorder.app.detail", {
        onInit: function() {
            this.setKey("AUFNR");
            DetailControllerBase.prototype.onInit.apply(this, arguments);

            //this.mOData = dep.fiori.lib.util.DataAccess.getODataModel("/dep/odata");
            this.mOData = new sap.ui.model.json.JSONModel({
                Workorder_Priority: [],
                System_Condition: []
            });
            this.getView().setModel(this.mOData, "odata");

            this.mWorkorder = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mWorkorder);

            this.mCriticality = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mCriticality, "criticality");

            this.mActivity = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mActivity, "activityTypes");

            this.mLock = new sap.ui.model.json.JSONModel({
                acquireLock: this.acquireLock,
                overrideLock: this.overrideLock,
                releaseLock: this.releaseLock
            });
            this.getView().setModel(this.mLock, "lock");

            var self = this;
            $.ajax("/ws_restful_data_controller/workorder_criticality").done(function(aResponseData) {
                aResponseData = aResponseData || [];
                self.mCriticality.setData(aResponseData);
            });

            $.ajax("/ws_restful_data_controller/workorder_priority").done(function(aResponseData) {
                aResponseData = aResponseData || [];
                self.mOData.setProperty("/Workorder_Priority", aResponseData);
            });

            $.ajax("/ws_restful_data_controller/workorder_system_condition").done(function(aResponseData) {
                aResponseData = aResponseData || [];
                self.mOData.setProperty("/System_Condition", aResponseData);
            });
        },
        
        loadData: function(sAUFNR) {
            this.releaseLock();
            this.loadWorkorder(sAUFNR);
        },

        onExit: function(){
            this.releaseLock();
        },

        toList: function(oEvent) {
            this.getRouter().navTo("list");
        },

        toOperations: function(oEvent) {
            var sHash = "#depWorkorderop-display&/" + this.getKeyValue();
            Utilities.navToExternal(sHash);
        },

        loadWorkorder: function(sAUFNR) {
            var sURL = "/ws_restful_data_controller/workorder?AUFNR=" + sAUFNR;

            var self = this;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                self.mWorkorder.setData(oResponseData);
                self.loadActivityTypes(oResponseData.AUART);
            }));
        },

        loadActivityTypes: function(sAUART) {
            this.mActivity.setData([]);
            var sURL = "/ws_restful_data_controller/workorder_activity_type?AUART=" + sAUART;

            var self = this;
            return Utilities.showBusyIndicator($.ajax(sURL).done(function(aResponseData) {
                self.mActivity.setData(aResponseData);
            }));
        },
        
        acquireLock: function(bOverride) {
            var self = this;
            var sAUFNR = this.getView().getModel("AUFNR").getData();
            
            Utilities.showBusyIndicator(
                Utilities.acquireLock("workorder", sAUFNR, bOverride).done(function() {
                    self.getView().getModel("lock").setProperty("/hasLock", true);
                }).fail(function(oResponseData) {
                    if (oResponseData) {
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
                                    self.acquireLock(true);
                                }
                            }
                        });
                    } else {
                        sap.m.MessageToast.show(Utilities.geti18nGlobal("Error.communicationError"));
                    }
                })
            );
        },

        releaseLock: function(oEvent) {
            var self = this;
            Utilities.showBusyIndicator(
                Utilities.releaseLock("workorder").done(function(oResponseData) {
                    self.getView().getModel("lock").setProperty("/hasLock", false);
                })
            );
        },

        handleResponsivePopoverPress: function(oEvent) {
            var aTransactions = this.mWorkorder.getProperty("/EDGE_ERRORS").split(',');
            ErrorPopover.openBy(oEvent.getSource(), aTransactions);
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities, dep.fiori.lib.util.ErrorPopover));