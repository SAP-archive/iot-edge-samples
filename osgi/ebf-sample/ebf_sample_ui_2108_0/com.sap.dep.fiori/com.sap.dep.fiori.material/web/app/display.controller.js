jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, DataAccess, Utilities) {
    DetailControllerBase.extend("dep.fiori.material.app.display", {
        onInit: function() {
        	this.setKey([ "WERKS", "MATNR", "LGORT" ]);
            DetailControllerBase.prototype.onInit.apply(this, arguments);
            
            this.mOData = DataAccess.getODataModel("/dep/odata");
            this.getView().setModel(this.mOData, "odata");
    
            this.mMaterial = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mMaterial);
            
            this.mOpenPR = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mOpenPR, "openPR");
            
            this.mOpenPO = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mOpenPO, "openPO");
            
            this.mState = new sap.ui.model.json.JSONModel({ editing: false });
            this.getView().setModel(this.mState, "state");
        },
    
        onRouteMatched: function(oEvent) {
            if (oEvent.getParameter("name") === "display") {
                var oArgs = oEvent.getParameter("arguments");
                this.loadLookupData(oArgs.LGORT);
                this.loadMaterial(oArgs.WERKS, oArgs.LGORT, oArgs.MATNR);
                this.loadOpenPR(oArgs.MATNR);
                this.loadOpenPO(oArgs.MATNR);
            }
        },
        
        loadLookupData: function(sLGORT) {
            var self = this;
            DataAccess.getLookupModel({
                bin: "material_bin?LGORT=" + sLGORT,
                criticality: "material_criticality",
                status: "material_status"
            }).done(function(mLookup) {
                self.getView().setModel(mLookup, "lookup");
            });
        },
        
        loadMaterial: function(sWERKS, sLGORT, sMATNR) {
            this.mMaterial.setData({});
            var sQuery = Utilities.getQueryString({ WERKS: sWERKS, LGORT: sLGORT, MATNR: sMATNR });
            var sUrl = "/ws_restful_data_controller/Materials" + sQuery;

            var self = this;
            $.ajax(sUrl).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }

                self.mMaterial.setData(oResponseData);

            }).fail(function() {
                sap.m.MessageToast.show(self.getText("Error.loadMaterial"), {
                    closeOnBrowserNavigation: false
                });
                self.getRouter().navTo("list", {}, true);
            });
        },
        
        loadOpenPR: function(sMATNR) {
            var sUrl = "/ws_restful_data_controller/material_open_prs?MATNR=" + sMATNR;
            var self = this;
            $.ajax(sUrl).done(function(aResponseData) {
                self.mOpenPR.setData(aResponseData);
            });
        },
        
        loadOpenPO: function(sMATNR) {
            var sUrl = "/ws_restful_data_controller/material_open_pos?MATNR=" + sMATNR;
            var self = this;
            $.ajax(sUrl).done(function(aResponseData) {
                self.mOpenPO.setData(aResponseData);
            });
        },
        
        onSelectPR: function(oEvent) {
            var oBindingContext = oEvent.getParameter("listItem").getBindingContext("openPR");
            var oPurchaseReq = oBindingContext.getModel().getProperty(oBindingContext.getPath());
            Utilities.navToExternal("#depPurchasereq-display&/" + oPurchaseReq.PR_NO_LOCAL);
        },
        
        onSelectPO: function(oEvent) {
            var oBindingContext = oEvent.getParameter("listItem").getBindingContext("openPO");
            var oPurchaseOrder = oBindingContext.getModel().getProperty(oBindingContext.getPath());
            Utilities.navToExternal("#depPurchaseorder-display&/" + oPurchaseOrder.EBELN);
        },
    
        onSave: function(oEvent) {
    
            var self = this;
            this.saveMaterial(this.mMaterial.getData()).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
    
                if (oResponseData.ErrorID) {
                    sap.m.MessageToast.show(self.getText("Error.other", [ oResponseData.ErrorMsg ]));
                } else {
                    sap.m.MessageToast.show(self.getText("Save.success"));
                    self.mState.setProperty("/editing", false);
                }
            }).fail(function() {
                sap.m.MessageToast.show(self.getText("Error.saveMaterial"));
            });
        },
    
        saveMaterial: function(oRequestData) {
            return Utilities.showBusyIndicator($.ajax({
                url: "/ws_restful_data_controller/materials",
                method: "PUT",
                data: JSON.stringify([ oRequestData ])
            }));
        },
    
        onBinValueHelp: function(oEvent) {
            if (!this.oBinValueHelp) {
                // Generate fragment IDs as if they were part of the view itself
                var sPrefix = this.getView().createId("").replace("--", "");
                this.oBinValueHelp = sap.ui.xmlfragment(sPrefix, "dep.fiori.material.app.binValueHelp", this);
                this.getView().addDependent(this.oBinValueHelp);
            }
            this.oBinValueHelp.open();
        },
    
        onBinSearch: function(oEvent) {
            var oList = this.getView().byId("binList");
            var oBinding = oList.getBinding("items");
    
            var sQuery = oEvent.getParameter("query");
            oBinding.filter(
                new sap.ui.model.Filter(
                    "LGPBE",
                    sap.ui.model.FilterOperator.StartsWith,
                    sQuery
                )
            );
        },
    
        onBinSelect: function(oEvent) {
            var oLGPBE = oEvent.getParameter("listItem").data("itemKey");
            this.mMaterial.setProperty("/LGPBE", oLGPBE);
            this.onBinCancel(oEvent);
        },
    
        onBinCancel: function(oEvent) {
            this.oBinValueHelp.close()
        },
    
        handleResponsivePopoverPress: function(oEvent) {
            jQuery.sap.require("dep.fiori.lib.util.ErrorPopover");
            var aTransactions = this.mMaterial.getProperty("/EDGE_ERRORS").split(',');
            dep.fiori.lib.util.ErrorPopover.openBy(oEvent.getSource(), aTransactions);
        },
        
        onEdit: function(oEvent) {
            this.mState.setProperty("/editing", true);
        },
        
        onCancel: function(oEvent) {
            this.mState.setProperty("/editing", false);
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.Utilities));