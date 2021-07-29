jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(ListControllerBase, Utilities) {
    ListControllerBase.extend("dep.fiori.planningdoc.app.list", {
        onInit: function() {
            this.setKey("PLANDOC_ID");
            this.setSortFragment("dep.fiori.planningdoc.app.listSort");
            ListControllerBase.prototype.onInit.apply(this, arguments);
            
            var oSorter = new sap.ui.model.Sorter("PLANDOC_ID", true);
            var oBinding = this.getTable().getBinding("items");
            oBinding.sort(oSorter);
        },
        
        getFilterItems: function() {
            return [
                { key: "PLANDOC_ID", label: "{i18n>PlanDoc.id}" },
                { key: "MRP_NUMBER", label: "{i18n>MRP.number}" },
                { key: "DESCRIPTION", label: "{i18nGlobal>General.description}" },
                { key: "CREATED_TS", label: "{i18n>PlanDoc.date}" }
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.Utilities));