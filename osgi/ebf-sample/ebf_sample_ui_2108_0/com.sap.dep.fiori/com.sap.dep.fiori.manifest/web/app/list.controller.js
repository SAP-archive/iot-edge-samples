jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");

(function(ListControllerBase, Filter) {
    ListControllerBase.extend("dep.fiori.manifest.app.list", {
        onInit: function() {
            this.setKey("MANIFEST_ID");
            this.setODataServiceUrl("/dep/odata");
            this.setSortFragment("dep.fiori.manifest.app.listSort");
            var self = this;
            $.ajax("/ws_restful_data_controller/container_status_list").done(function(aResponseData) {
                aResponseData = aResponseData || [];
                self.getView().setModel(new sap.ui.model.json.JSONModel(aResponseData), "status_list");
            });
            ListControllerBase.prototype.onInit.apply(this, arguments);
        },
        
        getFilterItems: function() {
            return [
                { key: "MANIFEST_ID", label: "{i18n>Manifest.id}" },
                { key: "CONTAINER_ID", label: "{i18n>Container.id}" },
                { key: "CONTAINER_STATUS", label: "{i18n>Container.status}", type: Filter.InputType.MultiSelect,
                  items: { path: "status_list>/", key: "{status_list>STATUS_ID}", text: "{status_list>CONTAINER_STATUS}" } },
                { key: "SOURCE_LOC", label: "{i18n>Container.sourceLoc}" },
                { key: "TARGET_LOC", label: "{i18n>Container.targetLoc}" }
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.Filter));