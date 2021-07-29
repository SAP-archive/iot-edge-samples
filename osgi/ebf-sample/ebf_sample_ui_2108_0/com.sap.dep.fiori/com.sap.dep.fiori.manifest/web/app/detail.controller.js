jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities) {
    DetailControllerBase.extend("dep.fiori.manifest.app.detail", {
        onInit: function() {
            this.setKey("MANIFEST_ID");
            DetailControllerBase.prototype.onInit.apply(this, arguments);
            this.mKey = this.getView().getModel(this.getKey());

            this.mDetails = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mDetails, "details");

            this.mHistory = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mHistory, "history");
        },

        loadData: function(sManifestId) {
            this.loadDetails(sManifestId);
            this.loadHistory(sManifestId);
        },

        loadDetails: function(sManifestId) {
            this.mDetails.setData({});
            var self = this;
            return Utilities.showBusyIndicator($.ajax("/ws_restful_data_controller/manifest_details?MANIFEST_ID=" + sManifestId).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                self.mDetails.setData(oResponseData);
            }));
        },

        loadHistory: function(sManifestId) {
            this.mHistory.setData([]);
            var self = this;
            return Utilities.showBusyIndicator($.ajax("/ws_restful_data_controller/manifest_history?MANIFEST_ID=" + sManifestId).done(function(oResponseData) {
                self.mHistory.setData(oResponseData);
            }));
        },

        refreshHistory: function(oEvent) {
            this.loadHistory(this.mKey.getData());
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities));