jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");

(function(ListControllerBase) {
    ListControllerBase.extend("dep.fiori.report.app.list", {
        onInit: function() {
            this.setKey([ "TCODE", "REPVAR" ]);
            this.setDetailRoute("display");
            this.setSortFragment("dep.fiori.report.app.listSort");
            ListControllerBase.prototype.onInit.apply(this, arguments);
        },
        
        getFilterItems: function() {
            return [
                { key: "TCODE", label: "{i18n>TCODE}" },
                { key: "REPVAR", label: "{i18n>REPVAR}" }
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase));