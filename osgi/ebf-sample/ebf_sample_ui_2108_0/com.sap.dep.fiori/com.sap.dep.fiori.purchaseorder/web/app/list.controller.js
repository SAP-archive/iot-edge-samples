jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");

(function(ListControllerBase, Filter) {
    ListControllerBase.extend("dep.fiori.purchaseorder.app.list", {
        onInit: function() {
            this.setKey("EBELN");
            this.setSortFragment("dep.fiori.purchaseorder.app.listSort");
            ListControllerBase.prototype.onInit.apply(this, arguments);
            
            this.getView().setModel(new sap.ui.model.json.JSONModel([
                { key: "M", text: this.getText("Type.M"), additionalText: "M" },
                { key: "S", text: this.getText("Type.S"), additionalText: "S" },
                { key: "B", text: this.getText("Type.B"), additionalText: "B" }
            ]), "poTypes");
        },

        typeFormatter: function(sPOTYP) {
            var sText = this.getText("Type." + sPOTYP);
            if (sText === "Type." + sPOTYP) {
                return sPOTYP;
            }
            return sText || sPOTYP;
        },
        
        getFilterItems: function() {
            return [
                { key: "EBELN", label: "{i18n>Order.number}" },
                { key: "BEDAT", label: "{i18nGlobal>General.date}", type: Filter.InputType.DateRange },
                { key: "POTYP", label: "{i18n>Order.type}", type: Filter.InputType.MultiSelect,
                  items: { path: "poTypes>/", key: "{poTypes>key}", text: "{poTypes>text}", additionalText: "{poTypes>additionalText}" } },
                this.getEdgeErrorFilterItem()
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.Filter));