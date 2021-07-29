jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");

(function(ListControllerBase) {
    ListControllerBase.extend("dep.fiori.goodsissue.app.list", {
    
        onInit: function() {
            this.setKey("AUFNR");
            this.setSortFragment("dep.fiori.goodsissue.app.workorderSort");
            ListControllerBase.prototype.onInit.apply(this, arguments);
        },
        
        getFilterItems: function() {
            return [
                { key: "AUFNR", label: "{i18n>Workorder.number}" },
                { key: "KTEXT", label: "{i18nGlobal>General.description}" },
                { key: "SYSTEM_STATUS", label: "{i18n>Workorder.systemStatus}" }
            ];
        }
        
    });
}(dep.fiori.lib.controller.ListControllerBase));