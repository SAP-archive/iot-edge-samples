jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities) {
    DetailControllerBase.extend("dep.fiori.extenderconfig.app.detail", {
        onInit: function() {
            DetailControllerBase.prototype.onInit.apply(this, arguments);

            this.mOData = dep.fiori.lib.util.DataAccess.getODataModel("/ws_req_fwd_odata");
            this.getView().setModel(this.mOData, "odata");
        },

        loadData: function(sModelId) {
        	// var self = this;
            // return Utilities.showBusyIndicator($.ajax("/ws_req_fwd_odata/").done(function(oResponseData) {
              //   self.mEquipment.setData(oResponseData);
             //}));
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities));