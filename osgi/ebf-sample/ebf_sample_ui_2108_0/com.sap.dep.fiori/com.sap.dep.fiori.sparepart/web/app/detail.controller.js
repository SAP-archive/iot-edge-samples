jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities) {
    DetailControllerBase.extend("dep.fiori.sparepart.app.detail", {
        onInit: function() {
            this.setKey("PART_ID");
            DetailControllerBase.prototype.onInit.apply(this, arguments);
    
            this.mSparePart = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mSparePart, "sparepart");
        },

        loadData: function(sPartId) {
            this.loadSparePart(sPartId);
        },
        
        loadSparePart: function(sPartId) {
            this.mSparePart.setData({});
            var self = this;
            return Utilities.showBusyIndicator($.ajax("/ws_restful_asset_core_controller/spare_part?PART_ID=" + sPartId).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                self.mSparePart.setData(oResponseData);
            }));
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities));