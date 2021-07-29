jQuery.sap.require("dep.fiori.lib.controller.ListControllerBase");
jQuery.sap.require("dep.fiori.lib.util.Filter");
jQuery.sap.require("dep.fiori.lib.util.Utilities");

(function(ListControllerBase, Filter, Utilities) {
    ListControllerBase.extend("dep.fiori.backhaul.app.list", {
        onInit: function() {
            this.setKey("MANIFEST_ID");
            this.setODataServiceUrl("/dep/odata");
            this.setSortFragment("dep.fiori.backhaul.app.listSort");
            ListControllerBase.prototype.onInit.apply(this, arguments);
            
            $.ajax("/ws_restful_data_controller/container_status_list").done(function(aResponseData) {
                aResponseData = aResponseData || [];
                this.getView().setModel(new sap.ui.model.json.JSONModel(aResponseData), "status_list");
            }.bind(this));
        },

        onItemPress: function(oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            var oContext = oListItem.getBindingContext("odata");
            var oObject = oContext.getObject();
            
            Utilities.navToExternal("#depManifest-display&/" + oObject.MANIFEST_ID + "/containerdetails");
        },
        
        getFilterItems: function() {
            return [
                { key: "CONTAINER_ID", label: "{i18n>Container.id}" },
                { key: "MANIFEST_ID", label: "{i18n>Manifest.id}" },
                { key: "CONTAINER_STATUS", label: "{i18n>Container.status}", type: Filter.InputType.MultiSelect,
                  items: { path: "status_list>/", key: "{status_list>STATUS_ID}", text: "{status_list>CONTAINER_STATUS}" } },
                { key: "SOURCE_LOC", label: "{i18n>Container.sourceLoc}" },
                { key: "TARGET_LOC", label: "{i18n>Container.targetLoc}" }
            ];
        }
    });
}(dep.fiori.lib.controller.ListControllerBase, dep.fiori.lib.util.Filter, dep.fiori.lib.util.Utilities));