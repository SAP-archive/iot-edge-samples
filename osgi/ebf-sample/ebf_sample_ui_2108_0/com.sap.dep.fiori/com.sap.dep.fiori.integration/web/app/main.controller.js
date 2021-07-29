jQuery.sap.require("sap.ui.core.util.File");

(function(File) {
    sap.ui.controller("dep.fiori.integration.app.main", {
        onInit: function() {},

        onConfirm: function(oEvent) {
            var oTemplate = this.getView().byId("integrationPoints").getTemplate();
            var sTemplate = JSON.stringify(oTemplate);
            File.save(sTemplate, "download", "json");
        }
    });
})(sap.ui.core.util.File);