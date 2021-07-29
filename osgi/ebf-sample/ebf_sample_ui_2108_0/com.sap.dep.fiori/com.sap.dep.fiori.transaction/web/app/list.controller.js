jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");

(function(ListControllerBase) {
    ListControllerBase.extend("dep.fiori.transaction.app.list", {
        onInit: function() {
            this.setKey("TRANSID")
            this.setSortFragment("dep.fiori.transaction.app.listSort");

            ListControllerBase.prototype.onInit.apply(this, arguments);
        },

        onRouteMatched: function(oEvent) {
            if (oEvent.getParameter("name") === "display") {
                // Force table refresh in case an error has been dismissed
                this.getTable().getBinding("items").refresh();
            }
        },
        
        getFilterItems: function() {
            return [
                { key: "TRANSID", label: "{i18nGlobal>General.transaction}" }
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase));