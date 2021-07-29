jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities) {
    DetailControllerBase.extend("dep.fiori.equipmentmodel.app.detail", {
        onInit: function() {
            this.setKey("MODEL_ID");
            DetailControllerBase.prototype.onInit.apply(this, arguments);
            
            this.mKey = this.getView().getModel(this.getKey());
    
            this.mAttributes = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mAttributes, "attributes");
    
            this.mEquipModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mEquipModel, "equipmodel");
            
            this.mSensors = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mSensors, "sensors");
        },
        
        loadData: function(sModelId) {
            this.loadEquipModel(sModelId);
            this.loadAttributes(sModelId);
            this.loadSensors(sModelId);
        },
        
        loadEquipModel: function(sModelId) {
            this.mEquipModel.setData({});
            var self = this;
            return Utilities.showBusyIndicator($.ajax("/ws_restful_asset_core_controller/equip_model?MODEL_ID=" + sModelId).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                self.mEquipModel.setData(oResponseData);
            }));
        },
    
        loadAttributes: function(sModelId) {
        	this.mAttributes.setData([]);
            var self = this;
            return Utilities.showBusyIndicator($.ajax("/ws_restful_asset_core_controller/equip_model_attribute?MODEL_ID=" + sModelId).done(function(oResponseData) {
                self.mAttributes.setData(oResponseData);
            }));
        },
        
        loadSensors: function(sModelId) {
            this.mSensors.setData([]);
            var self = this;
            return Utilities.showBusyIndicator($.ajax("/ws_restful_asset_core_controller/equip_model_sensors?MODEL_ID=" + sModelId).done(function(oResponseData) {
                self.mSensors.setData(oResponseData);
            }));
        },
        
        refreshAttributes: function(oEvent) {
        	this.loadAttributes(this.mKey.getData());
        },
        
        refreshSensors: function(oEvent) {
            this.loadSensors(this.mKey.getData());
        },
        
        onSensorSelect: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext("sensors");
    
            var oEquipModel = oContext.getModel().getProperty(oContext.getPath());
            this.getRouter().navTo("detail", {
                MODEL_ID: oEquipModel.MODEL_ID,
                block: this.getSelectedBlock()
            });
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
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities));