jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities) {
    DetailControllerBase.extend("dep.fiori.container.app.detail", {
        onInit: function() {
            this.setKey("CONTAINER_ID");
            DetailControllerBase.prototype.onInit.apply(this, arguments);
            this.mKey = this.getView().getModel(this.getKey());
            this.mContainer = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mContainer, "container");
            this.mAttributes = new sap.ui.model.json.JSONModel();
            this.getView().setModel(this.mAttributes, "attributes");
            
        },

        loadData: function(sContainerId) {
            this.loadContainer(sContainerId);
            this.loadAttributes(sContainerId);
        },

        loadContainer: function(sContainerId) {
            this.mContainer.setData([]);
            var self = this;
            return Utilities.showBusyIndicator($.ajax("/ws_restful_data_controller/container?CONTAINER_ID=" + sContainerId).done(function(oResponseData) {
                if (Array.isArray(oResponseData)) {
                    oResponseData = oResponseData[0];
                }
                self.mContainer.setData(oResponseData);
            }));
        },

        loadAttributes: function(sContainerId) {
            this.mAttributes.setData([]);
            var self = this;
            return Utilities.showBusyIndicator($.ajax("/ws_restful_data_controller/container_details?CONTAINER_ID=" + sContainerId).done(function(oResponseData) {
                self.mAttributes.setData(oResponseData);
            }));
        },

        refreshAttributes: function(oEvent) {
            this.loadAttributes(this.mKey.getData());
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities));