jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");
jQuery.sap.require("dep.fiori.lib.util.Print");

(function(ListControllerBase, Filter, Print) {
    ListControllerBase.extend("dep.fiori.inventory.app.list", {
        onInit: function() {
            this.setKey([ "INV_NO_LOCAL", "LGORT", "GJAHR" ]);
            this.setSortFragment("dep.fiori.inventory.app.listSort");
            this.setPrintObjType(Print.ObjectType.PhysicalInventoryDocument);
            ListControllerBase.prototype.onInit.apply(this, arguments);
    
            var self = this;
            this.oLookupPromise = $.ajax("/ws_restful_data_controller/storage_location").done(function(oResponseData) {
                oResponseData = oResponseData || [];
                self.getView().setModel(new sap.ui.model.json.JSONModel(oResponseData), "locations");
            });
        },
        
        getFilterItems: function() {
            return [
                { key: "DSTAT", label: "{i18nGlobal>General.status}", type: Filter.InputType.Boolean,
                  compareValue: "X", filterOperator: sap.ui.model.FilterOperator.EQ, 
                  trueText: "{i18n>CountStatus.closed}", falseText: "{i18n>CountStatus.open}" },
                { key: "INV_NO_LOCAL", label: "{i18n>Inventory.localNumber}" },
                { key: "IBLNR", label: "{i18n>Inventory.number}" },
                { key: "LGORT", label: "{i18nGlobal>General.location}", type: Filter.InputType.MultiSelect,
                  items: { path: "locations>/", key: "{locations>LGORT}", text: "{locations>LGORT}" } },
                this.getEdgeErrorFilterItem()
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.Filter, dep.fiori.lib.util.Print));