jQuery.sap.require("dep.fiori.lib.controller.DetailControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(DetailControllerBase, Utilities) {
    DetailControllerBase.extend("dep.fiori.purchaseorder.app.service", {
        onInit: function() {
            this.setKey([ "PO_NUMBER", "SHEET_NO_LOCAL" ]);
            this.setDetailRoute("service");
            DetailControllerBase.prototype.onInit.apply(this, arguments);

            this.mOrder = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mOrder);

            this.mItems = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(this.mItems, "items");
        },

        loadData: function(oKey) {
            this.mOrder.setData(oKey);
            Utilities.showBusyIndicator(this.loadItems());
        },

        loadItems: function() {
            this.mItems.setData([]);
            var sQuery = Utilities.getQueryString({
                SHEET_NO_LOCAL: this.mOrder.getProperty("/SHEET_NO_LOCAL")
            });

            var sURL = "/ws_restful_data_controller/service_entry_sheets" + sQuery;

            var self = this;
            return $.ajax(sURL).done(function(aResponseData) {
                self.mItems.setData(aResponseData);
            });
        },

        refresh: function(oEvent) {
            Utilities.showBusyIndicator(this.loadItems());
        },

        onEditPress: function(oEvent) {
            var oListItem = oEvent.getSource();
            var oContext = oListItem.getBindingContext("items");
            var oItem = oContext.getObject();
            console.log(oItem)
        }
    });
}(dep.fiori.lib.controller.DetailControllerBase, dep.fiori.lib.util.Utilities));