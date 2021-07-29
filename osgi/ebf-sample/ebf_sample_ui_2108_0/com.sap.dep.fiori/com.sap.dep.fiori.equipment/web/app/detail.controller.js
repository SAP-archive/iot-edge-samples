jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities) {
    DetailControllerBase.extend("dep.fiori.equipment.app.detail", {
        onInit: function() {
            this.setKey("EQUNR");
            DetailControllerBase.prototype.onInit.apply(this, arguments);
            
            this.mKey = this.getView().getModel(this.getKey());
            
            this.mEquipment = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mEquipment, "equipment");
            
            this.mSensors = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mSensors, "sensors");
            
            this.mWorkorders = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mWorkorders, "workorders");
            
            this.mAttributes = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mAttributes, "attributes");
        },
        
        loadData: function(sEQUNR) {
            this.loadEquipment(sEQUNR);
            this.loadSensors(sEQUNR);
            this.loadWorkorders(sEQUNR);
            this.loadAttributes(sEQUNR);
        },
        
        loadEquipment: function(sEQUNR) {
            this.mEquipment.setData({});
            var self = this;
            return Utilities.showBusyIndicator($.ajax("/ws_restful_data_controller/equipment?EQUNR=" + sEQUNR).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                self.mEquipment.setData(oResponseData);
            }));
        },
        
        loadSensors: function(sEQUNR) {
            this.mSensors.setData([]);
            var self = this;
            return Utilities.showBusyIndicator($.ajax("/ws_restful_asset_core_controller/equip_sensors?EQUNR=" + sEQUNR).done(function(oResponseData) {
                self.mSensors.setData(oResponseData);
            }));
        },

        loadWorkorders: function(sEQUNR) {
            this.mWorkorders.setData([]);
            var self = this;
            return Utilities.showBusyIndicator($.ajax("/ws_restful_data_controller/workorders_for_equipment?EQUNR=" + sEQUNR).done(function(oResponseData) {
                self.mWorkorders.setData(oResponseData);
            }));
        },
        
        loadAttributes: function(sEQUNR) {
            this.mAttributes.setData([]);
            var self = this;
            return Utilities.showBusyIndicator($.ajax("/ws_restful_asset_core_controller/equip_attribute?EQUNR=" + sEQUNR).done(function(oResponseData) {
                self.mAttributes.setData(oResponseData);
            }));
        },

        refreshSensors: function(oEvent) {
            this.loadSensors(this.mKey.getData());
        },

        refreshWorkorders: function(oEvent) {
            this.loadWorkorders(this.mKey.getData());
        },
        
        refreshAttributes: function(oEvent) {
            this.loadAttributes(this.mKey.getData());
        },

        onSensorSelect: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oEquip = oListItem.getBindingContext("sensors").getObject();
            this.getRouter().navTo("detail", {
                EQUNR: oEquip.EQUNR,
                block: this.getSelectedBlock()
            });
        },
        
        onWorkOrderPress: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oWorkOrder = oListItem.getBindingContext("workorders").getObject();
            var sHash = "#depWorkorder-display&/" + oWorkOrder.AUFNR + "/detail";
            Utilities.navToExternal(sHash);
        },
        
        attributeValueFormatter: function(sDataType, sValue1, sValue2) {
            var sValue;
            switch (sDataType) {
                case "PICTURE":
                    sValue = sValue2;
                    break;
                default:
                    sValue = sValue1;
                    break;
            }
            return sValue;
        },
        
        attributeSourceFormatter: function(oContext) {
            var oObject = oContext.getModel().getProperty(oContext.getPath());
            var sSource;
            switch (oObject.SOURCE) {
                case "EQUIP":
                    sSource = this.getText("Attribute.sourceEquipment");
                    break;
                case "MODEL":
                    sSource = this.getText("Attribute.sourceModel")
                    break;
                default:
                    sSource = "";
                    break;
            }
            return sSource;
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities));