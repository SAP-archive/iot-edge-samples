jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.DataAccess");
jQuery.sap.require("dep.fiori.lib.util.Filter");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(ListControllerBase, DataAccess, Filter, Utilities) {
    ListControllerBase.extend("dep.fiori.notification.app.list", {
        onInit: function() {
            this.setKey([ "AUFNR", "QMNUM" ]);
            this.setSortFragment("dep.fiori.notification.app.listSort");
            ListControllerBase.prototype.onInit.apply(this, arguments);
            
            var oSorter = new sap.ui.model.Sorter("AUFNR", true);
            var oBinding = this.getTable().getBinding("items");
            oBinding.sort(oSorter);
        },
        
        getFilterItems: function() {
            return [
                { key: "QMNUM", label: "{i18n>Notification.number}" },
                { key: "AUFNR", label: "{i18n>WorkOrder.number}" },
                { key: "EQUNR", label: "{i18nGlobal>General.equipment}" },
                { key: "QMTXT", label: "{i18nGlobal>General.description}" },
                { key: "QMDAT", label: "{i18n>Notification.date}", type: Filter.InputType.DateRange },
                { key: "WO_EXISTS", label: "{i18n>WorkOrder.exists}", type: Filter.InputType.Boolean,
                  compareValue: "X", filterOperator: sap.ui.model.FilterOperator.EQ },
                this.getEdgeErrorFilterItem()
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.DataAccess, dep.fiori.lib.util.Filter, dep.fiori.lib.util.Utilities));