jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");
jQuery.sap.require("dep.fiori.lib.util.Print");

(function(ListControllerBase, Filter, Print) {
    ListControllerBase.extend("dep.fiori.materialdoc.app.list", {
        onInit: function() {
            this.setKey("MBLNR");
            this.setSortFragment("dep.fiori.materialdoc.app.listSort");
            this.setPrintObjType(Print.ObjectType.MaterialDocument);
            ListControllerBase.prototype.onInit.apply(this, arguments);
        },
        
        getFilterItems: function() {
            return [
                { key: "MBLNR", label: "{i18n>Document.number}" },
                { key: "BWART", label: "{i18n>Document.movementType}" },
                { key: "BUDAT", label: "{i18n>Document.postDate}", type: Filter.InputType.DateRange },
                { key: "UMWRK", label: "{i18n>Document.toPlant}" },
                { key: "AUFNR", label: "{i18nGlobal>General.workorder}" },
                { key: "EBELN", label: "{i18n>Document.purchaseOrder}" },
                this.getEdgeErrorFilterItem()
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.Filter, dep.fiori.lib.util.Print));