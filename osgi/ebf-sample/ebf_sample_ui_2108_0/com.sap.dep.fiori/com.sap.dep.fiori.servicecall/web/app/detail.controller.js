jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities) {
    DetailControllerBase.extend("dep.fiori.servicecall.app.detail", {
        onInit: function() {
            this.setKey("ID_LOCAL");
            DetailControllerBase.prototype.onInit.apply(this, arguments);
            this.mServiceCall = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mServiceCall);
            this.mEquipment = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mEquipment, "equipment");
            
            this.mResponsibles = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mResponsibles, "responsibles");
        },
        
        loadData: function(sIdLocal) {
            this.loadServiceCall(sIdLocal);
            this.loadEquipment(sIdLocal);
            this.loadResponsibles(sIdLocal);
        },
        
        loadServiceCall: function(sIdLocal) {
            this.mServiceCall.setData({});
            var self = this;
            var sUrl = "/ws_restful_fsm_controller/service_call?ID_LOCAL=" + sIdLocal;
            return Utilities.showBusyIndicator($.ajax(sUrl).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                self.mServiceCall.setData(oResponseData);
            }));
        },
        
        loadEquipment: function(sIdLocal) {
            this.mEquipment.setData([]);
            var self = this;
            var sUrl = "/ws_restful_fsm_controller/service_call_equipment?ID_LOCAL=" + sIdLocal;
            return Utilities.showBusyIndicator($.ajax(sUrl).done(function(aResponseData) {
                self.mEquipment.setData(aResponseData);
            }));
        },
        
        loadResponsibles: function(sIdLocal) {
            this.mResponsibles.setData([]);
            var self = this;
            var sUrl = "/ws_restful_fsm_controller/service_call_responsible?ID_LOCAL=" + sIdLocal;
            return Utilities.showBusyIndicator($.ajax(sUrl).done(function(aResponseData) {
                self.mResponsibles.setData(aResponseData);
            }));
        },
        
        dateFormatter: function(sDate) {
            if (sDate) {
                var oDate = new Date(sDate);
                return Utilities.formatters.formatJSDateTime(oDate);
            }
        }
        
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities));